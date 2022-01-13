var RAD2DEG = 180 / Math.PI;
var DEG2RAD = Math.PI / 180;

export function polarToCartesian({ longitude, latitude, radius }) {
  var phi = (90 - latitude) * DEG2RAD;
  var theta = (longitude + 180) * DEG2RAD;

  return {
    x: -(radius * Math.sin(phi) * Math.sin(theta)),
    y: radius * Math.cos(phi),
    z: radius * Math.sin(phi) * Math.cos(theta),
  };
}

export function cartesianToPolar(coord) {
  const { x, y, z } = coord;
  let radius = Math.sqrt(x * x + y * y + z * z);
  let latitude = Math.atan2(y, x) * RAD2DEG;
  let longitude = Math.acos(z / radius) * RAD2DEG;
  return { latitude, longitude, radius };
}
