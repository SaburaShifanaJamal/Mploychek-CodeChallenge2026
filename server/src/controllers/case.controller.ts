import type { Request, Response } from 'express';
import * as caseService from '../services/case.service';

export function list(req: Request, res: Response) {
  const { sub, role } = (req as any).auth;
  res.json(caseService.getRecordsFor(sub, role));
}

export function create(req: Request, res: Response) {
  const body = req.body ?? {};
  const created = caseService.createCase({
    candidate: String(body.candidate ?? '').trim(),
    checkType: String(body.checkType ?? '').trim(),
    assignedTo: String(body.assignedTo ?? '').trim(),
    status: String(body.status ?? 'Pending'),
    internalNote: String(body.internalNote ?? '').trim()
  });
  res.status(201).json(created);
}

export function update(req: Request, res: Response) {
  const body = req.body ?? {};
  const updated = caseService.updateCase(String(req.params.id), {
    assignedTo: body.assignedTo === undefined ? undefined : String(body.assignedTo).trim(),
    status: body.status === undefined ? undefined : String(body.status),
    internalNote: body.internalNote === undefined ? undefined : String(body.internalNote).trim()
  });
  res.json(updated);
}