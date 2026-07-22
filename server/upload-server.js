import express from 'express';
import multer from 'multer';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { writeFile } from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = 3003;

// Enable CORS for Vite dev server
app.use(cors({
    origin: ['http://localhost:3000', 'http://localhost:5173'], // Support both common Vite ports
    credentials: true
}));

app.use(express.json());

// Configure multer for file uploads - use memory storage for simplicity
const upload = multer({
    storage: multer.memoryStorage(),
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/gif'];
        
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only PDF and image files are allowed.'), false);
        }
    },
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB
    }
});

// Upload endpoint
app.post('/api/upload', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file provided' });
        }

        const vehicleRegNo = req.body.vehicleRegNo;
        
        if (!vehicleRegNo) {
            return res.status(400).json({ error: 'Vehicle registration number is required' });
        }

        // Create directory for this vehicle
        const uploadDir = join(__dirname, '..', 'public', 'User_uploaded_docs', vehicleRegNo);
        
        if (!existsSync(uploadDir)) {
            mkdirSync(uploadDir, { recursive: true });
        }

        // Generate filename
        const timestamp = Date.now();
        const originalName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
        const filename = `${timestamp}_${originalName}`;
        const filepath = join(uploadDir, filename);

        // Write file to disk
        await writeFile(filepath, req.file.buffer);

        const publicUrl = `/User_uploaded_docs/${vehicleRegNo}/${filename}`;

        res.json({
            success: true,
            url: publicUrl,
            filename: req.file.originalname,
            size: req.file.size,
            type: req.file.mimetype,
            uploadedDate: new Date().toISOString().split('T')[0]
        });
    } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload file' });
    }
});

// Error handling middleware
app.use((error, req, res, next) => {
    if (error instanceof multer.MulterError) {
        if (error.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ error: 'File size exceeds 10MB limit' });
        }
        return res.status(400).json({ error: error.message });
    }
    
    if (error) {
        return res.status(400).json({ error: error.message });
    }
    
    next();
});

app.listen(PORT, () => {
    console.log(`Upload server running on http://localhost:${PORT}`);
});
