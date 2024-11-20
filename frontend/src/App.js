import React, { useState } from 'react';
import MapComponent from './components/Map';
import Navbar from './components/NavBar';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const App = () => {
  const [viewState, setViewState] = useState({
    longitude: -8.834451,
    latitude: 41.691807,
    zoom: 15,
  });

  
  // retrieve static image based on coordinates every 5 seconds
  setInterval(() => {
    fetch(`https://api.mapbox.com/styles/v1/mapbox/satellite-v9/static/${viewState.longitude},${viewState.latitude},${viewState.zoom},0,0/800x600?access_token=${MAPBOX_ACCESS_TOKEN}`)
      .then(response => response.blob())
      .then(blob => {
        const url = URL.createObjectURL(blob);
        console.log(url);
      });
  }, 5000);


  const [markers, setMarkers] = useState([
    { longitude: -8.846932658570276, latitude: 41.694675194430076 },
  ]);

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
      />
    </div>
  );
};

export default App;