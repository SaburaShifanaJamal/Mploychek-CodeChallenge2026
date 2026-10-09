export type Role = 'General User' | 'Admin';

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  passwordHash: string;
}

export type CaseStatus = 'Verified' | 'In progress' | 'Pending' | 'Discrepancy';

export interface CaseRecord {
  id: string;
  ownerId: string;
  candidate: string;
  checkType: string;
  status: CaseStatus;
  updatedAt: string;
  internalNote: string;
}