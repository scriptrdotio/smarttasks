var markers = {};

/**
 * This is the default callback invoked whenever a msg is pushed to the pubsub channel of the map
 * All callbacks expect an stringified array of objects that contains at least the following properties id, lat, lng
 * Note that upon subscription to the channel, the callback should not expect an array but a stringified subscription status
 * @function defaultCallback
 * @param {Object} [obj]
 * @param {String} [obj.id]: identifier of an asset to represent on the map
 * @param {Number} [obj.lat]: latitude of the asset
 * @param {Number} [obj.lng]: longitude of the asset
 * @param {String} [obj.type]: type of asset, optional. Help determining what icon to use.
 * @param {Object} [map]: google map object
 */
function defaultCallback(obj) {
  
  var jsonObj = JSON.parse(obj);
  if (jsonObj instanceof Array) {
  
    for (var i = 0; jsonObj && i < jsonObj.length; i++) {
    
      var asset = jsonObj[i];
      var marker = new google.maps.Marker({
    
        position: {lat:Number(asset.lat), lng: Number(asset.lng)},
        map: map,
        icon: getIcon(asset.type),
        title: "id:" +  asset.id
      });
      
      markers[asset.id] = asset;
    }
  }else {
    
    if (!obj.status == "success"){
      
      throw {
        
        errorCode: "Cannot_Subsribe_To_Channel",
        errorDetail: "defaultCallback: could not subscribe to channel. " + JSON.stringify(obj)
      };
    }
  }
}

function getIcon(type) {
  
  if (type) {
    return config[type].icon;
  }
  
  return "http://maps.google.com/mapfiles/ms/icons/yellow-dot.png";
}