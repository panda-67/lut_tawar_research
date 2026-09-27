import fs from "node:fs/promises";
import ee from "@google/earthengine";

export async function loadROI(filePath) {
  const raw = await fs.readFile(filePath, "utf8");
  const geojson = JSON.parse(raw);

  if (!geojson.type) {
    throw new Error("ROI GeoJSON tidak memiliki property 'type'.");
  }

  if (geojson.type === "Feature") {
    if (!geojson.geometry) {
      throw new Error("Feature ROI tidak memiliki geometry.");
    }

    return ee.Geometry(geojson.geometry);
  }

  if (geojson.type === "FeatureCollection") {
    if (!geojson.features?.length) {
      throw new Error("ROI FeatureCollection tidak memiliki feature.");
    }

    const features = geojson.features.map((feature) => ee.Feature(feature));

    return ee.FeatureCollection(features).geometry();
  }

  if (
    ["Point", "MultiPoint", "LineString", "MultiLineString", "Polygon", "MultiPolygon"].includes(
      geojson.type,
    )
  ) {
    return ee.Geometry(geojson);
  }

  throw new Error(`Tipe GeoJSON tidak didukung: ${geojson.type}`);
}
