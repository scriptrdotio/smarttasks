# smarttasks

## About smart task assignment
The “demandables” (“smart task assignment”) framework provides the fundamental structure and behavior for the implementation of smart task assignment applications. The base concept behind smart task assignment is to decouple the execution of tasks from their assignment:  “workers” (task seekers) that are responsible for the execution of one or several tasks do not need to know the list of tasks beforehand but actually rely on a “task provider” to provide them with the correct task specification when needed. 
This generic approach is derivable into multiple applications, such as:
- Waste collection: every time a bin is collected, trucks needs to know the next bin to head to,
- Searching for an empty parking spot: available parking spots can be seen as tasks assigned to vehicles, where tasks can be reallocated dynamically (a spot has been taken while the vehicle was heading to it or if a nearby spot has become available),
- Delivering goods: trucks can deliver goods and get notified along the way of the next delivery to make. 

## Core model (/demandables)
- Worker: an abstraction of any entity that needs to execute a task at some point in time
  - A Worker has a “purpose”, which is a task that is assigned to it at a given point in time,
  -	A Worker can be “reassignable”, which means that it is possible to modify its purpose at hand before the latter is reached,
  -	A Worker can be “confirmable”, which means that even if the purpose is reached, this has to be confirmed by an external authority (e.g. client confirms that delivery has been made),
-	Mobile worker: a sub-type of Worker that has a location that can change in time,
-	Provider: a provider knows what task to assign to a given worker, based on any information it obtains from the latter (application of the Visitor design pattern), 
- Service: providers can use services when determining the task to assign to a worker. For example, a provider can use a ParkingService to obtain the list of nearby available parking spots before it determines the nearest parking spot to a given vehicle (worker).
```
+-------------+
|   Worker    |
|-------------|
|reassignable |
|confirmable  |               +------------+              +------------+
|purpose      |               |  Provider  |              |   Service  |
+-------------+_______________|------------|______________|------------|
|run          |               |------------|              |            |
|work         |               |getPurpose  |              +------------+ 
|stopRun      |               |            |
|stopWork     |               +------------+
+-------------+
       |
      / \
     ''|''
       |
       |
+-------------+
|MobileWorker |
|-------------|
|location     |
|-------------|
|             |
+-------------+  
```
## Behavior

### Instantiating workers
From back-end scripts, workers are instantiated further to the invocation of the createWorker() function of the workermanager script. Remote client application create a worker by invoking the demandables/api/worker/create API, which actually forwards the call and received parameters to the aforementioned function. Worker instances are persistent representation of workers. 

### Starting and running workers
Once a worker instance is created, it can be started by invoking its run() method and setting its optional start parameter to true. Remote client applications should invoke the /demandables/api/worker/run API and send start=true as a parameter of the request.
Workers cannot be started more than once. When a worker is started, it starts working as long as its purpose is not reached. There is no automatic loop and thus, it is up to the client application to regularly invoke the run() method to make sure the worker “works”. The worker will however automatically check if its purpose has been reached and will stop working if it is the case (confirmable workers will also check if confirmation has been set before stopping). A worker stays in the running state (started) as long as it does not receive a specific instruction to stop (stopRun()). 

Workers are generally responsible of knowing when they have reached their purpose and more generally of what needs to be done when “working”. Therefore, any descendants of the Worker or MobileWorker class can override the work() method. It is strongly recommended that any overriding implementation still invokes the work() method of its immediate parent as a last instruction, to make sure not to break the predefined behavior of the framework.
```
  ___________                 _________________
 /           \               /                 \
|     Not     |_run(true)__\|     Running       |
|   Running   |            /|-------------------|
 \___________/              |         @         |
      /|\                   |         | provider.getPurpose()
       |                    |    ____\|/_____   |
       |                    |   /            \  |  
       |                    |  |   Working    | |
       |                    |  |              | |
       |                    |   \____________/  |
       |                    |         | purpose reached/stopWork()
       |                    |    ____\|/_____   |
       |                    |   /            \  |  
       |_____stopRun()______|  |     Not      | |
                            |  |   Working    | |
                            |   \____________/  |
                            \___________________/
```

### Disposing a worker
It is possible to delete the document into which a given worker instance has persisted its data by invoking its _delete() method. Note that once this method is invoked, the Worker instance can still be used and persist its data, which would actually cancel the effect of the deletion. Therefore, it is recommended to stop using a worker whenever an explicit call to _delete() has been made.

### Connecting a provider type to a worker type
The framework uses dependency injection whenever possible. Therefore, a worker should generally obtain a reference to an instance of the appropriate provider by invoking the getProvider() method of the providerFactory (/demandables/providers/providerFactory) and passing the provider type (class name) as a parameter. The provider type to associate to a given worker type is defined in the framework’s configuration file (/demandables/config) using the “providers” object, by mapping a worker type (class name) to a provider type (fully qualified class name). 

