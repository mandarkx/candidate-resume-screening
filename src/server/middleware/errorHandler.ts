import type { Request, Response, NextFunction } from 'express';
import { toErrorMessage } from '../../utils/text.js';

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  const message = toErrorMessage(err);
  res.status(500).json({
    error: 'Internal server error',
    message,
  });
}

export function notFoundHandler(_req: Request, res: Response) {
  res.status(404).json({ error: 'Not found' });
}
