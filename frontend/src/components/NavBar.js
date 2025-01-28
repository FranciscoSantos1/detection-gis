import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaSearch, FaEye, FaEyeSlash, FaSatelliteDish, FaMapMarkerAlt } from 'react-icons/fa';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const Navbar = ({ onSearch, onDetect, onToggleDetections, showDetections }) => {
  const [searchInput, setSearchInput] = useState("");

  const handleSearch = async (e) => {
    e.preventDefault();
    const response = await fetch(
      `https://api.mapbox.com/search/geocode/v6/forward?q=${encodeURIComponent(
        searchInput
      )}&access_token=${MAPBOX_ACCESS_TOKEN}`
    );

    const data = await response.json();

    if (data.features && data.features.length > 0) {
      const coordinates = data.features[0].geometry.coordinates;
      onSearch({ longitude: coordinates[0], latitude: coordinates[1] });
    }
  };

  return (
    <nav
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
        padding: "1rem",
        backgroundColor: "#333",
        color: "#fff",
      }}
    >
      <h1>Detection GIS</h1>

      <form onSubmit={handleSearch} style={{ display: "flex", flexDirection: "column", marginBottom: "1rem" }}>
        <input
          type="text"
          placeholder="Search for a place..."
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          style={{
            padding: "0.5rem",
            borderRadius: "5px",
            border: "1px solid #ccc",
            marginBottom: "0.5rem",
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
            marginBottom: "1rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <FaSearch style={{ marginRight: "0.5rem" }} />
          Search
        </button>
      </form>

      <button
        type="button"
        onClick={onToggleDetections}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: showDetections ? "#4CAF50" : "#666",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title={showDetections ? "Hide Detections" : "Show Detections"}
      >
        {showDetections ? <FaEyeSlash style={{ marginRight: "0.5rem" }} /> : <FaEye style={{ marginRight: "0.5rem" }} />}
        {showDetections ? "Hide Detections" : "Show Detections"}
      </button>

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
          marginBottom: "1rem",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        title="Detect"
      >
        <FaSatelliteDish style={{ marginRight: "0.5rem" }} />
        Detect
      </button>

      <Link to="/detections" style={{ textDecoration: 'none' }}>
        <button
          type="button"
          style={{
            padding: "0.5rem 1rem",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          title="View Detections"
        >
          <FaMapMarkerAlt style={{ marginRight: "0.5rem" }} />
          View Detections
        </button>
      </Link>
    </nav>
  );
};

export default Navbar;