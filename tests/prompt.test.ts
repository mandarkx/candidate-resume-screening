import { describe, it, expect } from 'vitest';
import { loadPromptByTemplateId, listTemplates } from '../src/prompts/loader.js';

describe('Prompt Management', () => {
  it('lists available templates', async () => {
    const templates = await listTemplates();
    expect(templates.length).toBeGreaterThanOrEqual(3);
    expect(templates.some((t) => t.id === 'candidate-evaluation')).toBe(true);
  });

  it('loads the candidate-evaluation prompt', async () => {
    const prompt = await loadPromptByTemplateId('candidate-evaluation');
    expect(prompt).toContain('Resume Candidate Evaluation');
    expect(prompt).toContain('overallScore');
  });

  it('throws for unknown template', async () => {
    await expect(loadPromptByTemplateId('unknown-template')).rejects.toThrow('Unknown evaluation template');
  });
});
