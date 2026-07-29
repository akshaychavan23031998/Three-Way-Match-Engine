import path from 'node:path';
import multer from 'multer';
import { env } from '../config/env.js';
import {
  buildStoredFileName,
  deleteStoredFile,
  ensureUploadDirectory,
  getStoredFilePath,
} from '../services/documents/file-storage.service.js';
import { AppError } from '../utils/app-error.js';

const mimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg', 'image/webp']);
const extensions = new Set(['.pdf', '.png', '.jpg', '.jpeg', '.webp']);
const storage = multer.diskStorage({
  destination: (_req, _file, callback) => {
    void ensureUploadDirectory()
      .then(() => callback(null, path.dirname(getStoredFilePath('.destination'))))
      .catch((error: unknown) => callback(error as Error, ''));
  },
  filename: (_req, file, callback) => callback(null, buildStoredFileName(file.originalname)),
});
const uploader = multer({
  storage,
  limits: { fileSize: env.MAX_UPLOAD_SIZE_MB * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, callback) => {
    if (
      !mimeTypes.has(file.mimetype.toLowerCase()) ||
      !extensions.has(path.extname(file.originalname).toLowerCase())
    ) {
      callback(
        new AppError(
          400,
          'unsupported_file_type',
          'Only PDF, PNG, JPG, JPEG and WEBP files are supported',
        ),
      );
      return;
    }
    callback(null, true);
  },
}).single('file');
export const uploadDocument: import('express').RequestHandler = (req, res, next) => {
  uploader(req, res, (error: unknown) => {
    if (!error) {
      next();
      return;
    }
    void (req.file?.filename ? deleteStoredFile(req.file.filename) : Promise.resolve())
      .catch(() => undefined)
      .then(() => next(error));
  });
};
