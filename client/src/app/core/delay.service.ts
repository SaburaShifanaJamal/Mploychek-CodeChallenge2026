import { Injectable, signal } from '@angular/core';

const KEY = 'casefile.delay';

@Injectable({ providedIn: 'root' })
export class DelayService {
  readonly options = [
    { label: 'Off', ms: 0 },
    { label: '0.5 s', ms: 500 },
    { label: '1.5 s', ms: 1500 },
    { label: '3 s', ms: 3000 }
  ];

  readonly ms = signal(this.read());

  set(ms: number): void {
    this.ms.set(ms);
    sessionStorage.setItem(KEY, String(ms));
  }

  private read(): number {
    const saved = sessionStorage.getItem(KEY);
    return saved === null ? 500 : Number(saved) || 0;
  }
}