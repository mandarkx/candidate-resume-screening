import fs from 'node:fs/promises';
import path from 'node:path';
import { generateMarkdown } from './markdown.js';
import { generatePdfBuffer } from './pdf.js';
import type { ConsolidatedReport } from '../shared/types.js';
import { toErrorMessage } from '../utils/text.js';

export interface GeneratedReport {
  markdown: string;
  markdownPath: string;
  pdfPath: string;
}

export async function buildReports(
  report: ConsolidatedReport,
  outputDir: string,
  jobId: string
): Promise<GeneratedReport> {
  await fs.mkdir(outputDir, { recursive: true });

  const markdown = generateMarkdown(report);
  const markdownPath = path.join(outputDir, `report-${jobId}.md`);
  const pdfPath = path.join(outputDir, `report-${jobId}.pdf`);

  await fs.writeFile(markdownPath, markdown, 'utf-8');

  try {
    const pdfBuffer = await generatePdfBuffer(report);
    await fs.writeFile(pdfPath, pdfBuffer);
  } catch (error) {
    throw new Error(`Failed to generate PDF report: ${toErrorMessage(error)}`);
  }

  return { markdown, markdownPath, pdfPath };
}
