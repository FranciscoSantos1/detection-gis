const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const { spawn } = require('child_process');

const app = express();
app.use(cors());

// Configure multer to save files with their original extension
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname); // Get the file extension
        cb(null, file.fieldname + '-' + uniqueSuffix + ext); // Save with extension
    }
});

const { Pool } = require('pg');

const pool = new Pool({
    user: 'postgres',
    host: 'localhost',
    database: 'pool-panel-detection',
    password: 'is',
    port: 5433, // Porta padrão do PostgreSQL
});

const insertDetection = async (detection) => {
    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS detections (
        id SERIAL PRIMARY KEY,
        class INTEGER NOT NULL,
        name VARCHAR(50) NOT NULL,
        bbox_xmin FLOAT NOT NULL,
        bbox_ymin FLOAT NOT NULL,
        bbox_xmax FLOAT NOT NULL,
        bbox_ymax FLOAT NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL
        );
    `;


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
        console.log('Creating table if not exists...');
        await pool.query(createTableQuery); // Cria a tabela, se necessário

        console.log('Inserting detection:', values);
        await pool.query(query, values); // Insere os dados
        console.log('Detection inserted successfully.');
    } catch (error) {
        console.error('Error inserting detection:', error.message);
    }
};

const upload = multer({ storage: storage }); // Adiciona esta linha para definir 'upload'

app.post('/detect', upload.single('image'), async (req, res) => {
    const file_path = path.join(__dirname, req.file.path);
    const { latitude, longitude } = req.body;

    console.log(`Received file: ${file_path}`);
    console.log(`Latitude: ${latitude}, Longitude: ${longitude}`);

    const runDetectionScript = (scriptPath, callback) => {
        const pythonScript = spawn('python', [scriptPath, file_path, latitude, longitude]);

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
            try {
                const jsonLines = output.split('\n').filter(line => {
                    try {
                        JSON.parse(line); // Verifica se a linha é JSON válida
                        return true;
                    } catch {
                        return false;
                    }
                });

                if (jsonLines.length === 0) {
                    throw new Error('No valid JSON found in the output');
                }

                const detections = JSON.parse(jsonLines[0]); // Pega o primeiro JSON válido
                callback(null, detections);

                // Salvar detecções no banco de dados
                if (detections.detections && detections.detections.length > 0) {
                    console.log('Detections found, saving to database...');
                    for (const detection of detections.detections) {
                        await insertDetection({
                            class: detection.class,
                            name: detection.class === 1 ? 'pool' : 'panel',
                            bbox: detection.bbox,
                            latitude,
                            longitude,
                        });
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

    runDetectionScript('../run-solar-panel-and-pool-detection.py', (err, result) => {
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
