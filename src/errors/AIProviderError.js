import { AppError } from './AppError.js';

export class AIProviderError extends AppError {
  constructor(message) {
    super(message, 502, 'AI_PROVIDER_ERROR');
    this.name = 'AIProviderError';
  }
}
