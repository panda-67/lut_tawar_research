import fs from "node:fs/promises";

function featureFromGeometry(geometry, properties = {}) {
  return {
    type: "Feature",
    geometry,
    properties,
  };
}

function featureCollection(features) {
  return {
    type: "FeatureCollection",
    features,
  };
}

export async function createInteractiveMap({ roi, lake, riparianZones, output = "map.html" }) {
  /*
   * Simplify geometry sebelum dikirim ke browser.
   * Tujuannya agar file HTML tidak terlalu besar.
   */
  const roiGeometry = roi.simplify(20);
  const lakeGeometry = lake.geometry().simplify(20);

  const zone0_5 = riparianZones.zone0_5.simplify(10);
  const zone5_20 = riparianZones.zone5_20.simplify(10);
  const zone20_50 = riparianZones.zone20_50.simplify(10);

  /*
   * Ambil GeoJSON geometry dari Earth Engine.
   */
  const [roiGeoJSON, lakeGeoJSON, zone0_5GeoJSON, zone5_20GeoJSON, zone20_50GeoJSON, center] =
    await Promise.all([
      roiGeometry.getInfo(),
      lakeGeometry.getInfo(),
      zone0_5.getInfo(),
      zone5_20.getInfo(),
      zone20_50.getInfo(),
      lake
        .geometry()
        .centroid({
          maxError: 1,
        })
        .coordinates()
        .getInfo(),
    ]);

  const geojson = {
    roi: featureFromGeometry(roiGeoJSON, {
      name: "ROI",
    }),

    lake: featureFromGeometry(lakeGeoJSON, {
      name: "Main Lake",
    }),
    zone0_5: featureFromGeometry(zone0_5GeoJSON, {
      name: "Riparian 0–5 m",
    }),

    zone5_20: featureFromGeometry(zone5_20GeoJSON, {
      name: "Riparian 5–20 m",
    }),

    zone20_50: featureFromGeometry(zone20_50GeoJSON, {
      name: "Riparian 20–50 m",
    }),
  };

  const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">

    <meta
        name="viewport"
        content="width=device-width, initial-scale=1.0"
    >

    <title>Lake Lut Tawar Analysis</title>

    <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    >

    <style>
        html,
        body {
            margin: 0;
            padding: 0;
            height: 100%;
        }

        #map {
            width: 100%;
            height: 100%;
        }

        .info {
            background: white;
            padding: 10px 12px;
            border-radius: 4px;
            box-shadow: 0 1px 5px rgba(0, 0, 0, 0.25);
            font-family: Arial, sans-serif;
            font-size: 13px;
            line-height: 1.5;
        }

        .info strong {
            font-size: 14px;
        }
    </style>
</head>

<body>

<div id="map"></div>

<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>

<script>
const data = ${JSON.stringify(geojson)};

const center = ${JSON.stringify(center)};

/*
 * Leaflet menggunakan [latitude, longitude],
 * sedangkan Earth Engine menggunakan [longitude, latitude].
 */
const map = L.map("map").setView(
    [center[1], center[0]],
    13
);


/*
 * Base maps
 */

const street = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Street_Map/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri"
    }
);

const satellite = L.tileLayer(
    "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
    {
        attribution: "Tiles &copy; Esri"
    }
);

street.addTo(map);

/*
 * Styles
 */

const roiStyle = {
    color: "#222222",
    weight: 2,
    fill: false
};

const lakeStyle = {
    color: "#0066cc",
    weight: 2,
    fillColor: "#3388ff",
    fillOpacity: 0.25
};

const zone0_5Style = {
  color: "#006400",
  weight: 1,
  fillColor: "#32CD32",
  fillOpacity: 0.45,
};

const zone5_20Style = {
  color: "#7A9E00",
  weight: 1,
  fillColor: "#9ACD32",
  fillOpacity: 0.40,
};

const zone20_50Style = {
  color: "#B8860B",
  weight: 1,
  fillColor: "#DAA520",
  fillOpacity: 0.35,
};

/*
 * Layers
 */

const roiLayer = L.geoJSON(
    data.roi,
    {
        style: roiStyle
    }
);

const lakeLayer = L.geoJSON(
    data.lake,
    {
        style: lakeStyle
    }
);

const zone0_5Layer = L.geoJSON(
  data.zone0_5,
  {
    style: zone0_5Style,
  },
);

const zone5_20Layer = L.geoJSON(
  data.zone5_20,
  {
    style: zone5_20Style,
  },
);

const zone20_50Layer = L.geoJSON(
  data.zone20_50,
  {
    style: zone20_50Style,
  },
);

/*
 * Popup
 */

lakeLayer.bindPopup("<strong>Main Lake</strong>");

zone0_5Layer.bindPopup(
  "<strong>Riparian 0–5 m</strong>",
);

zone5_20Layer.bindPopup(
  "<strong>Riparian 5–20 m</strong>",
);

zone20_50Layer.bindPopup(
  "<strong>Riparian 20–50 m</strong>",
);

/*
 * Layer control
 */

const baseMaps = {
    "Street Map": street,
    "Satellite": satellite
};

const overlays = {
  "ROI": roiLayer,
  "Main Lake": lakeLayer,
  "Riparian 0–5 m": zone0_5Layer,
  "Riparian 5–20 m": zone5_20Layer,
  "Riparian 20–50 m": zone20_50Layer,
};

L.control.layers(
    baseMaps,
    overlays,
    {
        collapsed: false
    }
).addTo(map);


/*
 * Default layers
 */

roiLayer.addTo(map);
lakeLayer.addTo(map);


/*
 * Information panel
 */

const info = L.control({
    position: "bottomleft"
});

info.onAdd = function () {

    const div = L.DomUtil.create(
        "div",
        "info"
    );

    div.innerHTML = \`
        <strong>Lake Lut Tawar</strong><br>
        Main lake + riparian zones<br>
        <small>Toggle layers from the control panel.</small>
    \`;

    return div;
};

info.addTo(map);


/*
 * Fit map to lake
 */

map.fitBounds(
    lakeLayer.getBounds(),
    {
        padding: [20, 20]
    }
);

</script>

</body>
</html>
`;

  await fs.mkdir("data/output", {
    recursive: true,
  });

  await fs.writeFile(output, html, "utf8");

  console.log("Interactive map created:", output);
}
