import ee from "@google/earthengine";

const OPEN_BUILDINGS = "GOOGLE/Research/open-buildings/v3/polygons";

export function getBuildingFootprints(geometry) {
  return ee.FeatureCollection(OPEN_BUILDINGS).filterBounds(geometry);
}

export function excludeBuildings(candidates, buildingGeometry) {
  return candidates
    .map(function (feature) {
      const candidateGeometry = feature.geometry();

      const candidateArea = candidateGeometry.area({
        maxError: 1,
      });

      const netGeometry = candidateGeometry.difference(buildingGeometry, 1);

      const netArea = netGeometry.area({
        maxError: 1,
      });

      const buildingOverlap = candidateArea.subtract(netArea);

      return ee.Feature(netGeometry, feature.toDictionary()).set({
        zone_type: "restoration",

        candidate_area_m2: candidateArea,

        building_overlap_m2: buildingOverlap,

        net_restoration_area_m2: netArea,

        net_restoration_area_ha: netArea.divide(10000),
      });
    })
    .filter(ee.Filter.gt("net_restoration_area_m2", 0));
}
