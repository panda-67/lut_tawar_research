import ee from "@google/earthengine";

export function createNDVIComposite(collection) {
  const ndviCollection = collection.map(function (image) {
    return image
      .normalizedDifference(["B8", "B4"])
      .rename("NDVI")
      .copyProperties(image, ["system:time_start"]);
  });

  return ndviCollection.median();
}
export function calculateNDVIStatistics(ndvi, zone, scale) {
  return ndvi.reduceRegion({
    reducer: ee.Reducer.mean()
      .combine({
        reducer2: ee.Reducer.median(),
        sharedInputs: true,
      })
      .combine({
        reducer2: ee.Reducer.minMax(),
        sharedInputs: true,
      })
      .combine({
        reducer2: ee.Reducer.stdDev(),
        sharedInputs: true,
      }),
    geometry: zone,
    scale,
    maxPixels: 1e9,
  });
}
