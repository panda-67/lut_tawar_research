import { initializeEarthEngine } from "./src/auth.js";
import { loadROI } from "./src/roi.js";
import { CONFIG } from "./config/config.js";

async function main() {
  await initializeEarthEngine();

  console.log("Earth Engine ready.");

  const roi = await loadROI(CONFIG.roiFile);

  console.log("ROI loaded.");

  const area = roi.area();

  console.log("ROI area (m²):", area.getInfo());
}

main().catch((error) => {
  console.error("Application failed:");
  console.error(error);
  process.exit(1);
});
