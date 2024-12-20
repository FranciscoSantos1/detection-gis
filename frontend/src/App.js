import React, { useState, useEffect } from 'react';
import Navbar from './components/NavBar';
import MapComponent from './components/Map';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const App = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.834451,
    latitude: 41.691807,
    zoom: 15,
  });
  const [boundingBoxes, setBoundingBoxes] = useState([]);
  const [markers, setMarkers] = useState([]);

  // Fetch detections from the backend
  const fetchDetections = async () => {
    try {
      const response = await fetch('/detections');
      const data = await response.json();

      // Remove duplicates based on latitude and longitude
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
    } catch (error) {
      console.error('Error fetching detections:', error);
    }
  };

  useEffect(() => {
    fetchDetections(); // Fetch markers when the component loads
  }, []);

  const handleSearch = (location) => {
    setViewState({
      ...viewState,
      longitude: location.longitude,
      latitude: location.latitude
    });
  };

  const handleDetect = () => {
    fetch(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${viewState.longitude},${viewState.latitude},${viewState.zoom},0,0/800x600?access_token=${MAPBOX_ACCESS_TOKEN}`)
      .then(response => response.blob())
      .then(blob => {
        const formData = new FormData();
        formData.append('image', blob, 'map-image.jpg');
        formData.append('latitude', viewState.latitude);
        formData.append('longitude', viewState.longitude);

        fetch('/detect', { 
          method: 'POST',
          body: formData
        })
          .then(response => response.json())
          .then(data => {
            console.log('Detection results:', data); // Debugging information
            const poolDetection = data.poolDetection || [];
            const solarPanelDetection = data.solarPanelDetection || [];
            const boxes = [
              ...poolDetection.map(d => ({
                ...d,
                color: 'blue',
                bbox: [
                  [d.bbox[0], d.bbox[1]],
                  [d.bbox[2], d.bbox[1]],
                  [d.bbox[2], d.bbox[3]],
                  [d.bbox[0], d.bbox[3]],
                  [d.bbox[0], d.bbox[1]]
                ]
              })),
              ...solarPanelDetection.map(d => ({
                ...d,
                color: 'red',
                bbox: [
                  [d.bbox[0], d.bbox[1]],
                  [d.bbox[2], d.bbox[1]],
                  [d.bbox[2], d.bbox[3]],
                  [d.bbox[0], d.bbox[3]],
                  [d.bbox[0], d.bbox[1]]
                ]
              }))
            ];
            setBoundingBoxes(boxes);
          })
          .catch(error => console.error('Error:', error));
      });
  };

  return (
    <div>
      <Navbar onSearch={handleSearch} onDetect={handleDetect} />
      <MapComponent
        viewState={viewState}
        setViewState={setViewState}
        markers={markers}
        boundingBoxes={boundingBoxes}
      />
    </div>
  );
};

export default App;
