import multer from 'multer';
import path from 'node:path';
import fs from 'node:fs/promises';
import { sanitizeFilename } from '../../utils/sanitize.js';
import { config, getMaxFileSizeBytes } from '../config.js';

async function ensureUploadDir(destination: 'jd' | 'resume'): Promise<string> {
  const dir = path.join(config.uploads.uploadDir, destination);
  await fs.mkdir(dir, { recursive: true });
  return dir;
}

const storage = multer.diskStorage({
  destination: async (_req, file, cb) => {
    try {
      const destination = file.fieldname === 'jobDescription' ? 'jd' : 'resume';
      const dir = await ensureUploadDir(destination);
      cb(null, dir);
    } catch (error) {
      cb(error as Error, '');
    }
  },
  filename: (_req, file, cb) => {
    const safe = sanitizeFilename(file.originalname);
    cb(null, `${Date.now()}-${safe}`);
  },
});

export const uploadEvaluationFiles = multer({
  storage,
  limits: {
    fileSize: getMaxFileSizeBytes(),
    files: config.uploads.maxResumes + config.uploads.maxJdFiles,
  },
  fileFilter: (_req, file, cb) => {
    const supported = [
      'application/pdf',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (supported.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error(`Unsupported file type: ${file.mimetype}`));
    }
  },
}).fields([
  { name: 'jobDescription', maxCount: config.uploads.maxJdFiles },
  { name: 'resumes', maxCount: config.uploads.maxResumes },
]);
