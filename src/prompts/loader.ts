import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import type { PromptTemplate } from '../shared/types.js';

let templatesCache: PromptTemplate[] | null = null;

function getRepoRoot(): string {
  const currentFile = fileURLToPath(import.meta.url);
  return path.resolve(path.dirname(currentFile), '..', '..');
}

export function getPromptsDirectory(): string {
  return path.join(getRepoRoot(), 'prompts');
}

export async function loadTemplates(): Promise<PromptTemplate[]> {
  if (templatesCache) return templatesCache;

  const templatesPath = path.join(getRepoRoot(), 'src', 'prompts', 'templates.json');
  const raw = await fs.readFile(templatesPath, 'utf-8');
  const parsed: PromptTemplate[] = JSON.parse(raw);

  // Resolve file paths relative to repo root.
  templatesCache = parsed.map((t) => ({
    ...t,
    filePath: path.resolve(getRepoRoot(), t.filePath),
  }));
  return templatesCache;
}

export async function loadPromptByTemplateId(templateId: string): Promise<string> {
  const templates = await loadTemplates();
  const template = templates.find((t) => t.id === templateId);
  if (!template) {
    throw new Error(`Unknown evaluation template: ${templateId}`);
  }
  return await loadPromptFile(template.filePath);
}

export async function loadPromptFile(filePath: string): Promise<string> {
  try {
    return await fs.readFile(filePath, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to load prompt from ${filePath}: ${(error as Error).message}`);
  }
}

export async function listTemplates(): Promise<PromptTemplate[]> {
  return await loadTemplates();
}

export function clearTemplatesCache(): void {
  templatesCache = null;
}
