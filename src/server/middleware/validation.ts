import type { Request, Response, NextFunction } from 'express';

export function validateEvaluationRequest(req: Request, res: Response, next: NextFunction) {
  if (!req.file) {
    res.status(400).json({ error: 'Job Description is required' });
    return;
  }

  const resumes = (req.files as Express.Multer.File[]) || [];
  if (resumes.length === 0) {
    res.status(400).json({ error: 'At least one resume is required' });
    return;
  }

  const { templateId } = req.body;
  if (!templateId || typeof templateId !== 'string') {
    res.status(400).json({ error: 'Evaluation template is required' });
    return;
  }

  next();
}
