import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { LoginRequest, Role } from '../../core/models';
import { StatusStampComponent } from '../../shared/status-stamp/status-stamp.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, StatusStampComponent],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  roles: Role[] = ['General User', 'Admin'];
  demoAccounts: LoginRequest[] = [
    { userId: 'admin', password: 'Admin@123', role: 'Admin' },
    { userId: 'sabura', password: 'User@123', role: 'General User' }
  ];

  busy = signal(false);
  error = signal('');
  showPassword = signal(false);

  form = this.fb.nonNullable.group({
    userId: ['', Validators.required],
    password: ['', Validators.required],
    role: ['General User' as Role, Validators.required]
  });

  showError(field: 'userId' | 'password'): boolean {
    const control = this.form.controls[field];
    return control.invalid && control.touched;
  }

  fill(account: LoginRequest): void {
    this.form.setValue(account);
    this.error.set('');
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.busy.set(true);
    this.error.set('');

    this.auth.login(this.form.getRawValue()).subscribe({
      next: () => this.router.navigateByUrl('/dashboard'),
      error: (e: HttpErrorResponse) => {
        this.busy.set(false);
        this.error.set(e.error?.message ?? 'Cannot reach the server. Check that the API is running.');
      }
    });
  }
}