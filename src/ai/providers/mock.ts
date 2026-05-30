import type { AIProvider } from '../interface.js';

export class MockAIProvider implements AIProvider {
  private responses: string[];

  constructor(responses: string[] = []) {
    this.responses = responses;
  }

  async generate(): Promise<string> {
    return this.responses.shift() ?? '{}';
  }
}
