import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary, { isCloudinaryConfigured } from '../config/cloudinary.js';
import { AppError } from '../utils/AppError.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });

const ALLOWED = {
  'image/jpeg': 'image',
  'image/png': 'image',
  'image/gif': 'image',
  'image/webp': 'image',
  'application/pdf': 'pdf',
  'application/vnd.ms-excel': 'excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
  'application/zip': 'zip',
  'application/x-zip-compressed': 'zip',
  'video/mp4': 'video',
  'video/quicktime': 'video',
};

export const categorise = (mimetype) => ALLOWED[mimetype] || null;

const fileFilter = (_req, file, cb) => {
  if (categorise(file.mimetype)) return cb(null, true);
  cb(new AppError(`Unsupported file type: ${file.mimetype}`, 400));
};

const cloudStorage = new CloudinaryStorage({
  cloudinary,
  params: (_req, file) => ({
    folder: 'hlg-tasks',
    resource_type: file.mimetype.startsWith('video') ? 'video' : 'auto',
    public_id: `${Date.now()}-${path.parse(file.originalname).name}`.replace(/\s+/g, '_'),
  }),
});

const localStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) =>
    cb(null, `${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`),
});

export const upload = multer({
  storage: isCloudinaryConfigured() ? cloudStorage : localStorage,
  fileFilter,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
});

/** Normalise a multer file (cloud or local) into our attachment shape. */
export const normaliseFile = (file) => {
  const usingCloud = isCloudinaryConfigured();
  return {
    fileName: file.originalname,
    url: usingCloud ? file.path : `/uploads/${file.filename}`,
    publicId: usingCloud ? file.filename : '',
    fileType: file.mimetype,
    category: categorise(file.mimetype) || 'file',
    size: file.size,
  };
};

export default upload;
