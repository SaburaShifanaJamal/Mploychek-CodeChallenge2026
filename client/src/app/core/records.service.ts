import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { CaseDraft, CaseRecord, RecordsResponse } from './models';

@Injectable({ providedIn: 'root' })
export class RecordsService {
  private http = inject(HttpClient);

  load(delayMs = 0): Observable<RecordsResponse> {
    const params = new HttpParams().set('delay', delayMs);
    return this.http.get<RecordsResponse>('/api/records', { params });
  }

  create(draft: CaseDraft): Observable<CaseRecord> {
    return this.http.post<CaseRecord>('/api/records', draft);
  }

  update(
    id: string,
    changes: Pick<CaseDraft, 'assignedTo' | 'status' | 'internalNote'>
  ): Observable<CaseRecord> {
    return this.http.put<CaseRecord>(`/api/records/${id}`, changes);
  }
}