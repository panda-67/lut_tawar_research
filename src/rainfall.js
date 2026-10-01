import fs from "node:fs/promises";
import ee from "@google/earthengine";

export const CHIRPS_COLLECTION = "UCSB-CHG/CHIRPS/DAILY";

export const CHIRPS_SCALE = 5566;

export function getRainfall(roi, startDate, endDate) {
  return ee
    .ImageCollection(CHIRPS_COLLECTION)
    .filterBounds(roi)
    .filterDate(startDate, endDate)
    .select("precipitation");
}

export function calculateRainfall(collection, date, roi, days = 1) {
  const startDate = days === 1 ? date : date.advance(-days, "day");

  const endDate = days === 1 ? date.advance(1, "day") : date;

  const rainfall = collection
    .filterDate(startDate, endDate)
    .sum()
    .reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: roi,
      scale: CHIRPS_SCALE,
      maxPixels: 1e9,
    })
    .get("precipitation");

  return ee.Number(ee.Algorithms.If(rainfall, rainfall, 0));
}

export function addRainfallProperties(feature, rainfallCollection, roi, windows = [7, 30, 60, 90]) {
  const date = ee.Date(feature.get("timestamp"));

  const properties = {
    rainfall_mm: calculateRainfall(rainfallCollection, date, roi, 1),
  };

  windows.forEach((days) => {
    properties[`rainfall_${days}d_mm`] = calculateRainfall(rainfallCollection, date, roi, days);
  });

  return feature.set(properties);
}

export async function exportRainfallLakeTimeseries(collection, output) {
  console.log("Fetching rainfall-lake timeseries from Earth Engine...");

  const result = await collection.getInfo();

  if (!result || !result.features) {
    throw new Error("Earth Engine tidak mengembalikan FeatureCollection.");
  }

  const features = result.features;

  if (!features.length) {
    throw new Error("Rainfall-lake timeseries tidak menghasilkan data.");
  }

  const rows = features.map((feature) => feature.properties ?? {});

  const columns = [
    "date",
    "lake_area_m2",
    "lake_area_ha",
    "delta_lake_area_ha",
    "rainfall_mm",
    "rainfall_7d_mm",
    "rainfall_30d_mm",
    "rainfall_60d_mm",
    "rainfall_90d_mm",
    "image_id",
    "cloud_percentage",
  ];

  const escapeCSV = (value) => {
    if (value === null || value === undefined) {
      return "";
    }

    const text = String(value);

    if (text.includes(",") || text.includes('"') || text.includes("\n")) {
      return `"${text.replaceAll('"', '""')}"`;
    }

    return text;
  };

  const csv = [
    columns.join(","),
    ...rows.map((row) => columns.map((column) => escapeCSV(row[column])).join(",")),
  ].join("\n");

  await fs.mkdir("data/output", {
    recursive: true,
  });

  await fs.writeFile(output, csv, "utf8");

  console.log(`Rainfall-lake CSV exported: ${output}`);
}
