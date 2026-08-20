import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..', '..');

function getEnv(key: string, defaultValue?: string): string {
  const value = process.env[key];
  if (value === undefined && defaultValue === undefined) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
  return value ?? defaultValue!;
}

function getNumberEnv(key: string, defaultValue: number): number {
  const value = process.env[key];
  if (value === undefined || value.trim() === '') return defaultValue;
  const parsed = Number(value);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be a number`);
  }
  return parsed;
}

export const config = {
  repoRoot,
  port: getNumberEnv('PORT', 3000),
  nodeEnv: process.env.NODE_ENV || 'development',
  llm: {
    provider: getEnv('LLM_PROVIDER', 'openai'),
    apiKey: getEnv('LLM_API_KEY', ''),
    model: getEnv('LLM_MODEL', 'gpt-4o-mini'),
    baseURL: process.env.LLM_BASE_URL,
    caCert: process.env.LLM_CA_CERT,
    httpsProxy: process.env.LLM_HTTPS_PROXY,
    temperature: getNumberEnv('LLM_TEMPERATURE', 0.2),
    maxTokens: getNumberEnv('LLM_MAX_TOKENS', 4000),
    maxRetries: getNumberEnv('LLM_MAX_RETRIES', 2),
  },
  uploads: {
    maxFileSizeMb: getNumberEnv('MAX_FILE_SIZE_MB', 10),
    maxResumes: getNumberEnv('MAX_RESUMES', 50),
    maxJdFiles: getNumberEnv('MAX_JD_FILES', 1),
    uploadDir: path.resolve(repoRoot, getEnv('UPLOAD_DIR', 'uploads')),
    outputDir: path.resolve(repoRoot, getEnv('OUTPUT_DIR', 'output')),
  },
  rateLimit: {
    windowMs: getNumberEnv('RATE_LIMIT_WINDOW_MS', 60_000),
    maxRequests: getNumberEnv('RATE_LIMIT_MAX_REQUESTS', 30),
  },
};

export function getMaxFileSizeBytes(): number {
  return config.uploads.maxFileSizeMb * 1024 * 1024;
}
