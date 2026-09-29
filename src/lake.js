import ee from "@google/earthengine";

export function extractWaterPolygons(waterMask, roi, scale) {
  return waterMask.selfMask().reduceToVectors({
    geometry: roi,
    scale,
    geometryType: "polygon",
    eightConnected: true,
    labelProperty: "water",
    maxPixels: 1e9,
  });
}

export function addPolygonArea(polygons) {
  return polygons.map(function (feature) {
    const area = feature.geometry().area({
      maxError: 1,
    });

    return feature.set("area_m2", area);
  });
}

export function extractMainLake(polygons) {
  return polygons.sort("area_m2", false).first();
}

export function extractShoreline(lake) {
  return ee.Algorithms.GeometryConstructors.LineString(lake.geometry().coordinates().get(0));
}
