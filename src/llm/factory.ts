import { OpenAIProvider } from './openaiProvider.js';
import { MockProvider } from './mockProvider.js';
import type { LLMProvider } from './provider.js';

export type ProviderType = 'openai' | 'mock';

export function createLLMProvider(
  provider: string,
  apiKey: string,
  model: string,
  baseURL?: string
): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(apiKey, model, baseURL);
    case 'mock':
      return new MockProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
