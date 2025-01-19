import React, { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import mapboxgl from "mapbox-gl";

const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const MapComponent = ({ viewState, setViewState, markers, mapStyle }) => {
  const mapRef = useRef();
  const [clusters, setClusters] = useState([]);
  const superclusterRef = useRef(
    new Supercluster({
      radius: 40,
      maxZoom: 20,
    })
  );

  const updateClusters = useCallback(() => {
    const map = mapRef.current.getMap();
    const bounds = map.getBounds().toArray().flat();
    const zoom = map.getZoom();

    const clusters = superclusterRef.current.getClusters(bounds, zoom);
    setClusters(clusters);
  }, []);

  useEffect(() => {
    const geoJSONPlaces = markers.map((marker) => ({
      type: "Feature",
      properties: {
        id: marker.id,
        latitude: marker.latitude,
        longitude: marker.longitude,
      },
      geometry: {
        type: "Point",
        coordinates: [marker.longitude, marker.latitude],
      },
    }));

    superclusterRef.current.load(geoJSONPlaces);
    if (mapRef.current) {
      updateClusters();
    }
  }, [markers, updateClusters]);

  return (
    <div style={{ position: "relative" }}>
      <Map
        {...viewState}
        ref={mapRef}
        style={{ width: "100%", height: "100vh" }}
        mapStyle={mapStyle}
        mapboxAccessToken={MAPBOX_TOKEN}
        onMove={(evt) => setViewState(evt.viewState)}
        onLoad={updateClusters}
      >
        <Source
          id="clusters"
          type="geojson"
          data={{
            type: "FeatureCollection",
            features: clusters,
          }}
          cluster={true}
          clusterMaxZoom={14}
          clusterRadius={50}
        >
          <Layer
            id="cluster-layer"
            type="circle"
            source="clusters"
            filter={["has", "point_count"]}
            paint={{
              "circle-color": [
                "step",
                ["get", "point_count"],
                "#51bbd6",
                100,
                "#f1f075",
                750,
                "#f28cb1",
              ],
              "circle-radius": [
                "step",
                ["get", "point_count"],
                20,
                100,
                30,
                750,
                40,
              ],
            }}
          />
          <Layer
            id="cluster-count"
            type="symbol"
            source="clusters"
            filter={["has", "point_count"]}
            layout={{
              "text-field": "{point_count_abbreviated}",
              "text-font": ["DIN Offc Pro Medium", "Arial Unicode MS Bold"],
              "text-size": 12,
            }}
          />
          <Layer
            id="unclustered-point"
            type="circle"
            source="clusters"
            filter={["!", ["has", "point_count"]]}
            paint={{
              "circle-color": "#11b4da",
              "circle-radius": 8,
              "circle-stroke-width": 1,
              "circle-stroke-color": "#fff",
            }}
          />
        </Source>
        {markers.map((marker, index) => (
          <Marker
            key={index}
            latitude={marker.latitude}
            longitude={marker.longitude}
            color="green"
          />
        ))}
      </Map>
    </div>
  );
};

export default MapComponent;