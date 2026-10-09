import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { CaseStatus, RecordsResponse } from '../../core/models';
import { RecordsService } from '../../core/records.service';
import { CaseTableComponent } from '../../shared/case-table/case-table.component';
import { DelayService } from '../../core/delay.service';

type Filter = 'All' | CaseStatus;
const FILTERS: Filter[] = ['All', 'Verified', 'In progress', 'Pending', 'Discrepancy'];

@Component({
  selector: 'app-cases',
  standalone: true,
  imports: [CaseTableComponent],
  template: `
    <header class="head">
      <h1>{{ auth.isAdmin() ? 'All cases' : 'My cases' }}</h1>
      <p class="muted">
        {{ auth.isAdmin()
          ? 'Every case, with who it is assigned to and internal notes.'
          : 'The cases assigned to you.' }}
      </p>
    </header>

    <section class="panel pad" aria-label="Cases">
      <div class="toolbar">
        <div class="filters" role="group" aria-label="Filter by status">
          @for (f of filters; track f) {
            <button type="button" class="filter" [class.on]="filter() === f"
                    [attr.aria-pressed]="filter() === f" (click)="setFilter(f)">
              {{ f }} <span class="count">{{ countFor(f) }}</span>
            </button>
          }
        </div>
        <button type="button" class="btn small" (click)="load()" [disabled]="loading()">Reload</button>
      </div>

      @if (failed()) {
        <p class="error" role="alert">
          Cases could not be loaded.
          <button type="button" class="btn small" (click)="load()">Try again</button>
        </p>
      }

      <app-case-table
        [cases]="visible()"
        [loading]="loading()"
        [showAdminColumns]="auth.isAdmin()"
        [emptyText]="emptyText()" />
    </section>
  `,
  styles: [`
    .head { margin-bottom: 1.25rem; }
    .head h1 { font-size: 1.8rem; }
    .head .muted { margin: 0.3rem 0 0; }
    .pad { padding: 1.25rem; }
    .toolbar { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 0.75rem; margin-bottom: 0.75rem; }
    .filters { display: flex; flex-wrap: wrap; gap: 0.35rem; }
    .filter {
      padding: 0.25rem 0.7rem;
      border: 1px solid var(--line);
      background: #fff;
      border-radius: 999px;
      font: inherit;
      font-size: 0.85rem;
      color: var(--ink);
      cursor: pointer;
    }
    .filter.on { background: var(--teal); border-color: var(--teal); color: #fff; }
    .count { opacity: 0.75; margin-left: 0.15rem; }
    .small { padding: 0.25rem 0.7rem; font-size: 0.85rem; }
    .error { color: var(--danger); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
  `]
})
export class CasesComponent {
  auth = inject(AuthService);
  private api = inject(RecordsService);
  private delay = inject(DelayService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  filters = FILTERS;
  data = signal<RecordsResponse | null>(null);
  loading = signal(true);
  failed = signal(false);

  // The status in the address bar, for example /my-cases?status=Pending
  private statusParam = toSignal(
    this.route.queryParamMap.pipe(map(params => params.get('status'))),
    { initialValue: this.route.snapshot.queryParamMap.get('status') }
  );

  filter = computed<Filter>(() => {
    const value = this.statusParam();
    return FILTERS.includes(value as Filter) ? (value as Filter) : 'All';
  });

  cases = computed(() => this.data()?.records ?? []);

  visible = computed(() =>
    this.filter() === 'All' ? this.cases() : this.cases().filter(c => c.status === this.filter())
  );

  emptyText = computed(() =>
    this.filter() === 'All' ? 'No cases have been assigned yet.' : `No ${this.filter()} cases.`
  );

  constructor() {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.api
      .load(this.delay.ms())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: result => {
          this.data.set(result);
          this.loading.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.loading.set(false);
        }
      });
  }

  setFilter(filter: Filter): void {
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { status: filter === 'All' ? null : filter },
      queryParamsHandling: 'merge'
    });
  }

  countFor(filter: Filter): number {
    return filter === 'All' ? this.cases().length : this.cases().filter(c => c.status === filter).length;
  }
}