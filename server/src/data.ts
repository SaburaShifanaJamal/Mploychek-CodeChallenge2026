import bcrypt from 'bcryptjs';
import { User, CaseRecord } from './types';
import fs from 'fs';
import path from 'path';

export const users: User[] = [
  {
    id: 'u-1',
    userId: 'admin',
    name: 'Sabura Shifana J',
    email: 'admin@casefile.demo',
    department: 'Operations',
    role: 'Admin',
    passwordHash: bcrypt.hashSync('Admin@123', 8)
  },
  {
    id: 'u-2',
    userId: 'sabura',
    name: 'Sabura Jamal',
    email: 'sabura@casefile.demo',
    department: 'Education checks',
    role: 'General User',
    passwordHash: bcrypt.hashSync('User@123', 8)
  }
];

export const cases: CaseRecord[] = [
  { id: 'CF-1041', ownerId: 'u-2', candidate: 'Meera Nair', checkType: 'Education', status: 'Verified', updatedAt: '2026-10-01', internalNote: 'Degree confirmed with the registrar.' },
  { id: 'CF-1042', ownerId: 'u-2', candidate: 'Karthik Rao', checkType: 'Education', status: 'In progress', updatedAt: '2026-10-05', internalNote: 'Waiting for the transcript.' },
  { id: 'CF-1043', ownerId: 'u-2', candidate: 'Sana Iqbal', checkType: 'Identity', status: 'Pending', updatedAt: '2026-10-06', internalNote: 'Documents requested.' },
  { id: 'CF-1001', ownerId: 'u-1', candidate: 'Rohan Shetty', checkType: 'Identity', status: 'Verified', updatedAt: '2026-09-22', internalNote: 'Reviewed personally.' },
  { id: 'CF-1002', ownerId: 'u-1', candidate: 'Divya Pillai', checkType: 'Employment', status: 'Discrepancy', updatedAt: '2026-10-02', internalNote: 'Joining date differs by two months.' }
];

const DATA_DIR = path.join(__dirname, '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

export function saveData(): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  fs.writeFileSync(DB_FILE, JSON.stringify({ users, cases }, null, 2));
}

// On startup: load the saved file if it exists, otherwise create it from the starting lists above.
if (fs.existsSync(DB_FILE)) {
  const saved = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
  users.splice(0, users.length, ...saved.users);
  cases.splice(0, cases.length, ...saved.cases);
} else {
  saveData();
}