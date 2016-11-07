var CAR_ICON = "http://icons.iconarchive.com/icons/iconshow/transport/64/Sportscar-car-icon.png";
var MIN_INTERVAL = 1500;

/**
 * @class Car
 * @constructor
 * @param {Object} [dto] // initialization parameters of the car
 * @param {String} [dto.id]
 * @param {String} [dto.processId]
 * @param {Object} [dto.map]: google map object
 * @param {Object} [dto.parkingSpotManager]: shared instance of ParkingSpotManager
 * @param {Object} [dto.currentLocation] : {lat, long}
 * @param {Object} [dto.purpose]: as returned by Provider
 * @param {Object} [dto.config]: configuration, could be from config file or ad-hoc
 * @param {Object} scriptrio: scriptr.io client 
 */
function Car(dto, scriptrio, parkingSpotManager) {
  
  this.id = "";
  this.processId = "";
  this.map = map;
  this.parkingSpotManager = parkingSpotManager;
  this.spot = null; // ParkingSpot instance connected to the purpose
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

Car.prototype.run = function(start) {
  
  try {

    var self = this;
    if (start && !this.started) {
      this.started = true;
    }else {
      start = false;
    }

    var onSuccess = function(data) {
	
      try {
        
        if (data.purposeAchieved) {      

          self.purposeAchieved = true;
          self.routeIndex = 0;
          if (self.timer) {          
            clearInterval(self.timer);
          }

          self.spot.setTarget(false);
          self.spot.setStatus(false);
          console.log(self.id + " reached its target");
        }else {

          // if needed replace purpose 
          var currentPurpose = self.getPurpose();
          if (!currentPurpose || (currentPurpose.targetLocation != data.purpose.targetLocation)) {

              if (currentPurpose) {
                console.log(self.id + " changing target from " + currentPurpose.id + 
                            "(" + currentPurpose.targetLocation + ") to " + data.purpose.id + "(" + data.purpose.targetLocation + ")");
              }

              if (self.purpose) {
                self.erasePurpose();
              }

              self.setPurpose(data.purpose);
              self.drawPurpose();
              currentPurpose = data.purpose;           
              if (self.timer) {          
                clearInterval(self.timer);
              }

              var speed = Math.round(data.purpose.route.duration / data.purpose.route.points.length) * 1000;
              var minInterval = self.config && self.config.minInterval ? self.config.minInterval : MIN_INTERVAL;
              speed = speed < MIN_INTERVAL ? MIN_INTERVAL : speed; 
              self.timer = setInterval(
                function() {
                  self.run();}, speed);     
          }

          if (self.purpose) {
           
            // erase car from old position
            self.erase();
            // move to next point in route
            if (self.routeIndex <  currentPurpose.route.points.length - 1) {
              self.routeIndex += 1;
            }

            console.log(self.id + "," + ((self.spot) ? "moving to " + (self.spot.id) : "unassigned"));
            self.setLocation(currentPurpose.route.points[self.routeIndex][0], currentPurpose.route.points[self.routeIndex][1]);
            // draw car on new position 
            self.draw();
          }  
      	}
      }catch(exception){
        console.log(exception);
      }
    };

    var onFailure = function(error) {
      console.log(error);
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

Car.prototype.stopRun = function() {
  
  if(this.timer > -1) {
    clearInterval(this.timer);
  }
}

Car.prototype.setLocation = function(lat, long) {  
  this.currentLocation = lat + "," + long;
};

Car.prototype.getLocation = function() {
  return this.currentLocation;
};

Car.prototype.setPurpose = function(purpose) {
  
  this.purpose = purpose;
  this.routeIndex = 0;
};

Car.prototype.getPurpose = function() {
  return this.purpose;
};

Car.prototype.draw = function() {
  
  var location = this.getLocation();
  var coords = location.split(",");
  this.marker = new google.maps.Marker({
    
    position: {lat:Number(coords[0]), lng: Number(coords[1])},
    map: this.map,
    icon: "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png",
    title: "id:" +  this.id + ", heading to:" +  this.purpose.id + "(" + this.purpose.targetLocation + ")"
  });
};

Car.prototype.erase = function() {
  
  if (this.marker) {
    this.marker.setMap(null);
  }
};

Car.prototype.drawPurpose = function() {
  
  var purpose = this.getPurpose();
  if (!this.spot && purpose) {
    this.spot = this.parkingSpotManager.getParkingSpotByLocation(purpose.targetLocation);
  }
 
  if (this.spot) {
    this.spot.setTarget(true);
  }
};

Car.prototype.erasePurpose = function() {
  
  if (this.spot) {    
    
    this.spot.setTarget(false);
    this.spot = null;
  }
};