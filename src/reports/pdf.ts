import puppeteer from 'puppeteer';
import { generateMarkdown } from './markdown.js';
import type { ConsolidatedReport } from '../shared/types.js';
import { toErrorMessage } from '../utils/text.js';

const HTML_HEADER = `
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>Candidate Screening Report</title>
<style>
  @page { margin: 24mm 20mm; size: A4; }
  body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 11pt; line-height: 1.5; color: #222; }
  h1 { font-size: 22pt; color: #1a1a1a; margin-bottom: 6px; }
  h2 { font-size: 15pt; color: #2c3e50; border-bottom: 2px solid #2c3e50; padding-bottom: 4px; margin-top: 24px; }
  h3 { font-size: 13pt; color: #34495e; margin-top: 18px; }
  h4 { font-size: 11pt; color: #555; margin-top: 12px; margin-bottom: 4px; }
  table { border-collapse: collapse; width: 100%; margin: 12px 0; font-size: 10pt; }
  th, td { border: 1px solid #ccc; padding: 6px 8px; text-align: left; }
  th { background-color: #f4f6f8; font-weight: 600; }
  tr:nth-child(even) { background-color: #fafafa; }
  .disclaimer { background: #fffbe6; border-left: 4px solid #f1c40f; padding: 10px 14px; margin: 14px 0; font-size: 10pt; }
  ul { margin: 6px 0; padding-left: 20px; }
  li { margin: 2px 0; }
  .page-break { page-break-before: always; }
  p { margin: 6px 0; }
  code { font-family: Consolas, monospace; background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
</style>
</head>
<body>
`;

const HTML_FOOTER = `
</body>
</html>
`;

export async function generatePdfBuffer(report: ConsolidatedReport): Promise<Buffer> {
  const markdown = generateMarkdown(report);
  const html = markdownToHtml(markdown);

  let browser;
  try {
    browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    const pdf = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: { top: '24mm', right: '20mm', bottom: '24mm', left: '20mm' },
    });
    return Buffer.from(pdf);
  } catch (error) {
    throw new Error(`PDF generation failed: ${toErrorMessage(error)}`);
  } finally {
    if (browser) await browser.close();
  }
}

export function markdownToHtml(markdown: string): string {
  const safe = escapeHtml(markdown);
  const withBreaks = safe
    .split('\n\n')
    .map((paragraph) => {
      if (paragraph.startsWith('# ')) return `<h1>${paragraph.slice(2)}</h1>`;
      if (paragraph.startsWith('## ')) return `<h2>${paragraph.slice(3)}</h2>`;
      if (paragraph.startsWith('### ')) return `<h3>${paragraph.slice(4)}</h3>`;
      if (paragraph.startsWith('#### ')) return `<h4>${paragraph.slice(5)}</h4>`;
      if (paragraph.startsWith('> ')) return `<div class="disclaimer">${paragraph.slice(2)}</div>`;
      if (paragraph.startsWith('| ')) return renderTable(paragraph);
      if (paragraph.startsWith('- ') || paragraph.startsWith('1. ')) return renderList(paragraph);
      return `<p>${paragraph}</p>`;
    })
    .join('\n');

  const withPageBreaks = withBreaks.replace(/<h3>/g, '<div class="page-break"></div>\n<h3>');
  return HTML_HEADER + withPageBreaks + HTML_FOOTER;
}

function renderTable(paragraph: string): string {
  const rows = paragraph.split('\n').filter((line) => line.trim().startsWith('|'));
  if (rows.length < 3) return `<p>${paragraph}</p>`;

  // First row is header, second is separator, remainder are body.
  const header = rows[0];
  const headerCells = header.split('|').map((c) => c.trim()).filter((c) => c);
  const ths = headerCells.map((c) => `<th>${c}</th>`).join('');

  const bodyRows = rows.slice(2)
    .map((line) => {
      const rowCells = line.split('|').map((c) => c.trim()).filter((c) => c);
      return `<tr>${rowCells.map((c) => `<td>${c}</td>`).join('')}</tr>`;
    })
    .join('');

  return `<table><thead><tr>${ths}</tr></thead><tbody>${bodyRows}</tbody></table>`;
}

function renderList(paragraph: string): string {
  const lines = paragraph.split('\n');
  const isOrdered = lines[0].startsWith('1.');
  const tag = isOrdered ? 'ol' : 'ul';
  const items = lines
    .map((line) => {
      const match = line.match(/^\s*(?:-\s+|\d+\.\s+)(.*)$/);
      return match ? `<li>${match[1]}</li>` : `<li>${line}</li>`;
    })
    .join('');
  return `<${tag}>${items}</${tag}>`;
}

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
