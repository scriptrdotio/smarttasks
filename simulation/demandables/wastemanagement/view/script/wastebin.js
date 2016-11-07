
/**
 * @class WasteBin
 * @constructor
 * @param {Object} [dto]
 * @param {String} [dto.id]: bin's id
 * @param {Number} [dto.lat]
 * @param {Number} [dto.lon]
 * @param {Boolean} [dto.capaciy] (remaining capacity )
 * @param {Object} [dto.map] : google map instance
 */
function WasteBin(dto) {
 
  this.id = dto.id;
  this.location = dto.lat + "," +  dto.lon;
  this.capacity = dto.capacity;
  this.map = dto.map;
  this.marker = null;
  this.isTarget = dto.isTarget ? dto.isTarget : false;
}

WasteBin.prototype.setLocation - function(lat, lon) {
  this.location = lat + "," + lon;
};

WasteBin.prototype.getLocation = function() {
  return this.location;
};

WasteBin.prototype.reset = function() {
  
  this.capacity = 100;
  this.isTarget = false;
  this.draw();
  
  // notify bin service of status change
  var dto = {
    
    api: "simulation/demandables/wastemanagement/api/resetBin",
    method: "POST",
    params: {binId:this.id}, 
    onSuccess: function(data) {
      console.log(data);
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };
  
  self.scriptrio.request(dto);  
}

WasteBin.prototype.setCapacity = function(capacity) {
  
  this.capacity = capacity;
  this.draw();
  
  // notify bin service of status change
  var dto = {
    
    api: "demandables/api/service/wastemgt/updateCapacity",
    method: "POST",
    params: {id:this.id, capacity:this.capacity}, 
    onSuccess: function(data) {
      console.log(data);
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };
  
  self.scriptrio.request(dto);  
};

WasteBin.prototype.setTarget = function(isTarget) {
  
  this.isTarget = isTarget;
  this.draw();
};

WasteBin.prototype.isTargetSpot = function() {
  return this.isTarget;
};

WasteBin.prototype.draw = function() {
  
  var location = this.getLocation();
  var coords = location.split(",");
  var icon = "";
  if (this.isTargetSpot()) {
     icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  }else {
    
    if (this.capacity >= 50) {
      icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    }
    
    if (this.capacity >= 10 && this.capacity < 50){
      icon = "http://maps.google.com/mapfiles/ms/icons/orange-dot.png";
    }
    
    if (this.capacity < 10){
      icon = "http://maps.google.com/mapfiles/ms/icons/red-dot.png";
    }
  }
  
  if (!this.marker || icon != this.marker.icon) {
   
    if (this.marker) {
      this.marker.setMap(null);
    }
    
    this.marker = new google.maps.Marker({

      position: {lat:Number(coords[0]), lng: Number(coords[1])},
      map: this.map,
      icon: icon,
      title: "id: " +  this.id + ", capacity:" + this.capacity
    });
  }
};
