import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FaSearch, FaEye, FaEyeSlash, FaSatelliteDish, FaMapMarkerAlt, FaGithub } from 'react-icons/fa';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const Navbar = ({ onSearch, onDetect, onToggleDetections, showDetections }) => {
  const [searchInput, setSearchInput] = useState("");
  const navigate = useNavigate();

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

  const handleNavigateHome = () => {
    navigate('/');
    window.location.reload();
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
        width: "250px",
      }}
    >
      {/* Header */}
      <div 
        style={{ display: "flex", alignItems: "center", marginBottom: "1.5rem", cursor: "pointer" }}
        onClick={handleNavigateHome}
      >
        <img src="/android-chrome-192x192.png" alt="Detection GIS Logo" style={{ width: "50px", height: "50px", marginRight: "1rem" }} />
        <h1 style={{ fontSize: "1.5rem", margin: 0 }}>Pool and Solar Panel Detection</h1>
      </div>
      <span style={{ fontSize: "0.75rem", marginLeft: "0.5rem", color: "#888", marginBottom: "1.5rem"}}>Use only to detect pools and solar panels!</span>

      {/* Search Form */}
      <form onSubmit={handleSearch} style={{ marginBottom: "1.5rem" }}>
        <div style={{
          position: "relative",
          marginBottom: "0.75rem"
        }}>
          <input
            type="text"
            placeholder="Search for a place..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            style={{
              width: "89%",
              padding: "0.75rem",
              paddingLeft: "1rem",
              borderRadius: "4px",
              border: "none",
              backgroundColor: "rgba(255, 255, 255, 0.1)",
              color: "#fff",
              fontSize: "0.9rem",
            }}
          />
        </div>
        <button
          type="submit"
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#007bff",
            color: "#fff",
            border: "none",
            borderRadius: "4px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
            fontSize: "0.9rem",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#0056b3"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#007bff"}
        >
          <FaSearch style={{ marginRight: "0.5rem" }} />
          Search
        </button>
      </form>

      {/* Main Actions */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "1rem", marginTop: "4rem" }}>
        <button
          onClick={onToggleDetections}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: showDetections ? "#4CAF50" : "#666",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = showDetections ? "#45a049" : "#555"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = showDetections ? "#4CAF50" : "#666"}
        >
          {showDetections ? <FaEyeSlash style={{ marginRight: "0.5rem" }} /> : <FaEye style={{ marginRight: "0.5rem" }} />}
          {showDetections ? "Hide Detections" : "Show Detections"}
        </button>

        <button
          onClick={onDetect}
          style={{
            width: "100%",
            padding: "0.75rem",
            backgroundColor: "#dc3545",
            color: "#fff",
            border: "none",
            borderRadius: "5px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "background-color 0.2s",
          }}
          onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#c82333"}
          onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#dc3545"}
        >
          <FaSatelliteDish style={{ marginRight: "0.5rem" }} />
          Detect
        </button>

        <Link
          to="/detections"
          style={{
            textDecoration: 'none',
            width: "100%",
          }}
        >
          <button
            style={{
              width: "100%",
              padding: "0.75rem",
              backgroundColor: "#17a2b8",
              color: "#fff",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "background-color 0.2s",
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = "#138496"}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = "#17a2b8"}
          >
            <FaMapMarkerAlt style={{ marginRight: "0.5rem" }} />
            View Detections History
          </button>
        </Link>
      </div>

      {/* Footer */}
      <div style={{
        marginTop: "auto",
        borderTop: "1px solid #555",
        paddingTop: "1rem",
        width: "100%"
      }}>
        <div style={{ marginBottom: "1rem", fontSize: "0.9rem" }}>
          <p style={{ margin: "0 0 0.5rem 0" }}>Detection GIS v1.0.0</p>
          <small style={{ color: "#888", display: "block" }}>© 2024 Detection GIS. All rights reserved.</small>
          <div style={{
            display: "flex",
            gap: "1rem",
            marginTop: "0.75rem",
            marginBottom: "0.75rem"
          }}>
            <a href="https://github.com/FranciscoSantos1"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#888", textDecoration: "none" }}>
              <FaGithub size={20} /> Francisco Santos
            </a>
            <a href="https://github.com/jlimaaraujo"
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: "#888", textDecoration: "none", marginBottom: "0.5rem" }}>
              <FaGithub size={20} /> João Araújo
            </a>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;