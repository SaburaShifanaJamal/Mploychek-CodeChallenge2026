import type { Request, Response } from 'express';
import { HttpError } from '../errors';
import * as authService from '../services/auth.service';
import * as userService from '../services/user.service';

export function login(req: Request, res: Response) {
  const body = req.body ?? {};
  const userId = String(body.userId ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const role = body.role;

  if (!userId || !password || !role) {
    throw new HttpError(400, 'Enter your user ID, password and role.');
  }
  res.json(authService.login(userId, password, role));
}

export function me(req: Request, res: Response) {
  const { sub } = (req as any).auth;
  res.json(userService.getSafeById(sub));
}