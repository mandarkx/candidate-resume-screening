import path from 'node:path';
import { extractTextFromPdf } from './pdfExtractor.js';
import { extractTextFromDocx } from './docxExtractor.js';
import { normalizeText, isSupportedMimeType } from '../utils/sanitize.js';
import { toErrorMessage } from '../utils/text.js';
import type { UploadedFile, ExtractionResult } from '../shared/types.js';

export function getSupportedMimeTypes(): string[] {
  return [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
}

export function getExtensionFromMime(mimeType: string): string {
  switch (mimeType) {
    case 'application/pdf':
      return '.pdf';
    case 'application/vnd.openxmlformats-officedocument.wordprocessingml.document':
      return '.docx';
    default:
      return path.extname(mimeType) || '';
  }
}

export async function extractText(file: UploadedFile): Promise<ExtractionResult> {
  try {
    if (!isSupportedMimeType(file.mimeType)) {
      throw new Error(`Unsupported file type: ${file.mimeType}`);
    }

    let text: string;
    if (file.mimeType === 'application/pdf') {
      text = await extractTextFromPdf(file.path);
    } else if (file.mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      text = await extractTextFromDocx(file.path);
    } else {
      throw new Error(`No extractor registered for type: ${file.mimeType}`);
    }

    // Apply prompt-injection countermeasures by clearly framing content as data.
    const safeText = text
      .replace(/<<|>>/g, '')
      .replace(/\[system\]/gi, '[SYSTEM-REDACTED]')
      .replace(/\{system\}/gi, '{SYSTEM-REDACTED}')
      .replace(/\(\(\(system\)\)\)/gi, '(((SYSTEM-REDACTED)))');

    return {
      file,
      text: normalizeText(safeText),
      success: true,
    };
  } catch (error) {
    return {
      file,
      text: '',
      success: false,
      error: toErrorMessage(error),
    };
  }
}
