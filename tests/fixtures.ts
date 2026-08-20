import fs from 'node:fs/promises';
import path from 'node:path';
import { Document, Packer, Paragraph, TextRun } from 'docx';
import { PDFDocument, StandardFonts } from 'pdf-lib';

const FIXTURE_DIR = path.resolve(process.cwd(), 'tests', 'fixtures');

async function ensureDir(): Promise<void> {
  await fs.mkdir(FIXTURE_DIR, { recursive: true });
}

export async function createDocxFixture(filename: string, content: string): Promise<string> {
  await ensureDir();
  const filePath = path.join(FIXTURE_DIR, filename);
  const doc = new Document({
    sections: [{
      properties: {},
      children: content.split('\n').map((line) => new Paragraph({
        children: [new TextRun(line)],
      })),
    }],
  });
  const buffer = await Packer.toBuffer(doc);
  await fs.writeFile(filePath, buffer);
  return filePath;
}

export async function createPdfFixture(filename: string, content: string): Promise<string> {
  await ensureDir();
  const filePath = path.join(FIXTURE_DIR, filename);
  const pdfDoc = await PDFDocument.create();
  const page = pdfDoc.addPage();
  const { width, height } = page.getSize();
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
  const fontSize = 12;
  const lineHeight = fontSize * 1.2;
  const lines = content.split('\n');

  lines.forEach((line, i) => {
    page.drawText(line, {
      x: 50,
      y: height - 50 - i * lineHeight,
      size: fontSize,
      font,
      maxWidth: width - 100,
    });
  });

  const pdfBytes = await pdfDoc.save({ useObjectStreams: false });
  await fs.writeFile(filePath, pdfBytes);
  return filePath;
}

export async function cleanupFixtures(): Promise<void> {
  try {
    const entries = await fs.readdir(FIXTURE_DIR);
    for (const entry of entries) {
      await fs.unlink(path.join(FIXTURE_DIR, entry));
    }
  } catch {
    // ignore
  }
}
