import React, { useState } from 'react';
import Modal from 'react-modal';

const MAPBOX_ACCESS_TOKEN = "pk.eyJ1IjoiZnJhbmNpc2Nvc2FudG9zMDUiLCJhIjoiY20yZW9lNHRiMDBqZjJrcXk0bDEzNHZxNCJ9.thoOGfrXKnbjSUaREZ-OSg";

const Navbar = ({ onSearch, onDetect, onChangeMapStyle }) => {
  const [searchInput, setSearchInput] = useState("");
  const [modalIsOpen, setModalIsOpen] = useState(false);

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

  const openModal = () => {
    setModalIsOpen(true);
  };

  const closeModal = () => {
    setModalIsOpen(false);
  };

  const handleMapStyleChange = (style) => {
    onChangeMapStyle(style);
    closeModal();
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
      <button
        type="button"
        onClick={openModal}
        style={{
          padding: "0.5rem 1rem",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          borderRadius: "5px",
          cursor: "pointer",
          marginLeft: "1rem",
        }}
      >
        Map Style
      </button>
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
          },
        }}
      >
        <h2>Choose Map Style</h2>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/satellite-v9")} style={{ display: "block", margin: "10px 0" }}>Satellite</button>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/streets-v12")} style={{ display: "block", margin: "10px 0" }}>Streets</button>
        <button onClick={() => handleMapStyleChange("mapbox://styles/mapbox/dark-v11")} style={{ display: "block", margin: "10px 0" }}>Dark</button>
        <button onClick={closeModal} style={{ display: "block", margin: "10px 0", backgroundColor: "#ccc" }}>Close</button>
      </Modal>
    </nav>
  );
};

export default Navbar;