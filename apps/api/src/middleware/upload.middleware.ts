import { randomUUID } from 'node:crypto';
import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import { AppError } from '../utils/app-error.js';

const allowed = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const storage = multer.diskStorage({
  destination: path.resolve(process.cwd(), env.UPLOAD_DIR),
  filename: (_req, file, callback) => {
    const extension = path.extname(file.originalname).toLowerCase();
    callback(null, `${Date.now()}-${randomUUID()}${extension}`);
  },
});

export const uploadDocument = multer({
  storage,
  limits: { fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, callback) => {
    if (!allowed.has(file.mimetype)) {
      callback(
        new AppError(
          415,
          'unsupported_file_type',
          'Only PDF, PNG, JPEG, and WebP files are accepted',
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single('file');
