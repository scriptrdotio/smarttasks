var MIN_INTERVAL = 3500;
var CHECK_INTERVAL = 7000;

/**
 * @class Truck
 * @constructor
 * @param {Object} [dto] // initialization parameters of the truck
 * @param {String} [dto.id]
 * @param {String} [dto.processId]
 * @param {Object} [dto.map]: google map object
 * @param {Object} [dto.wasteBinManager]: shared instance of WasteBinManager
 * @param {Object} [dto.currentLocation] : {lat, long}
 * @param {Object} [dto.purpose]: as returned by Provider
 * @param {Object} [dto.config]: configuration, could be from config file or ad-hoc
 * @param {Object} scriptrio: scriptr.io client 
 */
function Truck(dto, scriptrio, wasteBinManager) {
  
  this.id = "";
  this.processId = "";
  this.map = map;
  this.wasteBinManager = wasteBinManager;
  this.bin = null; // WasteBin instance connected to the purpose
  this.currentLocation = "";
  this.purpose = null;
  this.routeIndex = 0; // progression in route (point index)
  this.started = false;
  this.timer = -1;
  this.purposeAchieved = false;
  this.scriptrio = scriptrio;
  if (dto) {
    
    for (var prop in dto){
      this[prop] = dto[prop];
    }
  }
}

Truck.prototype.run = function(start) {
  
  try {

    var self = this;
    if (start && !this.started) {
      
      this.started = true;
      this.draw();
      
      // set timer to regularly check if purpose is available (full bin)
      this.timer = setInterval(
        function() {
          self.run();}, CHECK_INTERVAL);           
    }else {
      start = false;
    }

    var onSuccess = function(data) {
	
      try {
        
        // if purpose achieved, reset timer to check target interval and clear purpose.
        // reset bin capacity to 100 and switch it back to the unassigned status
        if (data.purposeAchieved) {      

          console.log(self.id + " reached its target");
          
          // reset bin (unassigned, capacity 100)
          self.bin.reset();
          self.bin = null;
          
          // restart
          self.start = true;
          self.purpose = null;
          self.routeIndex = 0;          
          self.purposeAchieved = false;
          if (self.timer) {         
            clearInterval(self.timer);            
          }
          
          self.run(start);
        }else {

          // if needed replace purpose (only if purpose available, which might not be the case)
          var currentPurpose = self.getPurpose();
          var speed = MIN_INTERVAL;
          var minInterval = self.config && self.config.minInterval ? self.config.minInterval : MIN_INTERVAL;
          if (data.purpose && data.purpose.targetLocation) {            
                        
            if (!currentPurpose) {
              
              console.log(self.id + " setting target to " + data.purpose.id + "(" + data.purpose.targetLocation + ")");  
              self.setPurpose(data.purpose);
              
              // calculate average truck speed to destination
              speed = Math.round(data.purpose.route.duration / data.purpose.route.points.length) * 1000;
              speed = speed <= minInterval ? speed : minInterval;

              // change the timer frequency according to the average estimated truck speed to destination
              if (self.timer) {          
                clearInterval(self.timer);
              }
              
              self.timer = setInterval(
                  function() {
                    self.run();}, speed); 
              }
            
              // set target bin color to blue  
              self.drawPurpose();
            }
          
            // move to next point in route
            if (currentPurpose && self.routeIndex <  currentPurpose.route.points.length - 1) {

               // erase truck from old position
              self.erase();
              self.routeIndex += 1;console.log(self.id + "," + ((self.bin) ? "moving to " + (self.bin.id) : "unassigned"));
              self.setLocation(currentPurpose.route.points[self.routeIndex][0], currentPurpose.route.points[self.routeIndex][1]);          
              
              // draw truck  
              self.draw();
            }           
          }          
          
      }catch(exception){
        console.log(exception);
      }
    };

    var onFailure = function(error) {
      
      console.log(error);
      if (self.timer){
        clearInterval(self.timer);
      }
    };

     // run on the back-end
    var payload = {"id": this.id, "location": this.getLocation()};
    if (start) {
      payload.start = "true";
    }

    // Ask for purpose
    var dto = {

      api: "demandables/api/worker/mobile/run",
      method: "POST",
      params: payload, 
      onSuccess: onSuccess, 
      onFailure: onFailure 
    };
    
    self.scriptrio.request(dto);  
  }catch(exception) {
    console.log(exception);
  }
};

Truck.prototype.stopRun = function() {
  
  if(this.timer > -1) {
    clearInterval(this.timer);
  }
}

Truck.prototype.setLocation = function(lat, long) {  
  this.currentLocation = lat + "," + long;
};

Truck.prototype.getLocation = function() {
  return this.currentLocation;
};

Truck.prototype.setPurpose = function(purpose) {
  
  this.purpose = purpose;
  this.routeIndex = 0;
};

Truck.prototype.getPurpose = function() {
  return this.purpose;
};

Truck.prototype.draw = function() {
  
  var location = this.getLocation();
  var coords = location.split(",");
  var title = "id:" +  this.id;
  title += this.purpose ? ", heading to:" +  this.purpose.id + "(" + this.purpose.targetLocation + ")" : " idle";
  this.marker = new google.maps.Marker({
    
    position: {lat:Number(coords[0]), lng: Number(coords[1])},
    map: this.map,
    icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    title: title
  });
};

Truck.prototype.erase = function() {
  
  if (this.marker) {
    this.marker.setMap(null);
  }
};

Truck.prototype.drawPurpose = function() {
  
  var purpose = this.getPurpose();
  if (!this.bin && purpose) {
    this.bin = this.wasteBinManager.getWasteBinByLocation(purpose.targetLocation);
  }
 
  if (this.bin) {
    this.bin.setTarget(true);
  }
};

Truck.prototype.erasePurpose = function() {
  
  if (this.bin) {    
    
    this.bin.setTarget(false);
    this.bin = null;
  }
};