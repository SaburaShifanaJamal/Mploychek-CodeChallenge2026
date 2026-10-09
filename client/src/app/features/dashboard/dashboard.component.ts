import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink } from '@angular/router';
import { Subject, catchError, of, switchMap, tap } from 'rxjs';
import { AuthService } from '../../core/auth.service';
import { DelayService } from '../../core/delay.service';
import { CaseStatus, RecordsResponse, User } from '../../core/models';
import { RecordsService } from '../../core/records.service';
import { UserService } from '../../core/user.service';
import { CaseTableComponent } from '../../shared/case-table/case-table.component';

interface Stat {
  label: string;
  value: number;
  status: CaseStatus | null;
  tone: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [RouterLink, CaseTableComponent],
  template: `
    <header class="head">
      <h1>{{ greeting }}, {{ firstName() }}</h1>
      <p class="muted">
        {{ auth.isAdmin() ? "Here's the full verification workload." : "Here's your verification workload." }}
      </p>
    </header>

    <section class="stats" aria-label="Case summary">
      @for (s of stats(); track s.label) {
        <a class="stat" [attr.data-tone]="s.tone" [routerLink]="basePath()"
           [queryParams]="s.status ? { status: s.status } : null">
          @if (loading()) {
            <span class="skeleton" style="width: 2rem; height: 1.8rem"></span>
          } @else {
            <strong>{{ s.value }}</strong>
          }
          <span>{{ s.label }}</span>
        </a>
      }
    </section>

    <div class="grid">
      <section class="panel pad" aria-labelledby="latest-h">
        <div class="latest-head">
          <h2 id="latest-h">Latest cases</h2>
          <a [routerLink]="basePath()">View all</a>
        </div>

        @if (failed()) {
          <p class="error" role="alert">
            Cases could not be loaded.
            <button type="button" class="btn small" (click)="reload()">Try again</button>
          </p>
        }

        <app-case-table
          [cases]="latest()"
          [loading]="loading()"
          [showAdminColumns]="auth.isAdmin()"
          emptyText="No cases yet." />
      </section>

      <section class="panel pad" aria-labelledby="profile-h">
        <h2 id="profile-h">Your details</h2>
        @if (profile(); as p) {
          <dl>
            <div><dt>Name</dt><dd>{{ p.name }}</dd></div>
            <div><dt>User ID</dt><dd>{{ p.userId }}</dd></div>
            <div><dt>Email</dt><dd class="wrap">{{ p.email }}</dd></div>
            <div><dt>Department</dt><dd>{{ p.department }}</dd></div>
            <div><dt>Role</dt><dd>{{ p.role }}</dd></div>
          </dl>
        } @else {
          <dl>
            @for (i of [1, 2, 3, 4, 5]; track i) {
              <div>
                <dt><span class="skeleton" style="width: 4rem"></span></dt>
                <dd><span class="skeleton" style="width: 9rem"></span></dd>
              </div>
            }
          </dl>
        }
      </section>
    </div>
  `,
  styles: [`
    .head { margin-bottom: 1.25rem; }
    .head h1 { font-size: 1.8rem; }
    .head .muted { margin: 0.3rem 0 0; }

    .stats { display: grid; grid-template-columns: repeat(auto-fit, minmax(9.5rem, 1fr)); gap: 0.75rem; margin-bottom: 1.25rem; }
      .stat {
      --c: var(--ink);
      position: relative;
      isolation: isolate;
      display: grid;
      gap: 0.15rem;
      padding: 0.9rem 1rem;
      background: var(--surface);
      border: 1px solid var(--line);
      border-left: 4px solid var(--c);
      border-radius: var(--radius);
      color: inherit;
      text-decoration: none;
      box-shadow: 0 1px 2px rgb(22 39 43 / 0.06);
      transition:
        transform 0.35s cubic-bezier(0.2, 0.7, 0.2, 1),
        box-shadow 0.35s ease,
        border-color 0.35s ease;
    }

    
    .stat::before {
      content: '';
      position: absolute;
      inset: 0;
      z-index: -1;
      border-radius: inherit;
      background: linear-gradient(135deg, color-mix(in srgb, var(--c) 10%, #fff), #fff 75%);
      opacity: 0;
      transition: opacity 0.35s ease;
    }

    .stat:focus-visible { outline: 3px solid var(--teal); outline-offset: 2px; }

    
    @media (hover: hover) {
      .stat:hover,
      .stat:focus-visible {
        border-color: var(--c);
        transform: perspective(700px) translateY(-5px) rotateX(3deg);
        box-shadow:
          0 14px 28px color-mix(in srgb, var(--c) 22%, transparent),
          0 4px 8px rgb(22 39 43 / 0.08);
      }
      .stat:hover::before,
      .stat:focus-visible::before { opacity: 1; }
    }

    @media (prefers-reduced-motion: reduce) {
      .stat { transition: none; }
      .stat:hover, .stat:focus-visible { transform: none; }
    }
    .stat strong { font-size: 1.8rem; line-height: 1.1; }
    .stat span:last-child { color: var(--ink-soft); font-size: 0.9rem; }
    .stat[data-tone='pending'] { --c: var(--pending); }
    .stat[data-tone='progress'] { --c: var(--progress); }
    .stat[data-tone='verified'] { --c: var(--verified); }
    .stat[data-tone='discrepancy'] { --c: var(--discrepancy); }

    .grid { display: grid; grid-template-columns: minmax(0, 1fr) 18rem; gap: 1.25rem; align-items: start; }
    .pad { padding: 1.25rem; }
    .latest-head { display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 0.5rem; }
    .latest-head a { color: var(--teal-dark); font-weight: 600; }
    .error { color: var(--danger); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }
    .small { padding: 0.25rem 0.7rem; font-size: 0.85rem; }

    dl { margin: 0.85rem 0 0; display: grid; gap: 0.65rem; }
    dt { font-size: 0.8rem; color: var(--ink-soft); }
    dd { margin: 0; font-weight: 500; }
    .wrap { overflow-wrap: anywhere; }

    @media (max-width: 1000px) { .grid { grid-template-columns: 1fr; } }
  `]
})
export class DashboardComponent {
  auth = inject(AuthService);
  private users = inject(UserService);
  private recordsApi = inject(RecordsService);
  private delay = inject(DelayService);
  private destroyRef = inject(DestroyRef);

