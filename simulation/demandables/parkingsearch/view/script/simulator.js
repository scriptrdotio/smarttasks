var util = "/demandables/util";

var MAX_CARS = 4;
var PROCESS_PREFIX = "demandables_";
var SIM_CENTER = {lat: 40.683009, lon:-73.998143}; 
var SIM_RADIUS = 400; // meters

function Simulator(config, map, scriptrio) {
  
  this.config = config ? config : {};
  this.map = map;
  this.maxCars = config.maxCars ? config.maxCars : MAX_CARS;
  this.carList = [];
  this.parkingSpotMgr = new ParkingSpotManager({map:this.map});
  this.scriptrio = scriptrio;
  this.center = config.simCenter ? config.simCenter : SIM_CENTER;
  this.radius = config.simRadius ? config.simRadius : SIM_RADIUS;
  this.processId = generateId(this.config.processPrefix ? this.config.processPrefix : PROCESS_PREFIX); // from util
}

Simulator.prototype.init = function(){
  
  var self = this;
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://parkingfinder.scriptrapps.io/simulation/demandables/parkingsearch/api/createParkingSpots");
  xhr.onload = function() {
  	self.listParkingSpots();   
  }
  xhr.send();  
};

Simulator.prototype.createCar = function() {
  
  var self = this;
  var currentLocation = randomLocation(this.center.lat, this.center.lon, this.radius); // from util
  var payload = {
    
    "processId": this.processId, 
    "module": "/demandables/workers/parkingspotseeker", 
    "type": "ParkingSpotSeeker",
    "params": JSON.stringify({"currentLocation": currentLocation.lat + "," + currentLocation.long})
  };
  
  var dto = {

      api: "demandables/api/worker/create",
      method: "POST",
      params: payload, 
      onSuccess: function(data) {    
        self.addCar.call(self, data);
      }, 
      onFailure: function(error) {
        console.log(error);
      } 
    };
  
    this.scriptrio.request(dto); 
};
  
Simulator.prototype.addCar = function(data) {
  
  var car = new Car(data, this.scriptrio, this.parkingSpotMgr);
  this.carList.push(car);
  car.run(true); // start
};

Simulator.prototype.listParkingSpots = function() {
  
  var self = this;
  var payload = {
    
    "lat": this.center.lat, 
    "lon": this.center.lon,
    "radius": 200
  };
  
  var dto = {

    api: "demandables/api/service/parking/listSpots",
    method: "POST",
    params: payload, 
    onSuccess: function(data) {    
      
      // add the parking spots to the map
      self.addParkingSpots.call(self, data);
      
      // add the cars to the map
      for (var i = 0; i < self.maxCars; i++) {
        self.createCar();
      }
    }, 
    onFailure: function(error) {
      console.log(error);
    } 
  };

  this.scriptrio.request(dto); 
};

Simulator.prototype.addParkingSpots = function(result) {
  
  for (var i = 0; i < result.length; i++) {
    
    var spot = new ParkingSpot({id: result[i].id, lat: result[i].latitude, lon: result[i].longitude, status:result[i].available, map:this.map});
    this.parkingSpotMgr.addParkingSpot(spot);   
    spot.draw();
  }
};