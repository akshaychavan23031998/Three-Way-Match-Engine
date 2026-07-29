import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.CORS_ORIGIN = 'http://localhost:3000, https://three-way-match-web.vercel.app,   ';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `three-way-match-${process.pid}`);
process.env.MAX_UPLOAD_SIZE_BYTES = String(10 * 1024 * 1024);
