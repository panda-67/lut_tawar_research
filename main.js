import { initializeEarthEngine } from "./src/auth.js";
import { prepareLakeImagery, prepareRiparianImagery } from "./src/pipelines/imagery.js";
import { analyzeLake } from "./src/pipelines/lake.js";
import { analyzeRiparian } from "./src/pipelines/riparian.js";
import { analyzeVegetation } from "./src/pipelines/vegetation.js";
import { analyzeRestoration } from "./src/pipelines/restoration.js";
import { buildAnalysisLayer } from "./src/pipelines/analysis.js";
import { exportAOI } from "./src/roi.js";
import { performance } from "node:perf_hooks";

async function main() {
  const startTime = performance.now();

  try {
    await initializeEarthEngine();

    console.log("Earth Engine ready.");

    const { roi, collection: lakeCollection } = await prepareLakeImagery();

    const { waterArea, waterPolygons, mainLake, shoreline } = analyzeLake(roi, lakeCollection);

    const { zones } = analyzeRiparian(mainLake);

    const { collection: riparianCollection } = prepareRiparianImagery(mainLake);

    const { ndvi, vegetationStats } = analyzeVegetation(riparianCollection, zones);

    const { candidates } = analyzeRestoration(ndvi, zones);

    const analysisLayer = buildAnalysisLayer({
      mainLake,
      waterArea,
      waterPolygons,
      shoreline,
      vegetationStats,
      candidates,
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
