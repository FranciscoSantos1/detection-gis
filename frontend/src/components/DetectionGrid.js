import React, { useEffect, useState } from 'react';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;

const DetectionsGrid = () => {
  const [detections, setDetections] = useState([]);

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

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px', padding: '10px' }}>
      {detections.map(detection => (
        <div key={detection.id} style={{ border: '1px solid #ccc', padding: '10px' }}>
          <p>Class: {detection.class}</p>
          <p>Name: {detection.name}</p>
          <p>Confidence: {detection.confidence}</p>
          <p>Latitude: {detection.latitude}</p>
          <p>Longitude: {detection.longitude}</p>
          <img src={detection.annotated_image_url} alt="Annotated" style={{ width: '100%' }} />
        </div>
      ))}
    </div>
  );
};

export default DetectionsGrid;