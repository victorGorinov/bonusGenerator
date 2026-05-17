import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  details: unknown;

  constructor(message: string, details?: unknown) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name    = 'ValidationError';
    this.details = details;
  }
}
