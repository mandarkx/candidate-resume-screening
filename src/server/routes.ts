import { Router, type Request, type Response } from 'express';
import path from 'node:path';
import fs from 'node:fs/promises';
import { listTemplates } from '../prompts/loader.js';
import { startPipeline, getRun } from '../evaluation/pipeline.js';
import { config } from './config.js';
import type { UploadedFile } from '../shared/types.js';

const router = Router();

router.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok' });
});

router.get('/templates', async (_req: Request, res: Response) => {
  try {
    const templates = await listTemplates();
    res.json({ templates });
  } catch (error) {
    res.status(500).json({ error: 'Failed to load templates' });
  }
});

router.post(
  '/evaluations',
  async (req: Request, res: Response) => {
    try {
      const files = req.files as Record<string, Express.Multer.File[]> | undefined;
      const jdFiles = files?.jobDescription || [];
      const resumeFiles = files?.resumes || [];
      const { templateId, jobTitle } = req.body;

      if (jdFiles.length === 0) {
        res.status(400).json({ error: 'Job Description is required' });
        return;
      }

      const jdFile = jdFiles[0];

      if (resumeFiles.length === 0) {
        res.status(400).json({ error: 'At least one resume is required' });
        return;
      }

      if (!templateId) {
        res.status(400).json({ error: 'Evaluation template is required' });
        return;
      }

      const toUploaded = (file: Express.Multer.File, destination: 'jd' | 'resume'): UploadedFile => ({
        originalName: file.originalname,
        sanitizedName: path.basename(file.filename),
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        destination,
      });

      const run = await startPipeline({
        jobDescriptionFile: toUploaded(jdFile, 'jd'),
        resumeFiles: resumeFiles.map((f) => toUploaded(f, 'resume')),
        templateId,
        jobTitle: jobTitle || undefined,
      });

      res.status(202).json({
        id: run.id,
        status: run.status,
        createdAt: run.createdAt,
      });
    } catch (error) {
      res.status(500).json({ error: (error as Error).message });
    }
  }
);

router.get('/evaluations/:id', async (req: Request, res: Response) => {
  const run = await getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Evaluation not found' });
    return;
  }
  res.json(run);
});

router.get('/evaluations/:id/report', async (req: Request, res: Response) => {
  const run = await getRun(req.params.id);
  if (!run) {
    res.status(404).json({ error: 'Evaluation not found' });
    return;
  }

  if (!run.report) {
    res.status(400).json({ error: 'Report not yet available' });
    return;
  }

  const format = req.query.format as string | undefined;
  const markdownPath = path.join(config.uploads.outputDir, 'reports', `report-${run.id}.md`);
  const pdfPath = path.join(config.uploads.outputDir, 'reports', `report-${run.id}.pdf`);

  try {
    if (format === 'pdf') {
      const buffer = await fs.readFile(pdfPath);
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="screening-report-${run.id}.pdf"`);
      res.send(buffer);
    } else {
      const content = await fs.readFile(markdownPath, 'utf-8');
      res.setHeader('Content-Type', 'text/markdown');
      res.setHeader('Content-Disposition', `attachment; filename="screening-report-${run.id}.md"`);
      res.send(content);
    }
  } catch (error) {
    res.status(500).json({ error: `Failed to retrieve report: ${(error as Error).message}` });
  }
});

export default router;
