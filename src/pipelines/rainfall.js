import ee from "@google/earthengine";

import { CONFIG } from "../../config/config.js";

import { getRainfall, addRainfallProperties } from "../rainfall.js";

function calculateLakeArea(image, roi) {
  const mndwi = image.normalizedDifference(["B3", "B11"]).rename("MNDWI");

  const water = mndwi.gt(CONFIG.mndwi.threshold).selfMask();

  const stats = ee.Image.pixelArea().updateMask(water).reduceRegion({
    reducer: ee.Reducer.sum(),
    geometry: roi,
    scale: CONFIG.scale,
    maxPixels: 1e9,
  });

  const area = ee.Number(ee.Algorithms.If(stats.contains("area"), stats.get("area"), 0));

  const timestamp = image.get("system:time_start");

  return ee.Feature(null, {
    date: ee.Date(timestamp).format("YYYY-MM-dd"),
    timestamp: timestamp,

    lake_area_m2: area,
    lake_area_ha: area.divide(10000),

    image_id: image.get("system:index"),

    cloud_percentage: image.get("CLOUDY_PIXEL_PERCENTAGE"),
  });
}

function createLakeAreaTimeseries(collection, roi) {
  return ee.FeatureCollection(
    collection.map(function (image) {
      return calculateLakeArea(image, roi);
    }),
  );
}

function addLakeAreaChange(collection) {
  const sorted = collection.sort("timestamp");

  const list = sorted.toList(sorted.size());

  const indexes = ee.List.sequence(0, sorted.size().subtract(1));

  return ee.FeatureCollection(
    indexes.map(function (index) {
      index = ee.Number(index);

      const current = ee.Feature(list.get(index));

      const previous = ee.Feature(list.get(index.subtract(1)));

      const delta = ee.Algorithms.If(
        index.eq(0),
        null,
        ee.Number(current.get("lake_area_ha")).subtract(ee.Number(previous.get("lake_area_ha"))),
      );

      return current.set("delta_lake_area_ha", delta);
    }),
  );
}

export function analyzeRainfallLake(roi, sentinelCollection) {
  const rainfallCollection = getRainfall(roi, CONFIG.date.start, CONFIG.date.end);

  const lakeAreaTimeseries = createLakeAreaTimeseries(sentinelCollection, roi);

  const withRainfall = lakeAreaTimeseries.map(function (feature) {
    return addRainfallProperties(feature, rainfallCollection, roi, CONFIG.rainfall.windows);
  });

  const timeseries = addLakeAreaChange(withRainfall);

  return {
    rainfallCollection,
    lakeAreaTimeseries,
    timeseries,
  };
}
