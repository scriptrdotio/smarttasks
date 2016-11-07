const REFRESH_RATE = 5000;

/**
 * @class WasteBinManager
 * @constructor
 * @param {Object} [dto]
 * @param {Object} [dto.map]: the Google map instance to draw spots on
 * @param {String} [dto.center]: the center of the map
 * @param {Numeric} [dto.radius]: search radius 
 * @param {Object} [dto.scriptrio]: scriptrio client
 */
function WasteBinManager(dto) {
  
  this.map = dto.map;
  this.wasteBins = [];  
  this.center = dto.center
  this.radius = dto.radius;
  this.scriptrio = dto.scriptrio;
}

/**
 * @method listWasteBins
 */
WasteBinManager.prototype.listWasteBins = function() {
  return this.wasteBins;
};

/**
 * @method setWasteBins
 * @param {Array} binList: array of WasteBin instances,
 */
WasteBinManager.prototype.setWasteBins = function(binList) {
  
  // if first time filling the bins list, start the timer to reguarly update the capacity status
  var self = this;
  if (this.wasteBins.length == 0) {
    
    this.timer = setInterval(
      
      function(){
      	self.refreshWasteBinData.apply(self)
      },
      REFRESH_RATE);
  }
  
  this.wasteBins = binList;
  this.wasteBins.search = function(id) {
 
    var obj = null;
    for (var i = 0; i < this.length && obj == null; i++) {
      obj = (this[i].id == id) ? this[i] : null;
    }

    return obj;
  };
};

/**
 * @method getWasteBin
 * @param {Number} index
 * @return {Object} return the parking spot instance ath the specified index  (null if invalid index)
 */
WasteBinManager.prototype.getWasteBin = function(index) {
  
  if (index >= 0 && index < this.wasteBins.length) {
 	return this.wasteBins[index];   
  }
 
  return null;
};

/**
 * @method addWasteBin
 * @param {Object} bin: instance of WasteBin,
 */
WasteBinManager.prototype.addWasteBin = function(bin) {
  this.wasteBins.push(bin);
};

/**
 * Search for a given bin
 * @method getWasteBinByLocation
 * @param {String} location
 * @return {Object} instance of WasteBin, if found, null otherwise
 */
WasteBinManager.prototype.getWasteBinByLocation = function(location) {
  
  var bin = null;
  for (var i = 0; i < this.wasteBins.length && !bin; i++) {
    bin = this.wasteBins[i].location  == location ? this.wasteBins[i] : null;
  }
  
  return bin;
};

/**
 * Refresh waste bin data
 * @method refreshWasteBinData 
 */
WasteBinManager.prototype.refreshWasteBinData = function(location) {
  
  var self = this;
  var dto = {

    api: "simulation/demandables/wastemanagement/api/simulateUsage",
    method: "GET",     
    onSuccess: function(data) {    
      
      // refresh waste bins
      for (var i = 0; i < data.length; i++) {
    
        var newCapacity = data[i].capacity;
        var bin = self.wasteBins.search(data[i].id);
        if (bin) {
          
          bin.capacity = newCapacity;
          bin.draw();
        }       
      }
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };

  this.scriptrio.request(dto); 
};
