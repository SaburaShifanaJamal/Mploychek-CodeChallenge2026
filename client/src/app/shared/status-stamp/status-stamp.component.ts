import { Component, computed, input } from '@angular/core';
import { CaseStatus } from '../../core/models';

const GLYPHS: Record<CaseStatus, string> = {
  Verified: '\u2713',
  'In progress': '\u21BB',
  Pending: '\u2026',
  Discrepancy: '!'
};

@Component({
  selector: 'app-status-stamp',
  standalone: true,
  template: `
    <span class="stamp" [class]="tone()">
      <span class="glyph" aria-hidden="true">{{ glyph() }}</span>{{ status() }}
    </span>
  `,
  styles: [`
    .stamp {
      --c: var(--ink);
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      padding: 0.12rem 0.6rem 0.12rem 0.45rem;
      border: 1.5px solid var(--c);
      border-radius: 4px;
      color: var(--c);
      background: color-mix(in srgb, var(--c) 8%, #fff);
      font-weight: 600;
      font-size: 0.82rem;
      white-space: nowrap;
    }
    .glyph {
      display: inline-grid;
      place-items: center;
      width: 1.1rem;
      height: 1.1rem;
      border-radius: 50%;
      background: var(--c);
      color: #fff;
      font-size: 0.7rem;
      line-height: 1;
    }
    .verified { --c: var(--verified); }
    .in-progress { --c: var(--progress); }
    .pending { --c: var(--pending); }
    .discrepancy { --c: var(--discrepancy); }
  `]
})
export class StatusStampComponent {
  status = input.required<CaseStatus>();
  glyph = computed(() => GLYPHS[this.status()]);
  tone = computed(() => this.status().toLowerCase().replace(' ', '-'));
}