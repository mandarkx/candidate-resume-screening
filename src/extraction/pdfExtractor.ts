import fs from 'node:fs/promises';
import pdfParse from 'pdf-parse';
import { normalizeText } from '../utils/sanitize.js';

export async function extractTextFromPdf(filePath: string): Promise<string> {
  const buffer = await fs.readFile(filePath);
  const data = await pdfParse(new Uint8Array(buffer) as unknown as Buffer);
  if (!data.text || data.text.trim().length === 0) {
    throw new Error('PDF contained no extractable text (possibly scanned or image-based).');
  }
  return normalizeText(data.text);
}
