import os from 'node:os';
import path from 'node:path';

process.env.NODE_ENV = 'test';
process.env.UPLOAD_DIR = path.join(os.tmpdir(), `three-way-match-${process.pid}`);
process.env.MAX_UPLOAD_SIZE_MB = '10';
