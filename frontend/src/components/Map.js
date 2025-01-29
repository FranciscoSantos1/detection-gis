import React, { useRef, useState } from "react";
import Map, { Source, Layer, NavigationControl } from "react-map-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import Modal from 'react-modal';
import DetectionOverlay from './DetectionOverlay';

const MAPBOX_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const MapComponent = ({ viewState, setViewState, markers, boundingBoxes, mapStyle, detectionMarkers, showDetections }) => {
  const mapRef = useRef();
  const [modalIsOpen, setModalIsOpen] = useState(false);

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
      >
        <NavigationControl position="top-right" />
        {showDetections ? (
          <DetectionOverlay boundingBoxes={boundingBoxes} />
        ) : (
          <Source
            id="detection-markers"
            type="geojson"
            data={{
              type: "FeatureCollection",
              features: detectionMarkers.map((marker, index) => ({
                type: "Feature",
                geometry: {
                  type: "Point",
                  coordinates: [marker.longitude, marker.latitude]
                },
                properties: {
                  id: index,
                  name: marker.name,
                  confidence: marker.confidence
                }
              }))
            }}
            cluster={true}
            clusterMaxZoom={14}
            clusterRadius={50}
          >
            <Layer
              id="cluster-layer"
              type="circle"
              source="detection-markers"
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
              source="detection-markers"
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
              source="detection-markers"
              filter={["!", ["has", "point_count"]]}
              paint={{
                "circle-color": [
                  "match",
                  ["get", "name"],
                  "pool", "red",
                  "solar-panel", "blue",
                  "#11b4da"
                ],
                "circle-radius": 8,
                "circle-stroke-width": 1,
                "circle-stroke-color": "#fff",
              }}
            />
          </Source>
        )}
      </Map>
      <div style={{ position: "absolute", top: 10, right: 10, zIndex: 1 }}>
        <button 
          onClick={openModal} 
          style={{ 
            display: "block", 
            marginBottom: "5px", 
            padding: "5px 10px", 
            fontSize: "12px" 
          }}
        >
          Change Map Style
        </button>
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
            backgroundColor: '#fff',
            color: '#000',
          },
          overlay: {
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
          },
        }}
      >
        <h2>Choose Map Style</h2>
        <button 
          onClick={() => handleMapStyleChange("mapbox://styles/mapbox/satellite-v9")} 
          style={{ display: "block", margin: "10px 0" }}
        >
          Satellite
        </button>
        <button 
          onClick={() => handleMapStyleChange("mapbox://styles/mapbox/streets-v12")} 
          style={{ display: "block", margin: "10px 0" }}
        >
          Streets
        </button>
        <button 
          onClick={() => handleMapStyleChange("mapbox://styles/mapbox/dark-v11")} 
          style={{ display: "block", margin: "10px 0" }}
        >
          Dark
        </button>
        <button 
          onClick={closeModal} 
          style={{ display: "block", margin: "10px 0", backgroundColor: "#ccc" }}
        >
          Close
        </button>
      </Modal>
    </div>
  );
};

export default MapComponent;