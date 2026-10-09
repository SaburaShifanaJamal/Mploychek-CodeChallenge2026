import bcrypt from 'bcryptjs';
import { users, saveData } from '../data';
import { HttpError } from '../errors';
import type { Role, User } from '../types';

export const toSafe = ({ passwordHash, ...rest }: User) => rest;

const isRole = (value: unknown): value is Role => value === 'Admin' || value === 'General User';

export function getSafeById(id: string) {
  const user = users.find(u => u.id === id);
  if (!user) throw new HttpError(401, 'This account no longer exists.');
  return toSafe(user);
}

export function listUsers() {
  return users.map(toSafe);
}

interface NewUserInput {
  userId: string;
  name: string;
  email: string;
  department: string;
  role: unknown;
  password: string;
}

export function createUser(input: NewUserInput) {
  const { userId, name, email, department, role, password } = input;

  if (!userId || !name || !email || !department || !password) {
    throw new HttpError(400, 'Fill in all the fields.');
  }
  if (!isRole(role)) {
    throw new HttpError(400, 'Choose General User or Admin.');
  }
  if (password.length < 6) {
    throw new HttpError(400, 'Use a password with at least 6 characters.');
  }
  if (users.some(u => u.userId === userId)) {
    throw new HttpError(409, `The user ID "${userId}" is already taken.`);
  }

  const newUser: User = {
    id: `u-${Date.now()}`,
    userId,
    name,
    email,
    department,
    role,
    passwordHash: bcrypt.hashSync(password, 8)
  };
  users.push(newUser);
  saveData();
  return toSafe(newUser);
}

interface UserChanges {
  name?: string;
  email?: string;
  department?: string;
  role?: unknown;
  password?: string;
}

export function updateUser(id: string, changes: UserChanges, currentUserId: string) {
  const user = users.find(u => u.id === id);
  if (!user) throw new HttpError(404, 'That user no longer exists.');

  const { name, email, department, role, password } = changes;

  
  if (role) {
    if (!isRole(role)) throw new HttpError(400, 'Choose General User or Admin.');
    if (user.id === currentUserId && role !== user.role) {
      throw new HttpError(400, 'You cannot change your own role.');
    }
  }
  if (password && password.length < 6) {
    throw new HttpError(400, 'Use a password with at least 6 characters.');
  }

  if (name) user.name = name;
  if (email) user.email = email;
  if (department) user.department = department;
  if (role && isRole(role)) user.role = role;
  if (password) user.passwordHash = bcrypt.hashSync(password, 8);

  return toSafe(user);
  saveData();
}

export function deleteUser(id: string, currentUserId: string) {
  if (id === currentUserId) {
    throw new HttpError(400, 'You cannot delete your own account.');
  }
  const index = users.findIndex(u => u.id === id);
  if (index === -1) throw new HttpError(404, 'That user no longer exists.');
  users.splice(index, 1);
  saveData();
}