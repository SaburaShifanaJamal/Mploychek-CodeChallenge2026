import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config';

export const authenticate = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization ?? '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';

  try {
    const payload = jwt.verify(token, JWT_SECRET);
    (req as any).auth = payload;
    next();
  } catch (err) {
    console.log('Token check failed:', (err as Error).message);
    res.status(401).json({ message: 'Your session has expired. Sign in again.' });
  }
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  if ((req as any).auth.role !== 'Admin') {
    res.status(403).json({ message: 'Only admins can do this.' });
    return;
  }
  next();
};