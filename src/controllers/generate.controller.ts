import { type Request, type Response, type NextFunction } from 'express';
import * as bonusService   from '../services/bonus.service.js';
import { ValidationError } from '../errors/ValidationError.js';

export function generate(req: Request, res: Response, next: NextFunction): void {
  try {
    const cfg = bonusService.generate(req.body || {});
    res.json({ cfg });
  } catch (err) {
    next(err);
  }
}

export function recalc(req: Request, res: Response, next: NextFunction): void {
  const { cfg, overrides } = req.body as { cfg?: Record<string, unknown>; overrides?: Record<string, unknown> } || {};
  if (!cfg) { next(new ValidationError('cfg required')); return; }
  try {
    res.json(bonusService.recalc(cfg, overrides ?? {}));
  } catch (err) {
    next(err);
  }
}
