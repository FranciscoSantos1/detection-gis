const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
app.use(cors());

// Servir arquivos estáticos dos diretórios de imagens
app.use('/annotated_images', express.static('annotated_images'));
app.use('/uploads', express.static('uploads'));

// Configure multer to save files with their original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

const initializeDatabase = async () => {
    let retries = 5;
    while (retries) {
        try {
            console.log(`Attempting to connect to database... (${retries} retries left)`);
            await pool.query('SELECT NOW()');
            console.log('Database connected successfully');
            await createDetectionsTable();
            break;
        } catch (err) {
            retries -= 1;
            console.log(`Failed to connect to database. ${retries} retries left.`);
            if (retries === 0) {
                console.error('Could not connect to database:', err);
                process.exit(1);
            }
            // Wait 5 seconds before retrying
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

const { Pool } = require('pg');

const pool = new Pool({
    user: process.env.DATABASE_USER,
    host: process.env.DATABASE_HOST,
    database: process.env.DATABASE_NAME,
    password: process.env.DATABASE_PASSWORD,
    port: process.env.DATABASE_PORT,
});

const createDetectionsTable = async () => {
    const query = `
        CREATE TABLE IF NOT EXISTS detections (
            id SERIAL PRIMARY KEY,
            class INTEGER NOT NULL,
            name VARCHAR(255) NOT NULL,
            bbox_xmin FLOAT NOT NULL,
            bbox_ymin FLOAT NOT NULL,
            bbox_xmax FLOAT NOT NULL,
            bbox_ymax FLOAT NOT NULL,
            latitude FLOAT NOT NULL,
            longitude FLOAT NOT NULL,
            confidence FLOAT NOT NULL,
            original_image_path VARCHAR(255),
            annotated_image_path VARCHAR(255),
            center_latitude FLOAT,
            center_longitude FLOAT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;

    try {
        await pool.query(query);
        console.log('Detections table created successfully.');
    } catch (error) {
        console.error('Error creating detections table:', error.message);
    }
};
initializeDatabase();

const convertPixelsToCoords = (detection) => {
    const IMAGE_WIDTH = 800;
    const IMAGE_HEIGHT = 600;
    const DEFAULT_ZOOM = 18.65;
    const SCALE_ADJUSTMENT = 0.875;
    const LONGITUDE_OFFSET = 0.00000042;
    const LATITUDE_OFFSET = -0.00000072;

    const classAdjustments = {
        1: { // pool
            scale: 0.93,
            lonOffset: -0.0000002,
            latOffset: -0.0000001
        },
        2: { // solar-panel
            scale: 0.94,
            lonOffset: 0.0000001,
            latOffset: -0.0000004
        }
    };

    const classAdjust = classAdjustments[detection.class] || { scale: 1, lonOffset: 0, latOffset: 0 };
    const verticalScaleFactor = detection.class === 2 ? 0.92 : 1;

    const metersPerPixelAtEquator = (156543.03392 * Math.cos(detection.latitude * Math.PI / 180) / Math.pow(2, DEFAULT_ZOOM))
        * SCALE_ADJUSTMENT * classAdjust.scale;

    const metersToDegreesAtEquator = 1 / 111319.9;
    const latCorrectionFactor = Math.cos(detection.latitude * Math.PI / 180);
    const degreesPerPixel = metersPerPixelAtEquator * metersToDegreesAtEquator;
    const lngPerPixel = degreesPerPixel / latCorrectionFactor;
    const latPerPixel = degreesPerPixel * verticalScaleFactor;

    const offsetX = (IMAGE_WIDTH / 2) * 0.988;
    const offsetY = (IMAGE_HEIGHT / 2) * 0.988;

    // Extrair as coordenadas da bbox do objeto detection
    const bbox_xmin = detection.bbox[0];
    const bbox_xmax = detection.bbox[2];
    const bbox_ymin = detection.bbox[1];
    const bbox_ymax = detection.bbox[3];

    // Calcular o centro em pixels
    const centerPixelX = (bbox_xmin + bbox_xmax) / 2;
    const centerPixelY = (bbox_ymin + bbox_ymax) / 2;

    // Converter centro para coordenadas geográficas
    const centerLongitude = detection.longitude +
        (centerPixelX - offsetX) * lngPerPixel +
        LONGITUDE_OFFSET +
        classAdjust.lonOffset;

    const centerLatitude = detection.latitude -
        (centerPixelY - offsetY) * latPerPixel +
        LATITUDE_OFFSET +
        classAdjust.latOffset;

    return { centerLatitude, centerLongitude };
};

const insertDetection = async (detection, originalImagePath, annotatedImagePath) => {
    if (detection.confidence <= 0.5) {
        console.log('Skipping detection with confidence below threshold:', detection.confidence);
        return { status: 'skipped', reason: 'low_confidence' };
    }

    // Calculate center coordinates using the conversion function
    const { centerLatitude, centerLongitude } = convertPixelsToCoords(detection);

    // Check if a similar detection already exists
    const exists = await detectionExists(centerLatitude, centerLongitude);
    if (exists) {
        console.log('Skipping repeated detection at coordinates:', { centerLatitude, centerLongitude });
        return { status: 'skipped', reason: 'duplicate' };
    }

    const query = `
        INSERT INTO detections (
            class, 
            name, 
            bbox_xmin, 
            bbox_ymin, 
            bbox_xmax, 
            bbox_ymax, 
            latitude, 
            longitude, 
            confidence,
            original_image_path,
            annotated_image_path,
            center_latitude,
            center_longitude
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
    `;

    const values = [
        detection.class,
        detection.name,
        detection.bbox[0],
        detection.bbox[1],
        detection.bbox[2],
        detection.bbox[3],
        detection.latitude,
        detection.longitude,
        detection.confidence,
        originalImagePath,
        annotatedImagePath,
        centerLatitude,
        centerLongitude
    ];

    try {
        console.log('Inserting detection with converted center coordinates:', {
            centerLatitude,
            centerLongitude
        });
        await pool.query(query, values);
        console.log('Detection inserted successfully.');
        return { status: 'inserted' };
    } catch (error) {
        console.error('Error inserting detection:', error.message);
        return { status: 'error', reason: error.message };
    }
};

const MARGIN_OF_ERROR = 0.0001;

const detectionExists = async (centerLatitude, centerLongitude) => {
    const query = `
        SELECT 1 FROM detections
        WHERE ABS(center_latitude - $1) < $3
        AND ABS(center_longitude - $2) < $3
        LIMIT 1;
    `;
    const values = [centerLatitude, centerLongitude, MARGIN_OF_ERROR];

    try {
        const result = await pool.query(query, values);
        return result.rows.length > 0;
    } catch (error) {
        console.error('Error checking for existing detection:', error.message);
        return false;
    }
};

app.post('/detect', upload.single('image'), async (req, res) => {
    const originalImagePath = req.file.path;
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    console.log(`Received file: ${originalImagePath}`);
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    const runDetectionScript = (scriptPath, callback) => {
        const pythonPath = 'python'; // Use the global Python executable
        const pythonScript = spawn(pythonPath, [scriptPath, originalImagePath, latitude, longitude]);

        let output = "";
        let errorOutput = "";

        pythonScript.stdout.on('data', (data) => {
            output += data.toString();
            console.log('Python stdout:', data.toString());
        });

        pythonScript.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error('Python stderr:', data.toString());
        });

        pythonScript.on('close', async (code) => {
            console.log(`Python script exited with code ${code}`);
            if (errorOutput) {
                console.error('Python script error output:', errorOutput);
            }
            try {
                const jsonLines = output.split('\n').filter(line => {
                    try {
                        JSON.parse(line);
                        return true;
                    } catch {
                        return false;
                    }
                });

                if (jsonLines.length === 0) {
                    throw new Error('No valid JSON found in the output');
                }

                const detectionResult = JSON.parse(jsonLines[0]);
                const annotatedImagePath = detectionResult.detection_image;

                // Save detections to the database with image paths
                let skippedDetections = [];
                if (detectionResult.detections && detectionResult.detections.length > 0) {
                    console.log('Detections found, saving to database...');
                    for (const detection of detectionResult.detections) {
                        const result = await insertDetection(
                            detection,
                            originalImagePath.replace(/\\/g, '/'),  // Convert Windows path to Unix style
                            annotatedImagePath.replace(/\\/g, '/')  // Convert Windows path to Unix style
                        );
                        if (result.status === 'skipped') {
                            skippedDetections.push(result.reason);
                        }
                    }
                }

                // Add URLs for frontend access
                detectionResult.original_image_url = `/uploads/${path.basename(originalImagePath)}`;
                detectionResult.annotated_image_url = `/annotated_images/${path.basename(annotatedImagePath)}`;

                if (skippedDetections.length > 0) {
                    callback(null, { ...detectionResult, skippedDetections });
                } else {
                    callback(null, detectionResult);
                }
            } catch (error) {
                console.error('Failed to parse JSON output:', error);
                callback(error, null);
            }
        });
    };

    runDetectionScript('./run-solar-panel-and-pool-detection.py', (err, result) => {
        if (err) {
            return res.status(500).send(err.message);
        }
        if (result.skippedDetections && result.skippedDetections.includes('duplicate')) {
            return res.status(200).json({ message: 'Some detections were skipped because they were duplicates.', result });
        }
        res.json(result);
    });
});

app.get('/detections', async (req, res) => {
    try {
        const query = `
            SELECT d.*,
                    CASE 
                        WHEN d.original_image_path IS NOT NULL 
                        THEN '/uploads/' || split_part(d.original_image_path, '/', -1)
                        ELSE NULL 
                    END as original_image_url,
                    CASE 
                        WHEN d.annotated_image_path IS NOT NULL 
                        THEN '/annotated_images/' || split_part(d.annotated_image_path, '/', -1)
                        ELSE NULL 
                    END as annotated_image_url,
                    center_latitude,
                    center_longitude
            FROM detections d
            ORDER BY created_at DESC;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching detections:', error.message);
        res.status(500).send('Error fetching detections');
    }
});

// Endpoint para buscar uma detecção específica
app.get('/detections/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const query = `
            SELECT d.*, 
                    CASE 
                        WHEN d.image_path IS NOT NULL 
                        THEN '/annotated_images/' || split_part(d.image_path, '/', -1)
                        ELSE NULL 
                    END as annotated_image_url
            FROM detections d
            WHERE d.id = $1;
        `;
        const result = await pool.query(query, [id]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Detection not found' });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching detection:', error.message);
        res.status(500).send('Error fetching detection');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});