  profile = signal<User | null>(null);
  data = signal<RecordsResponse | null>(null);
  loading = signal(true);
  failed = signal(false);

  greeting = this.makeGreeting();
  firstName = computed(() => this.auth.user()?.name.split(' ')[0] ?? '');
  basePath = computed(() => (this.auth.isAdmin() ? '/admin/cases' : '/my-cases'));
  cases = computed(() => this.data()?.records ?? []);

  latest = computed(() =>
    [...this.cases()].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)).slice(0, 5)
  );

  stats = computed<Stat[]>(() => {
    const list = this.cases();
    const count = (status: CaseStatus) => list.filter(c => c.status === status).length;
    return [
      { label: this.auth.isAdmin() ? 'All cases' : 'My cases', value: list.length, status: null, tone: 'total' },
      { label: 'Pending', value: count('Pending'), status: 'Pending', tone: 'pending' },
      { label: 'In progress', value: count('In progress'), status: 'In progress', tone: 'progress' },
      { label: 'Verified', value: count('Verified'), status: 'Verified', tone: 'verified' },
      { label: 'Discrepancy', value: count('Discrepancy'), status: 'Discrepancy', tone: 'discrepancy' }
    ];
  });

  private reload$ = new Subject<void>();

  constructor() {
    // Your details and the cases load independently, so one can appear while the other is still loading.
    this.users
      .me()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({ next: user => this.profile.set(user) });

    // switchMap cancels an older request if a newer one starts.
    this.reload$
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.failed.set(false);
        }),
        switchMap(() => this.recordsApi.load(this.delay.ms()).pipe(catchError(() => of(null)))),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(result => {
        this.data.set(result);
        this.failed.set(result === null);
        this.loading.set(false);
      });

    this.reload();
  }

  reload(): void {
    this.reload$.next();
  }

  private makeGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  }
}