import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toSignal } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { DelayService } from '../../core/delay.service';
import { CaseRecord, CaseStatus, RecordsResponse, User } from '../../core/models';
import { RecordsService } from '../../core/records.service';
import { UserService } from '../../core/user.service';
import { CaseTableComponent } from '../../shared/case-table/case-table.component';

type Filter = 'All' | CaseStatus;
type Field = 'candidate' | 'assignedTo';

const FILTERS: Filter[] = ['All', 'Verified', 'In progress', 'Pending', 'Discrepancy'];
const STATUSES: CaseStatus[] = ['Pending', 'In progress', 'Verified', 'Discrepancy'];
const CHECK_TYPES = ['Education', 'Employment', 'Identity', 'Address', 'Court records', 'Reference'];

@Component({
  selector: 'app-admin-cases',
  standalone: true,
  imports: [CaseTableComponent, ReactiveFormsModule],
  template: `
    <header class="head">
      <div>
        <h1>Manage cases</h1>
        <p class="muted">Create cases, assign them to people, and update their status.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openNew()">Add case</button>
    </header>

    @if (notice(); as n) {
      <p class="notice" [class.bad]="n.kind === 'error'" role="status">{{ n.text }}</p>
    }

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
        <button type="button" class="btn small" (click)="loadCases()" [disabled]="loading()">Reload</button>
      </div>

      @if (failed()) {
        <p class="error" role="alert">
          Cases could not be loaded.
          <button type="button" class="btn small" (click)="loadCases()">Try again</button>
        </p>
      }

      <app-case-table
        [cases]="visible()"
        [loading]="loading()"
        [showAdminColumns]="true"
        [editable]="true"
        [emptyText]="emptyText()"
        (edit)="openEdit($event)" />
    </section>

    @if (editing() !== null) {
      <div class="scrim" (click)="close()"></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 id="dlg-title">{{ isNew() ? 'Add case' : 'Edit case ' + editingId() }}</h2>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="field">
            <label for="candidate">Candidate</label>
            <input id="candidate" class="input" formControlName="candidate" [class.invalid]="bad('candidate')" />
            @if (bad('candidate')) { <span class="error-text">Enter the candidate's full name.</span> }
          </div>

          <div class="two">
            <div class="field">
              <label for="checkType">Check type</label>
              <select id="checkType" class="input" formControlName="checkType">
                @for (t of checkTypes; track t) { <option [value]="t">{{ t }}</option> }
              </select>
            </div>
            <div class="field">
              <label for="status">Status</label>
              <select id="status" class="input" formControlName="status">
                @for (s of statuses; track s) { <option [value]="s">{{ s }}</option> }
              </select>
            </div>
          </div>
          @if (!isNew()) {
            <p class="hint spaced">The candidate and check type cannot be changed after a case is created.</p>
          }

          <div class="field">
            <label for="assignedTo">Assigned to</label>
            <select id="assignedTo" class="input" formControlName="assignedTo" [class.invalid]="bad('assignedTo')">
              <option value="" disabled>Choose a person</option>
              @for (u of users(); track u.id) {
                <option [value]="u.userId">{{ u.name }} ({{ u.userId }})</option>
              }
            </select>
            @if (bad('assignedTo')) { <span class="error-text">Choose who this case is assigned to.</span> }
          </div>

          <div class="field">
            <label for="note">Internal note</label>
            <textarea id="note" class="input" rows="3" formControlName="internalNote"></textarea>
            <span class="hint">Only admins can see this note.</span>
          </div>

          @if (formError()) { <p class="error-text" role="alert">{{ formError() }}</p> }

          <div class="buttons">
            <button type="button" class="btn" (click)="close()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (isNew() ? 'Add case' : 'Save changes') }}
            </button>
          </div>
        </form>
      </div>
    }
  `,
  styles: [`
    .head { display: flex; flex-wrap: wrap; justify-content: space-between; align-items: end; gap: 1rem 2rem; margin-bottom: 1.25rem; }
    .head h1 { font-size: 1.8rem; }
    .head .muted { margin: 0.3rem 0 0; }
    .pad { padding: 1.25rem; }

    .notice { margin: 0 0 1rem; padding: 0.65rem 1rem; border-left: 4px solid var(--verified); background: #E7F3EC; border-radius: var(--radius); }
    .notice.bad { border-left-color: var(--discrepancy); background: #F8E8E6; }

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
    .btn.small { padding: 0.25rem 0.7rem; font-size: 0.85rem; }
    .error { color: var(--danger); display: flex; align-items: center; gap: 0.75rem; flex-wrap: wrap; }

    .scrim { position: fixed; inset: 0; background: rgb(22 39 43 / 0.55); z-index: 30; }
    .dialog {
      position: fixed;
      z-index: 31;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(32rem, calc(100vw - 2rem));
      max-height: calc(100vh - 2rem);
      overflow-y: auto;
      background: #fff;
      border-radius: var(--radius);
      padding: 1.5rem;
      box-shadow: 0 20px 60px rgb(0 0 0 / 0.3);
    }
    .dialog h2 { font-size: 1.4rem; margin-bottom: 1.25rem; }

    .field { display: grid; gap: 0.3rem; margin-bottom: 1rem; }
    .field label { font-weight: 600; font-size: 0.9rem; }
    .input {
      width: 100%;
      padding: 0.55rem 0.7rem;
      border: 1.5px solid #9DB0AB;
      border-radius: var(--radius);
      background: #fff;
      color: var(--ink);
      font: inherit;
    }
    .input:focus { border-color: var(--teal); }
    .input:disabled { background: #EDF1EF; color: var(--ink-soft); }
    .input.invalid { border-color: var(--discrepancy); }
    textarea.input { resize: vertical; }
    .error-text { color: var(--discrepancy); font-size: 0.85rem; }
    .hint { color: var(--ink-soft); font-size: 0.85rem; }
    .hint.spaced { margin: -0.4rem 0 1rem; }

    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 0.75rem; }
    .buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
    @media (max-width: 520px) { .two { grid-template-columns: 1fr; } }
  `]
})
export class AdminCasesComponent {
  private recordsApi = inject(RecordsService);
  private usersApi = inject(UserService);
  private delay = inject(DelayService);
  private fb = inject(FormBuilder);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  filters = FILTERS;
  statuses = STATUSES;
  checkTypes = CHECK_TYPES;

