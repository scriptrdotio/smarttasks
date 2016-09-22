# smarttasks

## About smart task assignment
The “demandables” (“smart task assignment”) framework provides the fundamental structure and behavior for the implementation of smart task assignment applications. The base concept behind smart task assignment is to decouple the execution of tasks from their assignment:  “workers” (task seekers) that are responsible for the execution of one or several tasks do not need to know the list of tasks beforehand but actually rely on a “task provider” to provide them with the correct task specification when needed. 
This generic approach is derivable into multiple applications, such as:
- Waste collection: every time a bin is collected, trucks needs to know the next bin to head to,
- Searching for an empty parking spot: available parking spots can be seen as tasks assigned to vehicles, where tasks can be reallocated dynamically (a spot has been taken while the vehicle was heading to it or if a nearby spot has become available),
- Delivering goods: trucks can deliver goods and get notified along the way of the next delivery to make. 
Core model (/demandables)
- Worker: an abstraction of any entity that needs to execute a task at some point in time
  - A Worker has a “purpose”, which is a task that is assigned to it at a given point in time,
  -	A Worker can be “reassignable”, which means that it is possible to modify its purpose at hand before the latter is reached,
  -	A Worker can be “confirmable”, which means that even if the purpose is reached, this has to be confirmed by an external authority (e.g. client confirms that delivery has been made),
-	Mobile worker: a sub-type of Worker that has a location that can change in time,
-	Provider: a provider knows what task to assign to a given worker, based on any information it obtains from the latter (application of the Visitor design pattern), 
- Service: providers can use services when determining the task to assign to a worker. For example, a provider can use a ParkingService to obtain the list of nearby available parking spots before it determines the nearest parking spot to a given vehicle (worker).

+-------------+
|   Worker    |
|-------------|
|reassignable |
|confirmable  |               +------------+              +------------+
|purpose      |               |  Provider  |              |   Service  |
+-------------+_______________|------------|______________|------------|
|run          |               |------------|              |            |
|work         |               |gertPurpose |              +------------+ 
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

## Behavior

### Instantiating workers
From back-end scripts, workers are instantiated further to the invocation of the createWorker() function of the workermanager script. Remote client application create a worker by invoking the demandables/api/worker/create API, which actually forwards the call and received parameters to the aforementioned function. Worker instances are persistent representation of workers. 

### Starting and running workers
Once a worker instance is created, it can be started by invoking its run() method and setting its optional start parameter to true. Remote client applications should invoke the /demandables/api/worker/run API and send start=true as a parameter of the request.
Workers cannot be started more than once. When a worker is started, it starts working as long as its purpose is not reached. There is no automatic loop and thus, it is up to the client application to regularly invoke the run() method to make sure the worker “works”. The worker will however automatically check if its purpose has been reached and will stop working if it is the case (confirmable workers will also check if confirmation has been set before stopping). A worker stays in the running state (started) as long as it does not receive a specific instruction to stop (stopRun()). 

Workers are generally responsible of knowing when they have reached their purpose and more generally of what needs to be done when “working”. Therefore, any descendants of the Worker or MobileWorker class can override the work() method. It is strongly recommended that any overriding implementation still invokes the work() method of its immediate parent as a last instruction, to make sure not to break the predefined behavior of the framework.
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
## Extending the framework
Service specifications should remain as generic as possible in order to provide the possibility to introduce new implementations without impacting the users of a service. For example, we provide a default implementation of directionservice through the googlemaps script. Developers should be able to seamlessly replace the latter with another implementation. 
