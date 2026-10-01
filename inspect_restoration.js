import fs from "node:fs";
import path from "node:path";

const INPUT = path.join("data", "output", "lake_riparian_analysis.geojson");

const LOW_NDVI_THRESHOLD = 0.4;

const geojson = JSON.parse(fs.readFileSync(INPUT, "utf8"));

const features = geojson.features ?? [];

const zones = ["riparian_0_5", "riparian_5_20", "riparian_20_50"];

function toHa(m2) {
  return Number(m2 || 0) / 10000;
}

console.log("============================================================");
console.log("LUT TAWAR LOW-NDVI RESTORATION ANALYSIS");
console.log("============================================================");

console.log(`File     : ${INPUT}`);
console.log(`Features : ${features.length}`);
console.log(`Threshold: NDVI < ${LOW_NDVI_THRESHOLD}`);
console.log("");

const restorationFeatures = features.filter(
  (feature) => feature.properties?.zone_type === "restoration",
);

console.log("============================================================");
console.log("RESTORATION FEATURES");
console.log("============================================================");

console.log(`Low-NDVI polygons: ${restorationFeatures.length}`);

console.log("");

for (const zone of zones) {
  const zoneFeatures = restorationFeatures.filter((feature) => feature.properties?.zone === zone);

  const areaM2 = zoneFeatures.reduce(
    (sum, feature) => sum + Number(feature.properties?.area_m2 || 0),
    0,
  );

  const areaHa = toHa(areaM2);

  console.log("------------------------------------------------------------");
  console.log(`ZONE: ${zone}`);
  console.log("------------------------------------------------------------");

  console.log(`Low-NDVI polygons : ${zoneFeatures.length}`);

  console.log(`Low-NDVI area     : ${areaM2.toFixed(2)} m²`);

  console.log(`Low-NDVI area     : ${areaHa.toFixed(2)} ha`);

  if (zoneFeatures.length > 0) {
    const lowNdviValues = zoneFeatures
      .map((feature) => Number(feature.properties?.low_ndvi))
      .filter(Number.isFinite);

    const thresholdValues = zoneFeatures
      .map((feature) => Number(feature.properties?.ndvi_threshold))
      .filter(Number.isFinite);

    console.log(`low_ndvi values   : ${[...new Set(lowNdviValues)].join(", ")}`);

    console.log(
      `threshold         : ${[...new Set(thresholdValues)].join(", ") || LOW_NDVI_THRESHOLD}`,
    );
  }

  console.log("");
}

console.log("============================================================");
console.log("TOTAL LOW-NDVI AREA");
console.log("============================================================");

const totalAreaM2 = restorationFeatures.reduce(
  (sum, feature) => sum + Number(feature.properties?.area_m2 || 0),
  0,
);

console.log(`Total low-NDVI area : ${totalAreaM2.toFixed(2)} m²`);

console.log(`Total low-NDVI area : ${toHa(totalAreaM2).toFixed(2)} ha`);

console.log("");
