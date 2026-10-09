import { Request, Response, NextFunction } from 'express';

export const simulateDelay = (req: Request, res: Response, next: NextFunction) => {
  const ms = Math.min(Math.max(Number(req.query.delay) || 0, 0), 10000);
  if (ms > 0) setTimeout(next, ms);
  else next();
};
  