import mammoth from 'mammoth';
import { normalizeText } from '../utils/sanitize.js';

export async function extractTextFromDocx(filePath: string): Promise<string> {
  const result = await mammoth.extractRawText({ path: filePath });
  if (!result.value || result.value.trim().length === 0) {
    throw new Error('DOCX file contained no extractable text.');
  }
  return normalizeText(result.value);
}
