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
            image_path VARCHAR(255),
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

const insertDetection = async (detection, originalImagePath, annotatedImagePath) => {
    // Verificar se a confiança é maior que 0.8 antes de inserir
    if (detection.confidence <= 0.8) {
        console.log('Skipping detection with confidence below threshold:', detection.confidence);
        return;
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
            original_image_path,
            annotated_image_path
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
        detection.class,
        detection.name,
        detection.bbox[0], // xmin
        detection.bbox[1], // ymin
        detection.bbox[2], // xmax
        detection.bbox[3], // ymax
        detection.latitude,
        detection.longitude,
        originalImagePath,
        annotatedImagePath
    ];

    try {
        console.log('Inserting detection:', values);
        await pool.query(query, values);
        console.log('Detection inserted successfully.');
    } catch (error) {
        console.error('Error inserting detection:', error.message);
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
        const pythonPath = path.join(__dirname, 'venv', 'Scripts', 'python.exe');
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
                if (detectionResult.detections && detectionResult.detections.length > 0) {
                    console.log('Detections found, saving to database...');
                    for (const detection of detectionResult.detections) {
                        await insertDetection(
                            detection, 
                            originalImagePath.replace(/\\/g, '/'),  // Convert Windows path to Unix style
                            annotatedImagePath.replace(/\\/g, '/')  // Convert Windows path to Unix style
                        );
                    }
                }

                // Add URLs for frontend access
                detectionResult.original_image_url = `/uploads/${path.basename(originalImagePath)}`;
                detectionResult.annotated_image_url = `/annotated_images/${path.basename(annotatedImagePath)}`;

                callback(null, detectionResult);
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
                    END as annotated_image_url
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