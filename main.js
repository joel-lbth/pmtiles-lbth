import * as pmtiles from "pmtiles";
import * as maplibregl from "maplibre-gl";
import layers from "protomaps-themes-base";

const protocol = new pmtiles.Protocol();
maplibregl.addProtocol("pmtiles", protocol.tile);

const map = new maplibregl.Map({
  container: "map", // id
  style: {
    version: 8,
    glyphs: "https://cdn.protomaps.com/fonts/pbf/{fontstack}/{range}.pbf",
    sources: {
      protomaps: {
        type: "vector",
        url: `pmtiles://${location.protocol}//${location.host}${location.pathname}lbth.pmtiles`,
        attribution:
          '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>',
      },
    },
    layers: layers("protomaps", "light"),
  },
});
map.on("load", () => {
  const myBounds = map.getSource("protomaps").bounds;
  map.fitBounds(myBounds);
  // Now load the places
  fetch("https://gist.githubusercontent.com/joel-lbth/6d2c78c52163b7da1d91089c9bd849cf/raw/017486a4076483e26011e4161b1a39a828e8f5e1/lbth-wards.geojson").then((response) => {
    response.json().then((data) => {
      map.addSource('wards', {
        'type': 'geojson',
        'data': data
      })
      map.addLayer({
        'id': 'wards',
        'type': 'fill',
        'source': 'wards',
        'paint': {
          'fill-color': '#888888',
          'fill-opacity': 0.4,
          'fill-outline-color': '#333'
        }
      });

      // Create a popup, but don't add it to the map yet.
      const popup = new maplibregl.Popup({
        closeButton: true,
        closeOnClick: true
      });

      map.on('click', 'wards', (e) => {
        // Change the cursor style as a UI indicator.
        map.getCanvas().style.cursor = 'pointer';

        const coordinates = e.features[0].geometry.coordinates.slice();
        const description = e.features[0].properties.name;

        // Ensure that if the map is zoomed out such that multiple
        // copies of the feature are visible, the popup appears
        // over the copy being pointed to.
        while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
          coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        }

        // Populate the popup and set its coordinates
        // based on the feature found.
        popup.setLngLat(e.lngLat).setHTML(description).addTo(map);
      });

      // Change the cursor to a pointer when the mouse is over the places layer.
      map.on('mouseenter', 'wards', () => {
        map.getCanvas().style.cursor = 'pointer';
      });

      // Change it back to a pointer when it leaves.
      map.on('mouseleave', 'wards', () => {
        map.getCanvas().style.cursor = '';
      });

    });

  });
});
