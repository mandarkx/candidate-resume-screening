import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { extractText } from '../src/extraction/extractor.js';
import { createDocxFixture, createPdfFixture, cleanupFixtures } from './fixtures.js';
import type { UploadedFile } from '../src/shared/types.js';

const sampleText = `John Doe\nSoftware Engineer\n\nExperience\n- Senior Engineer at Acme (2020-2024)\n- Built React and Node.js applications\n\nSkills\n- TypeScript, React, Node.js, PostgreSQL\n\nEducation\n- BS Computer Science, State University`;

let docxPath: string;
let pdfPath: string;

beforeAll(async () => {
  docxPath = await createDocxFixture('sample.docx', sampleText);
  pdfPath = await createPdfFixture('sample.pdf', sampleText);
});

afterAll(async () => {
  await cleanupFixtures();
});

function fileFor(path: string, name: string, mime: string): UploadedFile {
  return {
    originalName: name,
    sanitizedName: name,
    mimeType: mime,
    size: 0,
    path,
  };
}

describe('Document Extraction', () => {
  it('extracts text from DOCX', async () => {
    const result = await extractText(fileFor(docxPath, 'sample.docx', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'));
    expect(result.success).toBe(true);
    expect(result.text).toContain('John Doe');
    expect(result.text).toContain('Software Engineer');
    expect(result.text).toContain('TypeScript');
  });

  it('extracts text from PDF', async () => {
    const result = await extractText(fileFor(pdfPath, 'sample.pdf', 'application/pdf'));
    expect(result.success).toBe(true);
    expect(result.text).toContain('John Doe');
    expect(result.text).toContain('Software Engineer');
  });

  it('fails for unsupported file type', async () => {
    const result = await extractText(fileFor('readme.txt', 'readme.txt', 'text/plain'));
    expect(result.success).toBe(false);
    expect(result.error).toContain('Unsupported file type');
  });
});
