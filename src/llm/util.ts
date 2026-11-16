import fs from 'node:fs';
import { z } from 'zod';
import { toErrorMessage } from '../utils/text.js';

export function readCert(path: string): Buffer {
  try {
    return fs.readFileSync(path);
  } catch (error) {
    throw new Error(`Failed to read CA certificate from ${path}: ${toErrorMessage(error)}`);
  }
}

export function parseAndValidate<T extends z.ZodTypeAny>(schema: T, content: string): z.infer<T> {
  let parsed: unknown;
  try {
    parsed = JSON.parse(content);
  } catch (error) {
    throw new Error(`LLM returned invalid JSON: ${toErrorMessage(error)}`);
  }

  const result = schema.safeParse(parsed);
  if (!result.success) {
    throw new Error(`LLM output failed schema validation: ${result.error.message}`);
  }
  return result.data as z.infer<T>;
}
