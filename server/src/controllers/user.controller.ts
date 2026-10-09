import type { Request, Response } from 'express';
import * as userService from '../services/user.service';

export function list(req: Request, res: Response) {
  res.json(userService.listUsers());
}

export function create(req: Request, res: Response) {
  const body = req.body ?? {};
  const created = userService.createUser({
    userId: String(body.userId ?? '').trim().toLowerCase(),
    name: body.name,
    email: body.email,
    department: body.department,
    role: body.role,
    password: String(body.password ?? '')
  });
  res.status(201).json(created);
}

export function update(req: Request, res: Response) {
  const body = req.body ?? {};
  const updated = userService.updateUser(
    String(req.params.id),
    {
      name: body.name,
      email: body.email,
      department: body.department,
      role: body.role,
      password: body.password === undefined ? undefined : String(body.password)
    },
    (req as any).auth.sub
  );
  res.json(updated);
}

export function remove(req: Request, res: Response) {
  userService.deleteUser(String(req.params.id), (req as any).auth.sub);
  res.status(204).end();
}