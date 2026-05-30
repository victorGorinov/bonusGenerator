export interface AIGenerateOpts {
  maxTokens?: number;
  retries?:   number;
}

export interface AIProvider {
  generate(prompt: string, opts?: AIGenerateOpts): Promise<string>;
}
