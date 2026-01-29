const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { spawn } = require('child_process');
const multer = require('multer');

const app = express();
const port = 3001;

// Setup directories
const publicDir = path.join(__dirname, 'public');
if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir);
}
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir);
}

// Multer setup for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// CORS configuration - allow all origins for flexibility
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use('/public', express.static(publicDir));

app.post('/api/encode', upload.single('logo'), (req, res) => {
    const { message, moduleSize, dimension, quality } = req.body;
    if (!req.file) {
        return res.status(400).json({ error: 'Logo image is required' });
    }
    if (!message) {
        // Clean up uploaded file if it exists
        if(req.file) fs.unlink(req.file.path, () => {});
        return res.status(400).json({ error: 'Message is required' });
    }

    const outputFileName = `${Date.now()}.png`;
    const outputFilePath = path.join(publicDir, outputFileName);
    const encoderPath = path.join(__dirname, 'encoder');
    const logoPath = req.file ? req.file.path : '';

    const process = spawn(encoderPath, [message, logoPath, outputFilePath, dimension || '29', moduleSize || '4', quality || '25']);
    let isSent = false;
    let errorOutput = '';

    process.stdout.on('data', (data) => {
        if (isSent) return;
        isSent = true;
        const imageUrl = `/public/${outputFileName}`;
        res.json({ imageUrl });
    });

    process.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    process.on('close', (code) => {
        // Clean up uploaded logo file if it exists
        if(req.file) fs.unlink(req.file.path, () => {});

        if (!isSent) {
            isSent = true;
            console.error(`Encoder stderr: ${errorOutput}`);
            if (code !== 0) {
                if (errorOutput.includes('Message too long')) {
                    return res.status(400).json({ error: 'Message is too long. Please shorten your message and try again.' });
                }
                 res.status(500).json({ error: 'Failed to encode message.', details: errorOutput.trim() });
            }
        }
    });
});

app.post('/api/decode', upload.single('image'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Image file is required' });
    }

    const imagePath = path.resolve(req.file.path); // Use absolute path
    const decoderPath = path.resolve(__dirname, 'decoder'); // Use absolute path

    // Validate decoder binary exists and is executable
    if (!fs.existsSync(decoderPath)) {
        console.error(`Decoder binary not found at: ${decoderPath}`);
        fs.unlink(imagePath, () => {});
        return res.status(500).json({ error: 'Decoder binary not found', details: `Path: ${decoderPath}` });
    }

    // Check file permissions
    try {
        fs.accessSync(imagePath, fs.constants.R_OK);
    } catch (err) {
        console.error(`Cannot read uploaded file: ${imagePath}`, err);
        fs.unlink(imagePath, () => {});
        return res.status(500).json({ error: 'Cannot read uploaded file', details: err.message });
    }

    console.log(`Decoding image: ${imagePath} using decoder: ${decoderPath}`);
    const process = spawn(decoderPath, [imagePath]);

    // Kill process if it runs over 8 seconds
    const killTimer = setTimeout(() => {
        try { process.kill('SIGKILL'); } catch (e) {}
    }, 8000);

    let output = '';
    let errorOutput = '';
    let isResponseSent = false;

    process.stdout.on('data', (data) => {
        output += data.toString();
    });
    
    process.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    process.on('error', (err) => {
        clearTimeout(killTimer);
        if(isResponseSent) return;
        isResponseSent = true;
        console.error(`Failed to start decoder process:`, err);
        fs.unlink(imagePath, () => {});
        res.status(500).json({ 
            error: 'Failed to start decoder process', 
            details: err.message || 'Unknown error' 
        });
    });

    process.on('close', (code) => {
        clearTimeout(killTimer);
        if(isResponseSent) return;
        isResponseSent = true;

        fs.unlink(imagePath, () => {}); // Clean up uploaded file

        console.log(`Decoder process exited with code ${code}, output: "${output.trim()}", stderr: "${errorOutput.trim()}"`);

        if (code === 0 && output) {
            const decodedMessage = output.trim();
            // Check if the output is an error message from the decoder
            if (decodedMessage.includes('Failed to process image file') || 
                decodedMessage.includes('Can not detect or decode')) {
                res.status(500).json({ 
                    error: 'Failed to decode image.', 
                    details: decodedMessage 
                });
            } else {
                res.json({ decodedMessage });
            }
        } else {
            console.error(`Decoder failed - exit code: ${code}, stderr: ${errorOutput}`);
            res.status(500).json({ 
                error: 'Failed to decode image.', 
                details: errorOutput.trim() || `Process exited with code ${code}` 
            });
        }
    });
});

const host = process.env.HOSTNAME || '0.0.0.0';
app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
}); 