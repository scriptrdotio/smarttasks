var util = "/demandables/util";

var MAX_TRUCKS = 3;
var PROCESS_PREFIX = "demandables_";
var SIM_CENTER = {lat: 40.850600, lon: -73.903616};
var SIM_RADIUS = 400; // meters

function Simulator(config, map, scriptrio) {
  
  this.config = config ? config : {};
  this.map = map;
  this.maxTrucks = config.maxTrucks ? config.maxTrucks : MAX_TRUCKS;
  this.truckList = [];
  this.scriptrio = scriptrio;
  this.center = config.simCenter ? config.simCenter : SIM_CENTER;
  this.radius = config.simRadius ? config.simRadius : SIM_RADIUS;
  this.processId = generateId(this.config.processPrefix ? this.config.processPrefix : PROCESS_PREFIX); // from util
  this.wasteBinManager = new WasteBinManager({map:this.map, center: this.center, radius: this.radius, scriptrio: this.scriptrio});
}

Simulator.prototype.init = function(){
  
  var self = this;
  var dto = {

    api: "simulation/demandables/wastemanagement/api/createWasteBins",
    method: "POST",
    params: {processId: this.processId}, 
    onSuccess: function(data) {    
      self.listWasteBins();   
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };

  this.scriptrio.request(dto); 
};

Simulator.prototype.stop = function(){
  
  var dto = {

    api: "simulation/demandables/wastemanagement/api/stop",
    method: "POST",
    params: {processId: this.processId}, 
    onSuccess: function(data) {    
      console.log(JSON.stringify(data));  
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };

  this.scriptrio.request(dto); 
};

Simulator.prototype.createTruck= function() {
  
  var self = this;
  var currentLocation = randomLocation(this.center.lat, this.center.lon, this.radius); // from util
  var payload = {
    
    "processId": this.processId, 
    "module": "/demandables/workers/wastebincollector", 
    "type": "WasteBinCollector",
    "params": JSON.stringify({"currentLocation": currentLocation.lat + "," + currentLocation.long})
  };
  
  var dto = {

      api: "demandables/api/worker/create",
      method: "POST",
      params: payload, 
      onSuccess: function(data) {    
        self.addTruck.call(self, data);
      }, 
      onFailure: function(error) {
        console.log(error);
      } 
    };
  
    this.scriptrio.request(dto); 
};
  
Simulator.prototype.addTruck = function(data) {
  
  var truck = new Truck(data, this.scriptrio, this.wasteBinManager);
  this.truckList.push(truck);
  truck.run(true); // start
};

Simulator.prototype.listWasteBins = function() {
  
  var self = this;
  var payload = {
    
    "center": this.center.lat + "," + this.center.lon,
    "radius": 200
  };
  
  var dto = {

    api: "demandables/api/service/wastemgt/listBins",
    method: "POST",
    params: payload, 
    onSuccess: function(data) {    
      
      // add the bin to the map
      self.addWasteBins.call(self, data);
      
      // add the trucks to the map
      for (var i = 0; i < self.maxTrucks; i++) {
        self.createTruck();
      }
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };

  this.scriptrio.request(dto); 
};

Simulator.prototype.addWasteBins = function(result) {
  
  var bins = [];
  for (var i = 0; i < result.length; i++) {
    
    var bin = new WasteBin({id: result[i].id, lat: result[i].latitude, lon: result[i].longitude, capacity:result[i].capacity, map:this.map});   
    bin.draw();
    bins.push(bin);
  } 
  
  this.wasteBinManager.setWasteBins(bins);   
};