export class AppError extends Error {
  status: number;
  code: string;
  isOperational: true = true;

  constructor(message: string, status = 500, code = 'INTERNAL_ERROR') {
    super(message);
    this.name   = 'AppError';
    this.status = status;
    this.code   = code;
  }
}
