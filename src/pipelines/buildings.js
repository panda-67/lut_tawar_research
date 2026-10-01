import { getBuildingFootprints, excludeBuildings } from "../buildings.js";

export function analyzeBuildings(candidates, riparianAOI) {
  const buildings = getBuildingFootprints(riparianAOI);

  const buildingGeometry = buildings.geometry();

  const netCandidates = excludeBuildings(candidates, buildingGeometry);

  return {
    buildings,
    netCandidates,
  };
}
