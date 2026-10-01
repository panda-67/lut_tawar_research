import ee from "@google/earthengine";

export function buildAnalysisLayer({
  mainLake,
  waterArea,
  waterPolygons,
  shoreline,
  vegetationStats,
  netCandidates,
}) {
  const mainLakeFeature = ee.Feature(mainLake.geometry(), {
    zone: "main_lake",
    zone_type: "lake",

    area_m2: mainLake.get("area_m2"),

    water_area_m2: waterArea,

    water_polygon_count: waterPolygons.size(),

    shoreline_length_m: shoreline.length({
      maxError: 1,
    }),
  });

  const lakeLayer = ee.FeatureCollection([mainLakeFeature]);

  const restorationLayer = netCandidates.map(function (feature) {
    return feature.set({
      zone_type: "restoration",
    });
  });

  return lakeLayer.merge(vegetationStats).merge(restorationLayer);
}
