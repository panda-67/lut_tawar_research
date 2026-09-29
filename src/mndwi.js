import ee from "@google/earthengine";

export function addMNDWI(image) {
  const mndwi = image.normalizedDifference(["B3", "B11"]).rename("MNDWI");

  return image.addBands(mndwi);
}

export function createMNDWIComposite(collection, roi) {
  return collection.map(addMNDWI).select("MNDWI").median().clip(roi);
}

export function createWaterMask(mndwi, threshold) {
  return mndwi.gt(threshold).selfMask().rename("water");
}

export function calculateWaterArea(waterMask, roi, scale) {
  return ee.Image.pixelArea()
    .updateMask(waterMask)
    .reduceRegion({
      reducer: ee.Reducer.sum(),
      geometry: roi,
      scale,
      maxPixels: 1e9,
    })
    .get("area");
}
