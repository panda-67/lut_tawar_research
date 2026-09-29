import { CONFIG } from "../../config/config.js";

import { createLowNDVICandidates } from "../restoration.js";

export function analyzeRestoration(ndvi, zones) {
  const candidates = createLowNDVICandidates(ndvi, zones, CONFIG.ndvi.lowThreshold, CONFIG.scale);

  return {
    candidates,
  };
}
