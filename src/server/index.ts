import express from 'express';
import { exec } from 'node:child_process';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import routes from './routes.js';
import { uploadEvaluationFiles } from './middleware/upload.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { config } from './config.js';

dotenv.config();

// Propagate the configured CA cert to Node's global TLS trust store so that
// other outbound connections (e.g. global fetch, node-fetch, https) also trust it.
if (config.llm.caCert && !process.env.NODE_EXTRA_CA_CERTS) {
  process.env.NODE_EXTRA_CA_CERTS = config.llm.caCert;
}

const currentFile = fileURLToPath(import.meta.url);
const repoRoot = path.resolve(path.dirname(currentFile), '..', '..');

const app = express();

app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '1mb' }));

const limiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.maxRequests,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/api/', limiter);

app.use('/api', (req, res, next) => {
  if (req.path === '/evaluations' && req.method === 'POST') {
    uploadEvaluationFiles(req, res, (err) => {
      if (err) {
        res.status(400).json({ error: err.message });
        return;
      }
      next();
    });
  } else {
    next();
  }
});

app.use('/api', routes);

if (config.nodeEnv === 'production') {
  app.use(express.static(path.join(repoRoot, 'dist', 'client')));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(repoRoot, 'dist', 'client', 'index.html'));
  });
} else {
  app.use(express.static(path.join(repoRoot, 'public')));
}

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(config.port, () => {
  const url = `http://localhost:${config.port}`;
  console.log(`Resume screener server running on ${url}`);
  if (config.nodeEnv === 'production' && process.env.OPEN_BROWSER !== '0') {
    openBrowser(url);
  }
});

function openBrowser(url: string): void {
  const command =
    process.platform === 'win32'
      ? `start "" "${url}"`
      : process.platform === 'darwin'
        ? `open "${url}"`
        : `xdg-open "${url}"`;
  exec(command, () => {});
}