The example below shows that instances of the ParkingSpotSeeker class will use an instance of ParkingSpotProvider.
```
var providers = {  
  "ParkingSpotSeeker": {    
     module: "/demandables/providers/parkingspotprovider",
    clazz: "ParkingSpotProvider"
  }
};
```
### Using services
As previously mentioned, services are scripts that provide utility features that are required for the fulfillment of a task or for specifying a task. For example, if the task is “head to parking spot”, the provider will add the best route to the spot to the task, which it obtains by using an instance of a sub-class of BaseDirectionService (abstract class).  Services are organized in sub-folders of the services folder, where every sub-folder defines a service type and the scripts it contains are either abstract implementations (interfaces) or concrete implementation of the service type. Since dependency injection is used here as well, service instances should preferably be obtained through the invocation of the getService(serviceType) method of the /demandables/services/serviceFactory. 
```
  __
 |__|______
 |services | 
 |_________|
       |   __
       |  |__|______________
       |__|directionservice |
       |  |_________________|
       |         |    ______________________
       |         |___|                      |
       |         |   | BaseDirectionService_|
       |         |   |____________________|/ 
       |   
   
```
Specifying what implementation the framework should use for a given service type is done by updating the services section of the configuration file (/demandables/config). For every service type, you should specify the module (script) where the service is implemented, the name of the class that implements the service and provide a configuration object that contains any data required to operate the service (e.g. API Key). Understanding the content of the configuration object is the responsibility of the service implementation.
```
"directionservice": {      
    module: "/demandables/services/directionservice/googlemaps", 
    clazz: "GoogleMapsDirectionService", 
    configuration: { 
       
      url: "https://maps.googleapis.com/maps/api/directions/json",
      key: "some_api_key"
    }
  },
```
## APIs
It is possible to use the framework from server-side (scriptr.io) scripts. In that case, scripts should obtain instances of workers using the corresponding  workerManager, then invoke any required method of the obtained instances. 
In many cases, however, the framework will be used by remote clients (e.g. web clients) and will therefore need to go through the APIs that are exposed by the framework. 

### Worker APIs
APIs that allow the manipulation of workers are defined in /demandables/api/worker. This folder also contains one subfolder per worker sub-type (currently only mobileworker is available). This convention should be adopted for any new sub-type of worker or existing sub-type (e.g. assume we create a flyingworker type, this will lead to the creation of the /demandables/api/worker/mobileworker/flyingworker fodler). When necessary, scripts contained in sub-folders override the APIs of the same in the parent folder. For example, /demandables/api/worker/mobileworker/run overrides the run API defined in/demandables/api/worker and should therefore be used by remote client to run a mobileworker.

### Service APIs
Service APIs (root is demandables/api/service) adopts the same convention as used for worker APIs.

## Extending the framework
Extending the framework, i.e. adding new types should be done by extending the code model or any exiting sub-types, overriding existing method when necessary (when doing that, it is strongly recommended to invoke the parent method). 

### Adding new worker types
New worker types should either extend Worker or MobileWorker. In most cases, the only method to override will be work(). Associating the correct provider to instances of the new worker type should rely on dependency injection (leveraging the configuration file). It is recommended but not mandatory to put define new worker types in the worker folder or any of its sub-folders.

### Adding new provider types
New provider types should extend Provider or any of the existing sub-types. It is recommended but not mandatory to define new provider types in the provider folder or any of its sub-folders.

### Adding service types
It is recommended to define service types in the /demandables/service folder where every service type has a folder of its own (e.g. /demandables/service /directionservice). The current design of the framework expects new service types to expose their interface (contract) in an abstract class that will be extended by concrete child classes. For example, the interface (contract) of the directionservice service type is defined in basedirectionservice and a default implementation if given by the googlemaps script. 

### Examples of extensions
The /demandables/worker and demandables/provider folders respectively contain rudimentary examples of framework extensions: dummyaworker and its corresponding dummyprovider, dummymobileworker and dummymobileprovider. In addition. the /demandables/test/tests script contains examples on how to use the latter classes. These should hopefully give you a first understanding on how to add new sub-types.

## Sample application
A sample application that is built on top of the framework is available in /simulation. When ran, the application shows cars seeking available parking spots. The cars will compete for the parking spots, which eventually leads to reassigning the vehicles that could not manage to park to another spot, until all cars are parked (if possible - might enter an infinite loop if there aren't enough free parking spots). Cars will also be dynamically oriented to different parking spots whenever a spot is considered to be closer to the car than the spot towards which the car is heading. Determining the most appropriate spot and the route towards it is done by the parkingspotprovider script, which is part of framework, and the latter takes care of allocating the next task (spot) to the cars. 

### How to launch the application
- Option 1: From the scriptr.io workspace, open simulation/demandables/parkingsearch/view/html/map.html then click on View.
- Option 2: try the [online demo](https://parkingfinder.scriptrapps.io/simulation/demandables/parkingsearch/view/html/map.html 

### What's in map.html
The map displays parking spots and cars. The cars will move in real-time at a speed that is calculated according to the duration estimated by the direction service of the framework (goooglemaps) to reach the allocated parking spot.

- Empty parking spots are in green
- Used (unavailable) parking spots are in red
- Vehicles seeking a parking spot are in yellow (it takes 2-3 seconds to display the vehicles after displaying the parking spots)
- Parking spot allocated to a car are in blue (a same parking spot might allocated to more than one car). 
- Once a vehicle reaches a spot the spots turns to red (unavailable)

You can hover over parking spots and vehicles to see information about them. CTRL + Shift + I (F12) will allow you to display the console where you can see logs about what is happening:
```
27phw668qhcfgp7k1h4f,moving to p2
7cefl3qk59ob7cs9rsoy,moving to p9
3xnxt36ecijys60kv158,moving to p5
27phw668qhcfgp7k1h4f,moving to p2
izr1v34y0sunmty4uw2y,moving to p9
27phw668qhcfgp7k1h4f changing target from p2(40.679271,-74.004119) to p9(40.682548,-74.005383)
27phw668qhcfgp7k1h4f,moving to p9
27phw668qhcfgp7k1h4f reached its target
```

### Changing the number of cars
Modify the value of the MAX_CARS variable in /simulation/demandables/parkingsearch/view/script/simulator.js

### Notes
- You might need to zoom in as spots are very close to each others (and sometimes cars as well)
- The demandables framework uses craw flight distance to determine nearest spot (not best option but good for demo as forces dynamics reallocation of spots)
Demandables framework uses google map wrapper  (service implementation provided with the framework)
