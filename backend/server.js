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
        // Keep original filename but ensure it's safe - just prefix with timestamp
        // Only sanitize if there are problematic characters
        let sanitizedName = file.originalname;
        // Only sanitize if filename contains characters that might cause issues
        if (/[^a-zA-Z0-9._-]/.test(file.originalname)) {
            const ext = path.extname(file.originalname).toLowerCase();
            const nameWithoutExt = path.basename(file.originalname, ext);
            sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9.-]/g, '_') + ext;
        }
        cb(null, Date.now() + '-' + sanitizedName);
    }
});

// File filter - be lenient and allow any image type
// The decoder will handle format validation
const fileFilter = (req, file, cb) => {
    // Allow any image mimetype or if mimetype is missing
    if (!file.mimetype || file.mimetype.startsWith('image/')) {
        cb(null, true);
    } else {
        cb(new Error(`Unsupported file type. Please upload an image file. Received: ${file.mimetype}`), false);
    }
};

const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    }
});

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

    // Check file exists and get stats
    let fileStats;
    try {
        fileStats = fs.statSync(imagePath);
        if (fileStats.size === 0) {
            console.error(`Uploaded file is empty: ${imagePath}`);
            fs.unlink(imagePath, () => {});
            return res.status(400).json({ error: 'Uploaded file is empty' });
        }
    } catch (err) {
        console.error(`Cannot access uploaded file: ${imagePath}`, err);
        fs.unlink(imagePath, () => {});
        return res.status(500).json({ error: 'Cannot access uploaded file', details: err.message });
    }

    // Check file permissions
    try {
        fs.accessSync(imagePath, fs.constants.R_OK);
    } catch (err) {
        console.error(`Cannot read uploaded file: ${imagePath}`, err);
        fs.unlink(imagePath, () => {});
        return res.status(500).json({ error: 'Cannot read uploaded file', details: err.message });
    }

    // Log file details for debugging
    console.log(`Decoding image: ${imagePath}`);
    console.log(`  File size: ${fileStats.size} bytes`);
    console.log(`  MIME type: ${req.file.mimetype}`);
    console.log(`  Original name: ${req.file.originalname}`);
    console.log(`  Using decoder: ${decoderPath}`);

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

    // Also listen for exit event to catch immediate crashes
    process.on('exit', (code, signal) => {
        console.log(`Decoder process exit event - code: ${code}, signal: ${signal}`);
    });

    process.on('close', (code, signal) => {
        clearTimeout(killTimer);
        if(isResponseSent) return;
        isResponseSent = true;

        fs.unlink(imagePath, () => {}); // Clean up uploaded file

        const outputTrimmed = output.trim();
        const errorTrimmed = errorOutput.trim();
        
        console.log(`Decoder process exited with code ${code}, signal: ${signal}`);
        console.log(`  stdout: "${outputTrimmed}"`);
        console.log(`  stderr: "${errorTrimmed}"`);

        // Handle case where process was killed (code is null) but we have output
        // Also handle normal exit (code === 0)
        if ((code === 0 || code === null) && outputTrimmed) {
            const decodedMessage = outputTrimmed;
            // Check if the output is an error message from the decoder
            if (decodedMessage.includes('Failed to process image file') || 
                decodedMessage.includes('Can not detect or decode') ||
                decodedMessage.includes('An unknown error occurred')) {
                console.error(`Decoder returned error message: ${decodedMessage}`);
                res.status(500).json({ 
                    error: 'Failed to decode image.', 
                    details: decodedMessage 
                });
            } else {
                res.json({ decodedMessage });
            }
        } else {
            // Process failed or was killed without output
            console.error(`Decoder failed - exit code: ${code}, signal: ${signal}`);
            if (errorTrimmed && !errorTrimmed.includes('WARNING: The convert command is deprecated')) {
                // Only treat non-ImageMagick warnings as real errors
                console.error(`  stderr: ${errorTrimmed}`);
            }
            const errorMsg = code === null 
                ? `Process was killed${signal ? ` by signal ${signal}` : ''}`
                : `Process exited with code ${code}`;
            res.status(500).json({ 
                error: 'Failed to decode image.', 
                details: (errorTrimmed && !errorTrimmed.includes('WARNING: The convert command is deprecated')) 
                    ? errorTrimmed 
                    : errorMsg
            });
        }
    });
});

// Error handler for multer and other errors (must be after routes)
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File too large', details: 'Maximum file size is 10MB' });
        }
        return res.status(400).json({ error: 'File upload error', details: err.message });
    }
    if (err) {
        console.error('Error in request:', err);
        return res.status(400).json({ error: 'File upload error', details: err.message });
    }
    next();
});

const host = process.env.HOSTNAME || '0.0.0.0';
app.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
}); 