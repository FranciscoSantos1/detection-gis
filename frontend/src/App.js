import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation } from 'react-router-dom';
import Navbar from './components/NavBar';
import MapComponent from './components/Map';
import DetectionsGrid from './components/DetectionGrid';

const MAPBOX_ACCESS_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN;
const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const MapWithLocation = ({ viewState, setViewState, markers, boundingBoxes, mapStyle, detectionMarkers, showDetections }) => {
  const location = useLocation();

  useEffect(() => {
    if (location.state?.latitude && location.state?.longitude) {
      setViewState({
        latitude: location.state.latitude,
        longitude: location.state.longitude,
        zoom: location.state.zoom || 18
      });
    }
  }, [location, setViewState]);

  return (
    <MapComponent
      viewState={viewState}
      setViewState={setViewState}
      markers={markers}
      boundingBoxes={boundingBoxes}
      mapStyle={mapStyle}
      detectionMarkers={detectionMarkers}
      showDetections={showDetections}
    />
  );
};

const App = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.834451,
    latitude: 41.691807,
    zoom: 15,
  });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [markers, setMarkers] = useState([]);
  const [mapStyle] = useState("mapbox://styles/mapbox/satellite-v9");
  const [showDetections, setShowDetections] = useState(false);
  const [detectionMarkers, setDetectionMarkers] = useState([]);

  // Fetch detections from the backend
  const fetchDetections = async () => {
    try {
      const response = await fetch(`${BACKEND_URL}/detections`);
      const data = await response.json();
  
      console.log('Dados recebidos do backend:', data);
  
      const uniqueMarkers = data.reduce((acc, current) => {
        const exists = acc.find(marker =>
          marker.latitude === current.latitude && marker.longitude === current.longitude
        );
        if (!exists) {
          acc.push(current);
        }
        return acc;
      }, []);
  
      setMarkers(uniqueMarkers);
  
      const convertPixelsToCoords = (detection) => {
        const IMAGE_WIDTH = 800;
        const IMAGE_HEIGHT = 600;
        const DEFAULT_ZOOM = 18.65;
  
        const SCALE_ADJUSTMENT = 0.875;
        const LONGITUDE_OFFSET = 0.00000042;
        const LATITUDE_OFFSET = -0.00000072;
  
        const classAdjustments = {
          1: { // pool
            scale: 0.93,
            lonOffset: -0.0000002,
            latOffset: -0.0000001
          },
          2: { // solar-panel
            scale: 0.94,  
            lonOffset: 0.0000001,
            latOffset: -0.0000004 
          }
        };
  
        const classAdjust = classAdjustments[detection.class] || { scale: 1, lonOffset: 0, latOffset: 0 };
        const verticalScaleFactor = detection.class === 2 ? 0.92 : 1;
  
        const metersPerPixelAtEquator = (156543.03392 * Math.cos(detection.latitude * Math.PI / 180) / Math.pow(2, DEFAULT_ZOOM))
          * SCALE_ADJUSTMENT * classAdjust.scale;
  
        const metersToDegreesAtEquator = 1 / 111319.9;
  
        const latCorrectionFactor = Math.cos(detection.latitude * Math.PI / 180);
        const degreesPerPixel = metersPerPixelAtEquator * metersToDegreesAtEquator;
        const lngPerPixel = degreesPerPixel / latCorrectionFactor;
        const latPerPixel = degreesPerPixel * verticalScaleFactor;
  
        const offsetX = (IMAGE_WIDTH / 2) * 0.988;
        const offsetY = (IMAGE_HEIGHT / 2) * 0.988;
  
        const west = detection.longitude +
          (detection.bbox_xmin - offsetX) * lngPerPixel +
          LONGITUDE_OFFSET +
          classAdjust.lonOffset;
  
        const east = detection.longitude +
          (detection.bbox_xmax - offsetX) * lngPerPixel +
          LONGITUDE_OFFSET +
          classAdjust.lonOffset;
  
        const north = detection.latitude -
          (detection.bbox_ymin - offsetY) * latPerPixel +
          LATITUDE_OFFSET +
          classAdjust.latOffset;
  
        const south = detection.latitude -
          (detection.bbox_ymax - offsetY) * latPerPixel +
          LATITUDE_OFFSET +
          classAdjust.latOffset;
  
        return [
          [west, north],
          [east, north],
          [east, south],
          [west, south],
          [west, north]
        ];
      };
  
      const boxes = data.map(detection => {
        console.log('Processando detecção:', detection);
        const bbox = convertPixelsToCoords(detection);
        console.log('BBox convertida:', bbox);
  
        return {
          name: detection.class === 1 ? 'pool' : 'solar-panel',
          confidence: detection.confidence,
          bbox: bbox,
          center: {
            latitude: (bbox[0][1] + bbox[2][1]) / 2,
            longitude: (bbox[0][0] + bbox[2][0]) / 2
          }
        };
      });
  
      console.log('Bounding boxes geradas:', boxes);
      setBoundingBoxes(boxes);
  
      const markers = boxes.map(box => ({
        latitude: box.center.latitude,
        longitude: box.center.longitude,
        name: box.name, // Ensure this is correctly set
        color: box.name === 'pool' ? 'red' : 'blue'
      }));
  
      setDetectionMarkers(markers);
    } catch (error) {
      console.error('Error fetching detections:', error);
    }
  };

  useEffect(() => {
    fetchDetections();
  }, []);

  const handleSearch = (location) => {
    setViewState({
      ...viewState,
      longitude: location.longitude,
      latitude: location.latitude
    });
  };

  const handleDetect = () => {
    const DEFAULT_ZOOM = 18;  // Mesmo zoom usado na conversão
    console.log('Starting detection process...');

    fetch(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${viewState.longitude},${viewState.latitude},${DEFAULT_ZOOM},0,0/800x600?access_token=${MAPBOX_ACCESS_TOKEN}`)
      .then(response => response.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'map-image.jpg');
        formData.append('latitude', viewState.latitude);
        formData.append('longitude', viewState.longitude);
        formData.append('zoom', DEFAULT_ZOOM);  // Incluir o zoom usado

        return fetch(`${BACKEND_URL}/detect`, {
          method: 'POST',
          body: formData
        });
      })
      .then(response => response.json())
      .then(data => {
        console.log('Detection results:', data);
        if (data.skippedDetections && data.skippedDetections.includes('duplicate')) {
          alert('Some detections were skipped because they were duplicates.');
        }
        fetchDetections();
        setShowDetections(true);  // Show bounding boxes after detection
      })
      .catch(error => {
        console.error('Error:', error);
      });
  };

  const toggleDetections = () => {
    console.log('Alternando visibilidade das detecções. Novo estado:', !showDetections);
    setShowDetections(!showDetections);
  };

  return (
    <Router>
      <div style={{ display: 'flex', overflow: 'hidden', height: '100vh' }}>
        <Navbar
          onSearch={handleSearch}
          onDetect={handleDetect}
          onToggleDetections={toggleDetections}
          showDetections={showDetections}
        />
        <div style={{ flex: 1 }}>
          <Routes>
            <Route path="/detections" element={<DetectionsGrid />} />
            <Route path="/" element={
              <MapWithLocation
                viewState={viewState}
                setViewState={setViewState}
                markers={markers}
                boundingBoxes={showDetections ? boundingBoxes : []}
                mapStyle={mapStyle}
                detectionMarkers={detectionMarkers}
                showDetections={showDetections}
              />
            } />
          </Routes>
        </div>
      </div>
    </Router>
  );
};

export default App;