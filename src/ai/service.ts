import { getAIProvider }       from './registry.js';
import type { AIGenerateOpts } from './interface.js';

export function generate(prompt: string, opts?: AIGenerateOpts): Promise<string> {
  return getAIProvider().generate(prompt, opts);
}
