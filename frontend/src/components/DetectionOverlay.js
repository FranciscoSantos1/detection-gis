import React from 'react';
import { Layer, Source } from 'react-map-gl';

const DetectionOverlay = ({ boundingBoxes }) => {
    console.log('boundingBoxes recebidas no DetectionOverlay:', boundingBoxes);
    
    const features = boundingBoxes.map((box, index) => ({
        type: 'Feature',
        geometry: {
            type: 'Polygon',
            coordinates: [box.bbox]
        },
        properties: {
            id: index,
            confidence: box.confidence,
            name: box.name,
            color: box.name === 'pool' ? 'rgba(255, 0, 0, 0.5)' : 'rgba(0, 0, 255, 0.5)'
        }
    }));

    const geojsonData = {
        type: 'FeatureCollection',
        features: features
    };

    console.log('GeoJSON gerado:', geojsonData);

    return (
        <>
            <Source id="detection-boxes" type="geojson" data={geojsonData}>
                <Layer
                    id="detection-boxes-fill"
                    type="fill"
                    paint={{
                        'fill-color': ['get', 'color'],
                        'fill-opacity': 0.3
                    }}
                />
                
                <Layer
                    id="detection-boxes-line"
                    type="line"
                    paint={{
                        'line-color': ['get', 'color'],
                        'line-width': 2,
                        'line-opacity': 0.8
                    }}
                />

                <Layer
                    id="detection-labels"
                    type="symbol"
                    layout={{
                        'text-field': [
                            'concat',
                            ['get', 'name'],
                            '\n',
                            ['number-format', ['get', 'confidence'], { 'minimumFractionDigits': 2, 'maximumFractionDigits': 2 }]
                        ],
                        'text-font': ['Open Sans Bold'],
                        'text-size': 12,
                        'text-anchor': 'center',
                        'text-offset': [0, 0],
                        'text-allow-overlap': true
                    }}
                    paint={{
                        'text-color': '#ffffff',
                        'text-halo-color': '#000000',
                        'text-halo-width': 2
                    }}
                />
            </Source>
        </>
    );
};

export default DetectionOverlay;