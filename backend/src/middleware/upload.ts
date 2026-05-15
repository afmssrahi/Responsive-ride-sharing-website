import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { env } from '../config/env';
import { BadRequestError } from '../shared/errors';

const ALLOWED_TYPES = ['.jpg', '.jpeg', '.png', '.pdf'];

const storage = multer.diskStorage({
  destination: (req, _file, cb) => {
    const userId = (req as any).user?.id || 'unknown';
    const uploadPath = path.join(env.UPLOAD_DIR, 'documents', userId);
    fs.mkdirSync(uploadPath, { recursive: true });
    cb(null, uploadPath);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
    cb(null, name);
  },
});

const fileFilter = (_req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_TYPES.includes(ext)) {
    return cb(new BadRequestError('Only JPG, PNG, and PDF files are allowed') as any);
  }
  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.MAX_FILE_SIZE },
});
