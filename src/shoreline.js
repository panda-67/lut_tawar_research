import ee from "@google/earthengine";

export function createRiparianZones(lake) {
  const geometry = lake.geometry();

  const buffer5 = geometry.buffer(5, 1);
  const buffer10 = geometry.buffer(20, 1);
  const buffer30 = geometry.buffer(50, 1);

  const zone0_5 = buffer5.difference(geometry, 1);

  const zone5_20 = buffer10.difference(buffer5, 1);

  const zone20_50 = buffer30.difference(buffer10, 1);

  return {
    zone0_5,
    zone5_20,
    zone20_50,
  };
}

export function calculateZoneArea(zone) {
  return zone.area({
    maxError: 1,
  });
}
