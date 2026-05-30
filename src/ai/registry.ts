import type { AIProvider } from './interface.js';
import { AnthropicProvider } from './providers/anthropic.js';

let _provider: AIProvider | null = null;

export function getAIProvider(): AIProvider {
  _provider ??= new AnthropicProvider();
  return _provider;
}

/** Override provider — use in tests with MockAIProvider. */
export function setAIProvider(p: AIProvider): void {
  _provider = p;
}
