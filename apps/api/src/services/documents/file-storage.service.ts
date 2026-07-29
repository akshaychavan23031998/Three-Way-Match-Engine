import { randomUUID } from 'node:crypto';
import { access, mkdir, readFile, unlink } from 'node:fs/promises';
import path from 'node:path';
import { env } from '../../config/env.js';

const VERCEL_UPLOAD_DIRECTORY = '/tmp/three-way-match-uploads';
export const isTemporaryUploadStorage = (): boolean => Boolean(process.env.VERCEL);
export const resolveUploadDirectory = (): string =>
  isTemporaryUploadStorage()
    ? env.NODE_ENV === 'test' && process.env.TEST_VERCEL_UPLOAD_DIR
      ? path.resolve(process.env.TEST_VERCEL_UPLOAD_DIR)
      : VERCEL_UPLOAD_DIRECTORY
    : path.resolve(process.cwd(), env.UPLOAD_DIR);

const safePath = (storedFileName: string): string => {
  if (!storedFileName || storedFileName !== path.basename(storedFileName))
    throw new Error('Unsafe upload path');
  const uploadRoot = path.resolve(resolveUploadDirectory());
  const candidate = path.resolve(uploadRoot, path.basename(storedFileName));
  if (path.dirname(candidate) !== uploadRoot) throw new Error('Unsafe upload path');
  return candidate;
};
export const ensureUploadDirectory = async (): Promise<void> => {
  await mkdir(resolveUploadDirectory(), { recursive: true });
};
export const buildStoredFileName = (originalName: string): string =>
  `${Date.now()}-${randomUUID()}${path.extname(originalName).toLowerCase()}`;
export const getStoredFilePath = (storedFileName: string): string => safePath(storedFileName);
export const readStoredFile = (storedFileName: string): Promise<Buffer> =>
  readFile(safePath(storedFileName));
export const deleteStoredFile = async (storedFileName: string): Promise<void> => {
  try {
    await unlink(safePath(storedFileName));
  } catch (error: unknown) {
    if (!(error instanceof Error && 'code' in error && error.code === 'ENOENT')) throw error;
  }
};
export const fileExists = async (storedFileName: string): Promise<boolean> => {
  try {
    await access(safePath(storedFileName));
    return true;
  } catch {
    return false;
  }
};
