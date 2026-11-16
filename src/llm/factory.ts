import { OpenAIProvider } from './openaiProvider.js';
import { GeminiProvider } from './geminiProvider.js';
import { MockProvider } from './mockProvider.js';
import type { LLMProvider } from './provider.js';

export type ProviderType = 'openai' | 'gemini' | 'genai' | 'mock';

export interface LLMProviderOptions {
  apiKey: string;
  model: string;
  baseURL?: string;
  caCert?: string;
  httpsProxy?: string;
}

export function createLLMProvider(
  provider: string,
  options: LLMProviderOptions
): LLMProvider {
  switch (provider.toLowerCase()) {
    case 'openai':
      return new OpenAIProvider(options);
    case 'gemini':
    case 'genai':
      return new GeminiProvider(options);
    case 'mock':
      return new MockProvider();
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}
