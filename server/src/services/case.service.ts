import { cases, users, saveData } from '../data';
import { HttpError } from '../errors';
import type { CaseRecord, CaseStatus } from '../types';

const STATUSES: CaseStatus[] = ['Verified', 'In progress', 'Pending', 'Discrepancy'];

function findOwner(assignedTo: string) {
  const owner = users.find(u => u.userId === assignedTo.toLowerCase());
  if (!owner) throw new HttpError(400, `No user with the ID "${assignedTo}".`);
  return owner;
}

export function getRecordsFor(userId: string, role: string) {
  if (role === 'Admin') {
    const records = cases.map(c => ({
      ...c,
      ownerName: users.find(u => u.id === c.ownerId)?.name ?? 'Unknown'
    }));
    return { accessLevel: 'all', records };
  }

  const records = cases
    .filter(c => c.ownerId === userId)
    .map(({ internalNote, ownerId, ...visible }) => visible);
  return { accessLevel: 'own', records };
}

interface NewCaseInput {
  candidate: string;
  checkType: string;
  assignedTo: string;
  status: string;
  internalNote: string;
}

export function createCase(input: NewCaseInput) {
  const { candidate, checkType, assignedTo, status, internalNote } = input;

  if (!candidate || !checkType || !assignedTo) {
    throw new HttpError(400, 'Fill in candidate, check type and assigned user.');
  }
  if (!STATUSES.includes(status as CaseStatus)) {
    throw new HttpError(400, 'Choose a valid status.');
  }
  const owner = findOwner(assignedTo);

  const highest = Math.max(0, ...cases.map(c => Number(c.id.replace('CF-', '')) || 0));
  const newCase: CaseRecord = {
    id: `CF-${highest + 1}`,
    ownerId: owner.id,
    candidate,
    checkType,
    status: status as CaseStatus,
    updatedAt: new Date().toISOString().slice(0, 10),
    internalNote
  };
  cases.push(newCase);
  saveData();
  return { ...newCase, ownerName: owner.name };
}

interface CaseChanges {
  assignedTo?: string;
  status?: string;
  internalNote?: string;
}

export function updateCase(id: string, changes: CaseChanges) {
  const found = cases.find(c => c.id === id);
  if (!found) throw new HttpError(404, 'That case no longer exists.');

  const { assignedTo, status, internalNote } = changes;

  
  if (status !== undefined && !STATUSES.includes(status as CaseStatus)) {
    throw new HttpError(400, 'Choose a valid status.');
  }
  const newOwner = assignedTo ? findOwner(assignedTo) : undefined;

  if (newOwner) found.ownerId = newOwner.id;
  if (status !== undefined) found.status = status as CaseStatus;
  if (internalNote !== undefined) found.internalNote = internalNote;
  found.updatedAt = new Date().toISOString().slice(0, 10);
  saveData();

  const owner = users.find(u => u.id === found.ownerId);
  return { ...found, ownerName: owner?.name ?? 'Unknown' };
}