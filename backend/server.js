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

const upload = multer({ storage: storage });

app.post('/detect', upload.single('image'), (req, res) => {
    const file_path = path.join(__dirname, req.file.path);
    console.log(`Received file: ${file_path}`);

    const runDetectionScript = (scriptPath, callback) => {
        const pythonScript = spawn('python', [scriptPath, file_path]); 

        let output = "";
        let errorOutput = "";

        pythonScript.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`stdout: ${data}`);
        });

        pythonScript.stderr.on('data', (data) => {
            errorOutput += data.toString();
            console.error(`stderr: ${data.toString()}`);
        });

        pythonScript.on('close', (code) => {
            if (code === 0) {
                console.log(`Final stdout: ${output}`); // Add this log for debugging
                try {
                    // Find the JSON output in the stdout
                    const jsonStartIndex = output.indexOf('[');
                    const jsonEndIndex = output.lastIndexOf(']') + 1;
                    const jsonString = output.substring(jsonStartIndex, jsonEndIndex);
                    const jsonOutput = JSON.parse(jsonString);
                    callback(null, jsonOutput);
                } catch (err) {
                    console.error('Failed to parse JSON output:', output); // Add this log for debugging
                    callback(new Error('Failed to parse JSON output'));
                }
            } else {
                callback(new Error(`Script exited with code ${code}: ${errorOutput}`));
            }
        });
    };

    runDetectionScript('../run-pool-detection.py', (err, poolOutput) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }

        runDetectionScript('../run-solar-panel-detection.py', (err, solarOutput) => {
            if (err) {
                return res.status(500).json({ error: err.message });
            }

            res.status(200).json({
                poolDetection: poolOutput || [],
                solarPanelDetection: solarOutput || []
            });
        });
    });
});

const PORT = process.env.PORT || 5000; 
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});