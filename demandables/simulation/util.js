function generateId(prefix) {
  
  var base = "0123456789abcdefghijklmnopqrstuvwxyz";
  var max = 20;
  var id = "";
  for (var i = 0; i < max; i++) {
    
    var index = Math.round(Math.random() * (base.length - 1));
    id += base[index];
  }
  
  if (prefix) {
    return prefix + id;
  }else {
    return id;    
  }
}

/**
 * Generates random lat and long within a given permieter, based on initial coordinates and radius
 * @param {Numeric} lat: initial lattitude
 * @param {Numeric} long: initial longitude
 * @param {Numeric} radius: max distance from initial point, in meters
 */
function randomLocation(lat, long, radius) {
  
  var r = radius/111300;
  var y0 = lat;
  var x0 = long
  var u = Math.random();
  var v = Math.random();
  var w = r * Math.sqrt(u);
  var t = 2 * Math.PI * v;
  var x = w * Math.cos(t);
  var y1 = w * Math.sin(t);
  var x1 = x / Math.cos(y0);
  var newY = y0 + y1
  var newX = x0 + x1
  return {
    lat:newY,
    long:newX
  };
}
