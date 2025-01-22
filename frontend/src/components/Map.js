import React, { useEffect, useRef, useState, useCallback } from "react";
import Map, { Marker, Source, Layer, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Supercluster from "supercluster";
import Modal from 'react-modal';
import DetectionOverlay from './DetectionOverlay';

const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const MapComponent = ({ viewState, setViewState, markers, boundingBoxes, mapStyle }) => {
  const mapRef = useRef();
  const [clusters, setClusters] = useState([]);
  const [modalIsOpen, setModalIsOpen] = useState(false);
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

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleMapStyleChange = (style) => {
    const map = mapRef.current.getMap();
    map.setStyle(style);
    closeModal();
  };

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
        <NavigationControl position="top-right" />
        <DetectionOverlay boundingBoxes={boundingBoxes} />
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
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <button onClick={openModal} style={{ display: "block", marginBottom: "5px", padding: "5px 10px", fontSize: "12px" }}>Change Map Style</button>
      </div>
      <Modal
        isOpen={modalIsOpen}
        onRequestClose={closeModal}
        contentLabel="Map Style Modal"
        style={{
          content: {
            top: '50%',
            left: '50%',
            right: 'auto',
            bottom: 'auto',
            marginRight: '-50%',
            transform: 'translate(-50%, -50%)',
            padding: '20px',
            borderRadius: '10px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            backgroundColor: '#fff', // Normal background color
            color: '#000', // Normal text color
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)', // Dark overlay background
          },
        }}
      >
        <h2>Choose Map Style</h2>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/satellite-v9")} style={{ display: "block", margin: "10px 0" }}>Satellite</button>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/streets-v12")} style={{ display: "block", margin: "10px 0" }}>Streets</button>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/dark-v11")} style={{ display: "block", margin: "10px 0" }}>Dark</button>
        <button onClick={closeModal} style={{ display: "block", margin: "10px 0", backgroundColor: "#ccc" }}>Close</button>
      </Modal>
    </div>
  );
};

export default MapComponent;