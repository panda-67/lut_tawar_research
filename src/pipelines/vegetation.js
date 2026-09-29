import ee from "@google/earthengine";

import { CONFIG } from "../../config/config.js";
import { createNDVIComposite, calculateNDVIStatistics } from "../ndvi.js";

export function analyzeVegetation(collection, zones) {
  const ndvi = createNDVIComposite(collection);

  const features = Object.entries(zones).map(([name, zone]) => {
    const stats = calculateNDVIStatistics(ndvi, zone, CONFIG.scale);

    return ee.Feature(zone, {
      zone: `riparian_${name}`,
      zone_type: "riparian",

      area_m2: zone.area({
        maxError: 1,
      }),

      ndvi_mean: stats.get("NDVI_mean"),
      ndvi_median: stats.get("NDVI_median"),
      ndvi_min: stats.get("NDVI_min"),
      ndvi_max: stats.get("NDVI_max"),
      ndvi_stddev: stats.get("NDVI_stdDev"),
    });
  });

  const vegetationStats = ee.FeatureCollection(features);

  return {
    ndvi,
    vegetationStats,
  };
}
