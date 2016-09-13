
/**
 * @class ParkingSpot
 * @constructor
 * @param {Object} [dto]
 * @param {String} [dto.id]: parking's id
 * @param {Number} [dto.lat]
 * @param {Number} [dto.lon]
 * @param {Boolean} [dto.status] (true == free / false == occupied )
 * @param {Object} [dto.map] : google map instance
 */
function ParkingSpot(dto) {
 
  this.id = dto.id;
  this.location = dto.lat + "," +  dto.lon;
  this.status = dto.status;
  this.map = dto.map;
  this.marker = null;
  this.isTarget = dto.isTarget ? dto.isTarget : false;
}

ParkingSpot.prototype.setLocation - function(lat, lon) {
  this.location = lat + "," + lon;
};

ParkingSpot.prototype.getLocation = function() {
  return this.location;
};

ParkingSpot.prototype.setStatus = function(status) {
  
  this.status = status;
  this.draw();
  
  // notify parking service of status change
  var dto = {
    
    api: "demandables/api/service/parking/updateAvailability",
    method: "POST",
    params: {id:this.id, availability:this.status}, 
    onSuccess: function(data) {
      console.log(data);
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };
  
  self.scriptrio.request(dto);  
}

ParkingSpot.prototype.setTarget = function(isTarget) {
  
  this.isTarget = isTarget;
  this.draw();
};

ParkingSpot.prototype.isTargetSpot = function() {
  return this.isTarget;
};

ParkingSpot.prototype.draw = function() {
  
  var location = this.getLocation();
  var coords = location.split(",");
  var icon = "";
  if (this.isTargetSpot()) {
     icon = "http://maps.google.com/mapfiles/ms/icons/blue-dot.png";
  }else {
    
      if (this.status) {
      icon = "http://maps.google.com/mapfiles/ms/icons/green-dot.png";
    }else {
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
      title: "id: " +  this.id + ", available:" + (this.status ? "yes" : "false")
    });
  }
};
