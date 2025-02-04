import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = String(date.getDate()).padStart(2, '0');
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const year = date.getFullYear();
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${day}/${month}/${year} - ${hours}:${minutes}`;
};

const DetectionsGrid = () => {
  const gridStyle = {
    backgroundColor: '#DDE6ED',
    height: '100vh',
    overflowY: 'auto'
  }
  const [detections, setDetections] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDetections = async () => {
      try {
        const response = await fetch(`${BACKEND_URL}/detections`);
        const data = await response.json();
        setDetections(data);
      } catch (error) {
        console.error('Error fetching detections:', error);
      }
    };

    fetchDetections();
  }, []);

  const handleCardClick = (latitude, longitude) => {
    navigate('/', { 
      state: { 
        latitude: latitude,
        longitude: longitude,
        zoom: 18 // Zoom level for the map
      }
    });
  };

  const handleDelete = async (id) => {
    try {
      const response = await fetch(`${BACKEND_URL}/detections/${id}`, {
        method: 'DELETE'
      });
      if (response.ok) {
        setDetections(detections.filter(detection => detection.id !== id));
        navigate(0);
      } else {
        console.error('Failed to delete detection');
      }
    } catch (error) {
      console.error('Error deleting detection:', error);
    }
  };

  return (
    <div style={gridStyle}>
      <button onClick={() => navigate('/')} style={{
        margin: '10px', 
        backgroundColor: "#333",
        color: "#fff",
        border: "none",
        borderRadius: "5px",
        cursor: "pointer",
      }}>Back</button>
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
        gap: '20px', 
        padding: '20px' 
      }}>
        {detections.map(detection => (
          <div 
            onClick={() => handleCardClick(detection.latitude, detection.longitude)}
            key={detection.id} 
            style={{ 
              border: '1px solid #ccc',
              borderRadius: '8px',
              padding: '15px',
              backgroundColor: 'white',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
              ':hover': {
                transform: 'translateY(-2px)',
                boxShadow: '0 4px 8px rgba(0,0,0,0.15)'
              }
            }}
          >
            <img 
              src={`${BACKEND_URL}/${detection.annotated_image_path}`}
              alt={`${detection.name} detection`} 
              style={{ 
                width: '100%',
                height: '200px',
                objectFit: 'cover',
                borderRadius: '4px',
                marginBottom: '10px'
              }} 
            />
            <div style={{ fontSize: '14px' }}>
              <p><strong>Class:</strong> {detection.class === 1 ? 'Pool' : 'Solar Panel'}</p>
              <p><strong>Name:</strong> {detection.name}</p>
              <p><strong>Confidence:</strong> {(detection.confidence * 100).toFixed(2)}%</p>
              <p><strong>Latitude:</strong> {detection.latitude}</p>
              <p><strong>Longitude:</strong> {detection.longitude}</p>
              <p><strong>Detected At:</strong> {formatDate(new Date(detection.created_at), 'dd/MM/yyyy - HH:mm')}</p>
              <button onClick={() => handleDelete(detection.id)} style={{
                marginTop: '10px',
                backgroundColor: 'red',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer',
              }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default DetectionsGrid;