  data = signal<RecordsResponse | null>(null);
  users = signal<User[]>([]);
  loading = signal(true);
  failed = signal(false);
  saving = signal(false);
  editing = signal<CaseRecord | 'new' | null>(null);
  formError = signal('');
  notice = signal<{ kind: 'success' | 'error'; text: string } | null>(null);

  isNew = computed(() => this.editing() === 'new');
  editingId = computed(() => {
    const e = this.editing();
    return e && e !== 'new' ? e.id : '';
  });

  // The status in the address bar, for example /admin/cases?status=Pending
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
    this.filter() === 'All' ? 'No cases yet. Select Add case to create one.' : `No ${this.filter()} cases.`
  );

  form = this.fb.nonNullable.group({
    candidate: ['', [Validators.required, Validators.minLength(2)]],
    checkType: [CHECK_TYPES[0], Validators.required],
    assignedTo: ['', Validators.required],
    status: ['Pending' as CaseStatus, Validators.required],
    internalNote: ['']
  });

  constructor() {
    this.loadCases();

    // The list of people for the "Assigned to" dropdown.
    this.usersApi
      .list()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => this.users.set(users),
        error: () => this.say('error', 'Could not load the list of users for assigning.')
      });
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editing() !== null) this.close();
  }

  bad(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  loadCases(): void {
    this.loading.set(true);
    this.failed.set(false);
    this.recordsApi
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

  openNew(): void {
    this.form.reset({
      candidate: '',
      checkType: CHECK_TYPES[0],
      assignedTo: '',
      status: 'Pending',
      internalNote: ''
    });
    this.form.controls.candidate.enable();
    this.form.controls.checkType.enable();
    this.formError.set('');
    this.editing.set('new');
  }

  openEdit(record: CaseRecord): void {
    const owner = this.users().find(u => u.id === record.ownerId);
    this.form.reset({
      candidate: record.candidate,
      checkType: record.checkType,
      assignedTo: owner?.userId ?? '',
      status: record.status,
      internalNote: record.internalNote ?? ''
    });
    // The server only allows changing the assignee, status and note of an existing case.
    this.form.controls.candidate.disable();
    this.form.controls.checkType.disable();
    this.formError.set('');
    this.editing.set(record);
  }

  close(): void {
    this.editing.set(null);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const target = this.editing();
    if (target === null) return;

    const draft = this.form.getRawValue();
    const request =
      target === 'new'
        ? this.recordsApi.create(draft)
        : this.recordsApi.update(target.id, {
            assignedTo: draft.assignedTo,
            status: draft.status,
            internalNote: draft.internalNote
          });

    this.saving.set(true);
    this.formError.set('');
    request.subscribe({
      next: saved => {
        this.saving.set(false);
        this.close();
        this.say(
          'success',
          target === 'new'
            ? `Case ${saved.id} was created and assigned to ${saved.ownerName}.`
            : `Case ${saved.id} was updated.`
        );
        this.loadCases();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(e.error?.message ?? 'Could not save the case.');
      }
    });
  }

  private say(kind: 'success' | 'error', text: string): void {
    this.notice.set({ kind, text });
    setTimeout(() => this.notice.set(null), 5000);
  }
}