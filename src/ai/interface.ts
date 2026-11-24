export interface AIGenerateOpts {
  maxTokens?: number;
  retries?:   number;
  // Override the model for this call (defaults to AI_MODEL). Used by the
  // competitor-search path to run on the stronger AI_SEARCH_MODEL.
  model?:     string;
  // When set, the request is made with Anthropic's server-side web_search tool
  // enabled and the model's final text (after any tool-use / pause_turn rounds)
  // is returned. maxUses caps how many searches the model may run.
  webSearch?: { maxUses?: number };
  // Wall-clock budget for the whole call (all web-search rounds included).
  // Defaults to AI_TIMEOUT, or AI_SEARCH_TIMEOUT when webSearch is set.
  timeoutMs?: number;
}

export interface AIProvider {
  generate(prompt: string, opts?: AIGenerateOpts): Promise<string>;
}
