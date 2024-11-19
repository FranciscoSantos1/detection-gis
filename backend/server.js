const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const {spawn} = require('child_process');

const app = express();

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

const upload = multer({ storage });
const port = 3000;

app.use(cors());
app.use(express.json());


app.post('/detect', upload.single('image'), (req, res) => {
    const file_path = path.join(__dirname, req.file.path);

    const pythonDetectScript  = spawn('python3',
        ['../run-pool-detection.py',
        file_path]);

    let output = "";

    pythonDetectScript.stdout.on('data', (data) => {
            output += data.toString();
            console.log(`stdout: ${data}`);
    });

    pythonDetectScript.stderr.on('data', (data) => {
        console.error(data.toString());
    });

    pythonDetectScript.on('close', (code) => {
        if (code === 0) {
            res.status(200).json({output: output});
        } else {
            res.status(500).json({error: 'Something went wrong'});
        }
    });
});

app.listen(port, () => {
    console.log(`Server running on port https://localhost:${port}`);
});