/**
 * @class ParkingSpotManager
 * @constructor
 * @param {Object} [dto]
 * @param {Object} [dto.map]: the Google map instance to draw spots on
 */
function ParkingSpotManager(dto) {
  
  this.map = dto.map;
  this.parkingSpots = [];
}

/**
 * @method getParkingSpots
 */
ParkingSpotManager.prototype.listParkingSpots = function() {
  return this.parkingSpots;
};

/**
 * @method setParkingSpots
 * @param {Array} spotList: array of ParkingSpot instances,
 */
ParkingSpotManager.prototype.setParkingSpots = function(spotList) {
  this.parkingSpots = spotList;
};

/**
 * @method getParkingSpot
 * @param {Number} index
 * @return {Object} return the parking spot instance ath the specified index  (null if invalid index)
 */
ParkingSpotManager.prototype.setParkingSpots = function(spot) {
  
  if (index >= 0 && index < this.parkingSpots.length) {
 	return this.parkingSpots[index];   
  }
 
  return null;
};

/**
 * @method addParkingSpot
 * @param {Object} spot: instance of ParkingSpot,
 */
ParkingSpotManager.prototype.addParkingSpot = function(spot) {
  this.parkingSpots.push(spot);
};

/**
 * Search for a given parking spot 
 * @method getParkingSpotByLocation
 * @param {String} location
 * @return {Object} instance of ParkingSpot, if found, null otherwise
 */
ParkingSpotManager.prototype.getParkingSpotByLocation = function(location) {
  
  var spot = null;
  for (var i = 0; i < this.parkingSpots.length && !spot; i++) {
    spot = this.parkingSpots[i].location  == location ? this.parkingSpots[i] : null;
  }
  
  return spot;
};
