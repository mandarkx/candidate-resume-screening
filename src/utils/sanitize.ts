import path from 'node:path';

const MAX_FILENAME_LENGTH = 120;

export function sanitizeFilename(name: string): string {
  const base = path.basename(name);
  const withoutControlChars = base.replace(/[\x00-\x1f\x7f]/g, '');
  const safe = withoutControlChars.replace(/[^a-zA-Z0-9._\- ]/g, '_');
  const trimmed = safe.replace(/\s+/g, ' ').trim();
  const ext = path.extname(trimmed);
  const stem = path.basename(trimmed, ext);
  const limitedStem = stem.slice(0, MAX_FILENAME_LENGTH - ext.length);
  return limitedStem + ext;
}

export function normalizeText(text: string): string {
  return (
    text
      // Replace CRLF and mixed line endings with LF
      .replace(/\r\n/g, '\n')
      .replace(/\r/g, '\n')
      // Replace non-breaking spaces and tabs with regular spaces
      .replace(/\u00A0/g, ' ')
      .replace(/\t/g, ' ')
      // Collapse multiple spaces
      .replace(/[ ]+/g, ' ')
      // Collapse multiple blank lines
      .replace(/\n{4,}/g, '\n\n\n')
      .trim()
  );
}

export function estimateTokenCount(text: string): number {
  // Very rough heuristic: 1 token ~= 0.75 words or 4 chars for English text.
  const wordCount = text.split(/\s+/).filter(Boolean).length;
  return Math.ceil(wordCount * 1.33);
}

export function isSupportedMimeType(mimeType: string): boolean {
  const supported = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  ];
  return supported.includes(mimeType);
}
