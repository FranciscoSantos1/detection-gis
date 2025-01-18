const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');
require('dotenv').config();

const app = express();
app.use(cors());

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

createDetectionsTable();

const insertDetection = async (detection) => {
    const query = `
        INSERT INTO detections (class, name, bbox_xmin, bbox_ymin, bbox_xmax, bbox_ymax, latitude, longitude)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
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
    ];

    try {
        console.log('Inserting detection:', values);
        await pool.query(query, values); // Insert the data
        console.log('Detection inserted successfully.');
    } catch (error) {
        console.error('Error inserting detection:', error.message);
    }
};

app.post('/detect', upload.single('image'), async (req, res) => {
    const file_path = path.join(__dirname, req.file.path);
    const { latitude, longitude } = req.body;

    if (!latitude || !longitude) {
        return res.status(400).json({ error: 'Latitude and longitude are required.' });
    }

    console.log(`Received file: ${file_path}`);
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    const runDetectionScript = (scriptPath, callback) => {
        const pythonScript = spawn('python3', [scriptPath, file_path, latitude, longitude]);

        let output = "";
        let errorOutput = "";

        pythonScript.stdout.on('data', (data) => {
            output += data.toString();
        });

        pythonScript.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        pythonScript.on('close', async (code) => {
            console.log(`Python script exited with code ${code}`);
            if (errorOutput) {
                console.error('Python script error output:', errorOutput);
            }
            try {
                const jsonLines = output.split('\n').filter(line => {
                    try {
                        JSON.parse(line); // Check if the line is valid JSON
                        return true;
                    } catch {
                        return false;
                    }
                });

                if (jsonLines.length === 0) {
                    throw new Error('No valid JSON found in the output');
                }

                const detections = JSON.parse(jsonLines[0]); // Get the first valid JSON
                callback(null, detections);

                // Save detections to the database
                if (detections.detections && detections.detections.length > 0) {
                    console.log('Detections found, saving to database...');
                    for (const detection of detections.detections) {
                        await insertDetection(detection);
                    }
                } else {
                    console.log('No detections found.');
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
        res.json(result);
    });
});

app.get('/detections', async (req, res) => {
    try {
        const query = `
            SELECT DISTINCT latitude, longitude
            FROM detections;
        `;
        const result = await pool.query(query);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching detections:', error.message);
        res.status(500).send('Error fetching detections');
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});