import { Routes } from '@angular/router';
import { adminGuard, authGuard, guestGuard } from './core/guards';

export const routes: Routes = [
  {
    path: 'login',
    title: 'Sign in - Casefile',
    canActivate: [guestGuard],
    loadComponent: () => import('./features/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: '',
    canActivate: [authGuard],
    loadComponent: () => import('./features/shell/shell.component').then(m => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        title: 'Dashboard - Casefile',
        loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent)
      },
      {
        path: 'my-cases',
        title: 'My cases - Casefile',
        loadComponent: () => import('./features/cases/cases.component').then(m => m.CasesComponent)
      },
      {
        path: 'admin/cases',
        title: 'Manage cases - Casefile',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/admin-cases/admin-cases.component').then(m => m.AdminCasesComponent)
      },
      {
        path: 'admin/users',
        title: 'Manage users - Casefile',
        canActivate: [adminGuard],
        loadComponent: () => import('./features/users/users.component').then(m => m.UsersComponent)
      }
    ]
  },
  { path: '**', redirectTo: '' }
];