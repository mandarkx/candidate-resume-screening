import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import fs from 'node:fs/promises';
import path from 'node:path';
import routes from '../src/server/routes.js';
import { createDocxFixture, createPdfFixture, cleanupFixtures } from './fixtures.js';

const app = express();
app.use(express.json());

// Minimal multer setup for tests by directly calling routes without file middleware.
// The /api/evaluations endpoint is expected to be covered in e2e; here we test templates and health.
app.use('/api', routes);

describe('API Endpoints', () => {
  it('GET /api/health returns ok', async () => {
    const res = await request(app).get('/api/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
  });

  it('GET /api/templates returns templates', async () => {
    const res = await request(app).get('/api/templates');
    expect(res.status).toBe(200);
    expect(res.body.templates).toBeInstanceOf(Array);
    expect(res.body.templates.some((t: { id: string }) => t.id === 'candidate-evaluation')).toBe(true);
  });

  it('GET /api/evaluations/:id returns 404 for missing run', async () => {
    const res = await request(app).get('/api/evaluations/00000000-0000-0000-0000-000000000000');
    expect(res.status).toBe(404);
  });
});
