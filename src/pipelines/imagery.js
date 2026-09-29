import { CONFIG } from "../../config/config.js";
import { loadROI } from "../roi.js";
import { getSentinel2 } from "../sentinel2.js";

export async function prepareLakeImagery() {
  const roi = await loadROI(CONFIG.roiFile);

  const collection = getSentinel2(
    roi,
    CONFIG.date.start,
    CONFIG.date.end,
    CONFIG.sentinel2.cloudPercentage,
  );

  return {
    roi,
    collection,
  };
}

export function prepareRiparianImagery(mainLake) {
  const riparianAOI = mainLake.geometry().buffer(50, 1);

  const collection = getSentinel2(
    riparianAOI,
    CONFIG.date.start,
    CONFIG.date.end,
    CONFIG.sentinel2.cloudPercentage,
  );

  return {
    riparianAOI,
    collection,
  };
}
