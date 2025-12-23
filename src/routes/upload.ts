import { Router, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = 'uploads';
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const subfolder = req.query.folder as string || 'general';
    const folderPath = path.join(uploadsDir, subfolder);
    
    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true });
    }
    
    cb(null, folderPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${ext}`);
  },
});

// File filter
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

// Upload single file (admin only)
router.post(
  '/single',
  authenticate,
  requireRole('admin'),
  upload.single('file'),
  async (req: AuthRequest, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No file uploaded' });
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      const fileUrl = `${baseUrl}/${req.file.path.replace(/\\/g, '/')}`;

      res.json({
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ error: 'Failed to upload file' });
    }
  }
);

// Upload multiple files (admin only)
router.post(
  '/multiple',
  authenticate,
  requireRole('admin'),
  upload.array('files', 10),
  async (req: AuthRequest, res: Response) => {
    try {
      const files = req.files as Express.Multer.File[];
      
      if (!files || files.length === 0) {
        return res.status(400).json({ error: 'No files uploaded' });
      }

      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      
      const uploadedFiles = files.map((file) => ({
        url: `${baseUrl}/${file.path.replace(/\\/g, '/')}`,
        filename: file.filename,
        originalName: file.originalname,
        size: file.size,
        mimetype: file.mimetype,
      }));

      res.json({ files: uploadedFiles });
    } catch (error) {
      console.error('Upload multiple error:', error);
      res.status(500).json({ error: 'Failed to upload files' });
    }
  }
);

// Delete file (admin only)
router.delete('/', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      return res.status(400).json({ error: 'File path is required' });
    }

    // Security: ensure path is within uploads directory
    const normalizedPath = path.normalize(filePath);
    if (!normalizedPath.startsWith(uploadsDir)) {
      return res.status(403).json({ error: 'Invalid file path' });
    }

    if (fs.existsSync(normalizedPath)) {
      fs.unlinkSync(normalizedPath);
    }

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({ error: 'Failed to delete file' });
  }
});

// List files in folder (admin only)
router.get('/list', authenticate, requireRole('admin'), async (req: AuthRequest, res: Response) => {
  try {
    const folder = req.query.folder as string || '';
    const folderPath = path.join(uploadsDir, folder);

    if (!fs.existsSync(folderPath)) {
      return res.json({ files: [] });
    }

    const files = fs.readdirSync(folderPath).map((filename) => {
      const filePath = path.join(folderPath, filename);
      const stats = fs.statSync(filePath);
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3000}`;
      
      return {
        filename,
        url: `${baseUrl}/${filePath.replace(/\\/g, '/')}`,
        size: stats.size,
        createdAt: stats.birthtime,
        isDirectory: stats.isDirectory(),
      };
    });

    res.json({ files });
  } catch (error) {
    console.error('List files error:', error);
    res.status(500).json({ error: 'Failed to list files' });
  }
});

export default router;
