import React, { useState} from 'react';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const Navbar = ({ onSearch, onDetect }) => {
    const [searchInput, setSearchInput] = useState("");
  
    const handleSearch = async (e) => {
        e.preventDefault();
        // Use a geocoding API to get coordinates from the search input
        const response = await fetch(
        `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
            searchInput
        )}&access_token=${MAPBOX_ACCESS_TOKEN}`
        );

        const data = await response.json();
        
        if (data.features && data.features.length > 0) {
            const coordinates = data.features[0].geometry.coordinates;
            console.log(coordinates)
            onSearch({ longitude: coordinates[0], latitude: coordinates[1] });
        }
    };

    return (
      <nav
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "1rem 2rem",
          backgroundColor: "#333",
          color: "#fff",
        }}
      >
        <h1>Pool Detection GIS</h1>
  
        <form onSubmit={handleSearch} style={{ display: "flex", alignItems: "center" }}>
          <input
            type="text"
            placeholder="Search for a place..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              padding: "0.5rem",
              borderRadius: "5px",
              border: "1px solid #ccc",
              marginRight: "0.5rem",
            }}
          />
          <button
            type="submit"
            style={{
              padding: "0.5rem 1rem",
              backgroundColor: "#007bff",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
            }}
          >
            Search
          </button>
        </form>
          <button
          type="button"
          onClick={onDetect}
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "red",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Detect
        </button>
      </nav>
    );
  };

export default Navbar;