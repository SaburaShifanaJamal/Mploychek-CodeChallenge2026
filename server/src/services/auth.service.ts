import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { users } from '../data';
import { JWT_SECRET } from '../config';
import { HttpError } from '../errors';
import { toSafe } from './user.service';

export function login(userId: string, password: string, role: string) {
  const user = users.find(u => u.userId === userId);

  if (!user || !bcrypt.compareSync(password, user.passwordHash)) {
    throw new HttpError(401, 'User ID or password is incorrect.');
  }
  if (user.role !== role) {
    throw new HttpError(403, `This account is registered as ${user.role}.`);
  }

  const token = jwt.sign({ sub: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
  return { token, user: toSafe(user) };
}