import React, { useState, useEffect } from "react";
import MapComponent from "./components/Map";
import Navbar from "./components/NavBar"; 

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const App = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.834451,
    latitude: 41.691807,
    zoom: 15,
  });

  const [markers, setMarkers] = useState([
    { longitude: -8.834451, latitude: 41.691807 },
  ]);

  const [boundingBoxes, setBoundingBoxes] = useState([]);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${viewState.longitude},${viewState.latitude},${viewState.zoom},0,0/800x600?access_token=${MAPBOX_ACCESS_TOKEN}`)
        .then(response => response.blob())
        .then(blob => {
          const formData = new FormData();
          formData.append('image', blob, 'map-image.jpg');

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
    }, 5000);

    return () => clearInterval(interval);
  }, [viewState]);

  const handleSearch = (coordinates) => {
    setViewState({
      ...viewState,
      longitude: coordinates.longitude,
      latitude: coordinates.latitude,
      zoom: 14,
    });

    setMarkers([{ longitude: coordinates.longitude, latitude: coordinates.latitude }]);
  };

  return (
    <div>
      <Navbar onSearch={handleSearch} />
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