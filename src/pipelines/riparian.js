import ee from "@google/earthengine";

import { createRiparianZones } from "../shoreline.js";

export function analyzeRiparian(mainLake) {
  const riparianZones = createRiparianZones(mainLake);

  const zones = {
    "0_5": riparianZones.zone0_5,
    "5_20": riparianZones.zone5_20,
    "20_50": riparianZones.zone20_50,
  };

  const features = [
    ee.Feature(mainLake.geometry(), {
      zone: "main_lake",
      zone_type: "lake",
      area_m2: mainLake.get("area_m2"),
    }),

    ee.Feature(riparianZones.zone0_5, {
      zone: "riparian_0_5",
      zone_type: "riparian",
      area_m2: riparianZones.zone0_5.area({
        maxError: 1,
      }),
    }),

    ee.Feature(riparianZones.zone5_20, {
      zone: "riparian_5_20",
      zone_type: "riparian",
      area_m2: riparianZones.zone5_20.area({
        maxError: 1,
      }),
    }),

    ee.Feature(riparianZones.zone20_50, {
      zone: "riparian_20_50",
      zone_type: "riparian",
      area_m2: riparianZones.zone20_50.area({
        maxError: 1,
      }),
    }),
  ];

  const zoneFeatures = ee.FeatureCollection(features);

  return {
    riparianZones,
    zones,
    zoneFeatures,
  };
}
