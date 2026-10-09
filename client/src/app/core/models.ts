export type Role = 'General User' | 'Admin';
export type CaseStatus = 'Verified' | 'In progress' | 'Pending' | 'Discrepancy';

export interface User {
  id: string;
  userId: string;
  name: string;
  email: string;
  department: string;
  role: Role;
}

export interface LoginRequest {
  userId: string;
  password: string;
  role: Role;
}

export interface LoginResponse {
  token: string;
  user: User;
}
export interface CaseRecord {
  id: string;
  candidate: string;
  checkType: string;
  status: CaseStatus;
  updatedAt: string;
  // Only admins receive these two fields from the server.
  ownerName?: string;
  ownerId?: string;
  internalNote?: string;
}

export interface RecordsResponse {
  accessLevel: 'own' | 'all';
  records: CaseRecord[];
}

export interface UserDraft {
  userId: string;
  name: string;
  email: string;
  department: string;
  role: Role;
  password?: string;
}

export interface CaseDraft {
  candidate: string;
  checkType: string;
  assignedTo: string;
  status: CaseStatus;
  internalNote: string;
}