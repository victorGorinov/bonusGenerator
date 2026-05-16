import { AppError } from './AppError.js';

export class ValidationError extends AppError {
  constructor(message, details) {
    super(message, 400, 'VALIDATION_ERROR');
    this.name    = 'ValidationError';
    this.details = details;
  }
}
