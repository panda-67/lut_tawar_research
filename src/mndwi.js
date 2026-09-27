import ee from "@google/earthengine";

export function addMNDWI(image) {
  const mndwi = image.normalizedDifference(["B3", "B11"]).rename("MNDWI");

  return image.addBands(mndwi);
}

export function createMNDWIComposite(collection, roi) {
  return collection.map(addMNDWI).select("MNDWI").median().clip(roi);
}

export function createWaterMask(mndwi, threshold) {
  return mndwi.gt(threshold).rename("water");
}
