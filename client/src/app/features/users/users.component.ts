import { HttpErrorResponse } from '@angular/common/http';
import { Component, DestroyRef, HostListener, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { DelayService } from '../../core/delay.service';
import { Role, User } from '../../core/models';
import { UserService } from '../../core/user.service';

type Field = 'name' | 'userId' | 'email' | 'department' | 'password';

@Component({
  selector: 'app-users',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <header class="head">
      <div>
        <h1>Manage users</h1>
        <p class="muted">Add people, change their role or details, and remove accounts.</p>
      </div>
      <button type="button" class="btn btn-primary" (click)="openNew()">Add user</button>
    </header>

    @if (notice(); as n) {
      <p class="notice" [class.bad]="n.kind === 'error'" role="status">{{ n.text }}</p>
    }

    <section class="panel" aria-label="Users">
      <div class="table-wrap">
        <table>
          <thead>
            <tr>
              <th scope="col">Name</th>
              <th scope="col">User ID</th>
              <th scope="col">Role</th>
              <th scope="col">Department</th>
              <th scope="col"><span class="sr-only">Actions</span></th>
            </tr>
          </thead>
          <tbody>
            @if (loading()) {
              @for (i of [1, 2, 3, 4]; track i) {
                <tr>
                  <td><span class="skeleton" style="width: 9rem"></span></td>
                  <td><span class="skeleton" style="width: 5rem"></span></td>
                  <td><span class="skeleton" style="width: 6rem"></span></td>
                  <td><span class="skeleton" style="width: 7rem"></span></td>
                  <td></td>
                </tr>
              }
            } @else {
              @for (u of users(); track u.id) {
                <tr>
                  <td>
                    <strong>{{ u.name }}</strong>
                    @if (u.id === auth.user()?.id) { <span class="you">You</span> }
                    <div class="muted small">{{ u.email }}</div>
                  </td>
                  <td>{{ u.userId }}</td>
                  <td><span class="role" [class.admin]="u.role === 'Admin'">{{ u.role }}</span></td>
                  <td>{{ u.department }}</td>
                  <td class="actions">
                    @if (confirmingId() === u.id) {
                      <span class="small">Delete {{ u.name }}?</span>
                      <button type="button" class="btn small danger" (click)="remove(u)">Yes, delete</button>
                      <button type="button" class="btn small" (click)="confirmingId.set(null)">Keep</button>
                    } @else {
                      <button type="button" class="btn small" (click)="openEdit(u)">Edit</button>
                      @if (u.id !== auth.user()?.id) {
                        <button type="button" class="btn small danger" (click)="confirmingId.set(u.id)">Delete</button>
                      }
                    }
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="5" class="empty">No users yet. Select Add user to create one.</td></tr>
              }
            }
          </tbody>
        </table>
      </div>
    </section>

    @if (editing() !== null) {
      <div class="scrim" (click)="close()"></div>
      <div class="dialog" role="dialog" aria-modal="true" aria-labelledby="dlg-title">
        <h2 id="dlg-title">{{ isNew() ? 'Add user' : 'Edit user' }}</h2>

        <form [formGroup]="form" (ngSubmit)="save()" novalidate>
          <div class="field">
            <label for="name">Full name</label>
            <input id="name" class="input" formControlName="name" [class.invalid]="bad('name')" />
            @if (bad('name')) { <span class="error-text">Enter the full name.</span> }
          </div>

          <div class="two">
            <div class="field">
              <label for="uid">User ID</label>
              <input id="uid" class="input" formControlName="userId" autocomplete="off" [class.invalid]="bad('userId')" />
              @if (bad('userId')) { <span class="error-text">Use 3 to 20 letters, numbers, dots, dashes or underscores.</span> }
            </div>
            <div class="field">
              <label for="role">Role</label>
              <select id="role" class="input" formControlName="role">
                @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
              </select>
            </div>
          </div>

          <div class="field">
            <label for="email">Email</label>
            <input id="email" class="input" type="email" formControlName="email" [class.invalid]="bad('email')" />
            @if (bad('email')) { <span class="error-text">Enter a valid email address.</span> }
          </div>

          <div class="field">
            <label for="dept">Department</label>
            <input id="dept" class="input" formControlName="department" [class.invalid]="bad('department')" />
            @if (bad('department')) { <span class="error-text">Enter a department.</span> }
          </div>

          <div class="field">
            <label for="pw">{{ isNew() ? 'Password' : 'New password' }}</label>
            <input id="pw" class="input" type="password" formControlName="password"
                   autocomplete="new-password" [class.invalid]="bad('password')" />
            @if (bad('password')) {
              <span class="error-text">Use at least 6 characters.</span>
            } @else if (!isNew()) {
              <span class="hint">Leave blank to keep the current password.</span>
            }
          </div>

          @if (formError()) { <p class="error-text" role="alert">{{ formError() }}</p> }

          <div class="buttons">
            <button type="button" class="btn" (click)="close()">Cancel</button>
            <button type="submit" class="btn btn-primary" [disabled]="saving()">
              {{ saving() ? 'Saving...' : (isNew() ? 'Add user' : 'Save changes') }}
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
    .small { font-size: 0.85rem; }
    .sr-only { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }

    .notice { margin: 0 0 1rem; padding: 0.65rem 1rem; border-left: 4px solid var(--verified); background: #E7F3EC; border-radius: var(--radius); }
    .notice.bad { border-left-color: var(--discrepancy); background: #F8E8E6; }

    .table-wrap { overflow-x: auto; }
    table { width: 100%; border-collapse: collapse; }
    th {
      text-align: left;
      padding: 0.65rem 0.9rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ink-soft);
      border-bottom: 2px solid var(--ink);
      white-space: nowrap;
    }
    td { padding: 0.75rem 0.9rem; border-bottom: 1px solid var(--line); vertical-align: middle; }
    tbody tr:last-child td { border-bottom: 0; }
    .empty { text-align: center; padding: 2rem 1rem; color: var(--ink-soft); }

    .you { margin-left: 0.5rem; padding: 0.05rem 0.45rem; border-radius: 4px; background: var(--ink); color: #fff; font-size: 0.75rem; font-weight: 600; }
    .role { padding: 0.1rem 0.55rem; border: 1.5px solid var(--ink-soft); border-radius: 4px; font-size: 0.82rem; font-weight: 600; color: var(--ink-soft); white-space: nowrap; }
    .role.admin { border-color: var(--teal); color: var(--teal-dark); background: #E3F1F0; }

    .actions { display: flex; flex-wrap: wrap; gap: 0.4rem; align-items: center; justify-content: flex-end; }
    .btn.small { padding: 0.25rem 0.65rem; font-size: 0.85rem; }
    .btn.danger { border-color: var(--discrepancy); color: var(--discrepancy); }
    .btn.danger:hover:not(:disabled) { background: var(--discrepancy); color: #fff; }

    .scrim { position: fixed; inset: 0; background: rgb(22 39 43 / 0.55); z-index: 30; }
    .dialog {
      position: fixed;
      z-index: 31;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: min(30rem, calc(100vw - 2rem));
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
    .error-text { color: var(--discrepancy); font-size: 0.85rem; }
    .hint { color: var(--ink-soft); font-size: 0.85rem; }

    .two { display: grid; grid-template-columns: 1fr 1fr; gap: 0 0.75rem; }
    .buttons { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 0.5rem; }
    @media (max-width: 520px) { .two { grid-template-columns: 1fr; } }
  `]
})
export class UsersComponent {
  auth = inject(AuthService);
  private api = inject(UserService);
  private delay = inject(DelayService);
  private fb = inject(FormBuilder);
  private destroyRef = inject(DestroyRef);

  roles: Role[] = ['General User', 'Admin'];

  users = signal<User[]>([]);
  loading = signal(true);
  saving = signal(false);
  editing = signal<User | 'new' | null>(null);
  confirmingId = signal<string | null>(null);
  formError = signal('');
  notice = signal<{ kind: 'success' | 'error'; text: string } | null>(null);
  isNew = computed(() => this.editing() === 'new');

  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    userId: ['', [Validators.required, Validators.pattern(/^[a-zA-Z0-9._-]{3,20}$/)]],
    email: ['', [Validators.required, Validators.email]],
    department: ['', Validators.required],
    role: ['General User' as Role, Validators.required],
    password: ['']
  });

  constructor() {
    this.load();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    if (this.editing() !== null) this.close();
  }

  bad(field: Field): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  load(): void {
    this.loading.set(true);
    this.api
      .list(this.delay.ms())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: users => {
          this.users.set(users);
          this.loading.set(false);
        },
        error: () => {
          this.loading.set(false);
          this.say('error', 'Could not load users. Try again.');
        }
      });
  }

  openNew(): void {
    this.form.reset({ name: '', userId: '', email: '', department: '', role: 'General User', password: '' });
    this.form.controls.userId.enable();
    this.form.controls.role.enable();
    this.form.controls.password.setValidators([Validators.required, Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.formError.set('');
    this.editing.set('new');
  }

  openEdit(user: User): void {
    this.form.reset({
      name: user.name,
      userId: user.userId,
      email: user.email,
      department: user.department,
      role: user.role,
      password: ''
    });
    this.form.controls.userId.disable();
    // You cannot change your own role, so the server would refuse it anyway.
    if (user.id === this.auth.user()?.id) this.form.controls.role.disable();
    else this.form.controls.role.enable();
    this.form.controls.password.setValidators([Validators.minLength(6)]);
    this.form.controls.password.updateValueAndValidity();
    this.formError.set('');
    this.editing.set(user);
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
    const request = target === 'new' ? this.api.create(draft) : this.api.update(target.id, draft);

    this.saving.set(true);
    this.formError.set('');
    request.subscribe({
      next: () => {
        this.saving.set(false);
        this.close();
        this.say('success', target === 'new' ? 'User added.' : 'User updated.');
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.saving.set(false);
        this.formError.set(e.error?.message ?? 'Could not save the user.');
      }
    });
  }

  remove(user: User): void {
    this.api.remove(user.id).subscribe({
      next: () => {
        this.confirmingId.set(null);
        this.say('success', `${user.name} was deleted.`);
        this.load();
      },
      error: (e: HttpErrorResponse) => {
        this.confirmingId.set(null);
        this.say('error', e.error?.message ?? 'Could not delete the user.');
      }
    });
  }

  private say(kind: 'success' | 'error', text: string): void {
    this.notice.set({ kind, text });
    setTimeout(() => this.notice.set(null), 5000);
  }
}