import { initializeEarthEngine } from "./src/auth.js";
import { prepareLakeImagery, prepareRiparianImagery } from "./src/pipelines/imagery.js";
import { analyzeLake } from "./src/pipelines/lake.js";
import { analyzeRiparian } from "./src/pipelines/riparian.js";
import { analyzeVegetation } from "./src/pipelines/vegetation.js";
import { analyzeRestoration } from "./src/pipelines/restoration.js";
import { buildAnalysisLayer } from "./src/pipelines/analysis.js";
import { analyzeBuildings } from "./src/pipelines/buildings.js";
import { exportAOI } from "./src/roi.js";
import { performance } from "node:perf_hooks";
import { CONFIG } from "./config/config.js";
import { analyzeRainfallLake } from "./src/pipelines/rainfall.js";
import { exportRainfallLakeTimeseries } from "./src/rainfall.js";

async function main() {
  const startTime = performance.now();

  try {
    await initializeEarthEngine();

    console.log("Earth Engine ready.");

    const startDate = new Date(CONFIG.date.start);
    const endDate = new Date(CONFIG.date.end);
    const analysisYears = (endDate - startDate) / (1000 * 60 * 60 * 24 * 365.25);

    console.log(
      `Analysis period: ${CONFIG.date.start} → ${CONFIG.date.end} (${analysisYears.toFixed(1)} years)`,
    );

    const { roi, collection: lakeCollection } = await prepareLakeImagery();

    const { waterArea, waterPolygons, mainLake, shoreline } = analyzeLake(roi, lakeCollection);

    const { zones } = analyzeRiparian(mainLake);

    const { riparianAOI, collection: riparianCollection } = prepareRiparianImagery(mainLake);

    const { ndvi, vegetationStats } = analyzeVegetation(riparianCollection, zones);

    const { candidates } = analyzeRestoration(ndvi, zones);

    const { rainfallCollection, timeseries: rainfallLakeTimeseries } = analyzeRainfallLake(
      roi,
      lakeCollection,
    );

    console.log("Rainfall images:", await rainfallCollection.size().getInfo());

    console.log("Lake observations:", await rainfallLakeTimeseries.size().getInfo());

    await exportRainfallLakeTimeseries(
      rainfallLakeTimeseries,
      "data/output/lut_tawar_rainfall_lake_timeseries.csv",
    );

    const { netCandidates } = analyzeBuildings(candidates, riparianAOI);

    const analysisLayer = buildAnalysisLayer({
      mainLake,
      waterArea,
      waterPolygons,
      shoreline,
      vegetationStats,
      netCandidates,
    });

    await exportAOI(analysisLayer, "data/output/lake_riparian_analysis.geojson");

    const elapsed = (performance.now() - startTime) / 1000;

    console.log(`Pipeline completed in ${elapsed.toFixed(2)} seconds.`);
  } catch (error) {
    const elapsed = (performance.now() - startTime) / 1000;

    console.error(`Pipeline failed after ${elapsed.toFixed(2)} seconds.`);

    throw error;
  }
}

main().catch((error) => {
  console.error("Application failed:");
  console.error(error);
  process.exit(1);
});
