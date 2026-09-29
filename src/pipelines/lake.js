import { CONFIG } from "../../config/config.js";

import { calculateWaterArea, createMNDWIComposite, createWaterMask } from "../mndwi.js";

import {
  extractWaterPolygons,
  addPolygonArea,
  extractMainLake,
  extractShoreline,
} from "../lake.js";

export function analyzeLake(roi, collection) {
  const mndwi = createMNDWIComposite(collection, roi);

  const waterMask = createWaterMask(mndwi, CONFIG.mndwi.threshold);

  const waterArea = calculateWaterArea(waterMask, roi, CONFIG.scale);

  const waterPolygons = extractWaterPolygons(waterMask, roi, CONFIG.scale);

  const polygonsWithArea = addPolygonArea(waterPolygons);

  const mainLake = extractMainLake(polygonsWithArea);

  const shoreline = extractShoreline(mainLake);

  return {
    mndwi,
    waterMask,
    waterArea,
    waterPolygons,
    mainLake,
    shoreline,
  };
}
