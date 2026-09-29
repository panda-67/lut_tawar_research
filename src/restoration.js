import ee from "@google/earthengine";

export function createLowNDVIMask(ndvi, zone, threshold) {
  return ndvi.lt(threshold).selfMask().clip(zone);
}

export function extractLowNDVIPolygons(ndvi, zone, zoneName, threshold, scale) {
  const mask = createLowNDVIMask(ndvi, zone, threshold);

  return mask
    .reduceToVectors({
      geometry: zone,
      scale,
      geometryType: "polygon",
      eightConnected: true,
      labelProperty: "low_ndvi",
      maxPixels: 1e9,
    })
    .map(function (feature) {
      return feature.set({
        zone: `riparian_${zoneName}`,
        ndvi_threshold: threshold,
      });
    });
}

export function createLowNDVICandidates(ndvi, ndviZones, threshold, scale) {
  const candidates = Object.entries(ndviZones).map(([zoneName, zone]) =>
    extractLowNDVIPolygons(ndvi, zone, zoneName, threshold, scale),
  );

  let merged = candidates[0];

  for (let i = 1; i < candidates.length; i++) {
    merged = merged.merge(candidates[i]);
  }

  return merged.map(function (feature) {
    return feature.set(
      "area_m2",
      feature.geometry().area({
        maxError: 1,
      }),
    );
  });
}
