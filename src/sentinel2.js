import ee from "@google/earthengine";

export function maskS2(image) {
  const scl = image.select("SCL");

  const mask = scl
    .neq(3) // Cloud shadow
    .and(scl.neq(8)) // Cloud medium probability
    .and(scl.neq(9)) // Cloud high probability
    .and(scl.neq(10)) // Cirrus
    .and(scl.neq(11)); // Snow/ice

  return image.updateMask(mask).divide(10000).copyProperties(image, ["system:time_start"]);
}

export function getSentinel2(roi, startDate, endDate, cloudPercentage) {
  return ee
    .ImageCollection("COPERNICUS/S2_SR_HARMONIZED")
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .filter(ee.Filter.lt("CLOUDY_PIXEL_PERCENTAGE", cloudPercentage))
    .map(maskS2);
}
