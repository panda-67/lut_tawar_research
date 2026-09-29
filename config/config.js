import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, "..");

export const CONFIG = {
  eeProject: "ee-ra-kun",

  credentials: {
    oauthClient: path.join(PROJECT_ROOT, "credentials", "oauth-client.json"),
  },

  roiFile: path.join(PROJECT_ROOT, "data", "roi", "lut_tawar_roi.geojson"),

  outputDir: path.join(PROJECT_ROOT, "data", "output"),

  sentinel2: {
    collection: "COPERNICUS/S2_SR_HARMONIZED",
    cloudPercentage: 30,
  },

  mndwi: {
    threshold: 0.0,
  },

  riparian: {
    distances: [5, 25, 55],
  },

  ndvi: {
    lowThreshold: 0.4,
  },

  scale: 10,

  date: {
    start: "2025-01-01",
    end: "2026-01-01",
  },
};
