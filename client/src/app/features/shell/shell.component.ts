import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { DelayService } from '../../core/delay.service';

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="shell">
      <aside class="side">
        <a class="brand" routerLink="/dashboard">Casefile</a>

        <nav aria-label="Main">
          @for (l of links(); track l.path) {
            <a [routerLink]="l.path" routerLinkActive="active">{{ l.label }}</a>
          }
        </nav>

        <div class="delay" role="group" aria-label="Simulated API delay">
          <span class="delay-label">Simulate slow API</span>
          <div class="segs">
            @for (o of delay.options; track o.ms) {
              <button type="button" class="seg" [class.on]="delay.ms() === o.ms"
                      [attr.aria-pressed]="delay.ms() === o.ms" (click)="delay.set(o.ms)">{{ o.label }}</button>
            }
          </div>
        </div>

        <div class="me">
          <div class="who">
            <strong>{{ auth.user()?.name }}</strong>
            <span>{{ auth.user()?.role }}</span>
          </div>
          <button type="button" class="logout" (click)="signOut()">Logout</button>
        </div>
      </aside>

      <main class="main"><router-outlet /></main>
    </div>
  `,
  styles: [`
    .shell { min-height: 100vh; display: grid; grid-template-columns: 15rem 1fr; }
    .side {
      background: var(--ink);
      color: #fff;
      padding: 1.5rem 1rem;
      display: flex;
      flex-direction: column;
      gap: 2rem;
      position: sticky;
      top: 0;
      height: 100vh;
    }
    .brand { font-weight: 700; font-size: 1.35rem; color: #fff; text-decoration: none; padding: 0 0.5rem; }
    nav { display: grid; gap: 0.25rem; }
    nav a {
      color: #C6D6D3;
      text-decoration: none;
      padding: 0.55rem 0.75rem;
      border-radius: var(--radius);
      border-left: 3px solid transparent;
      font-weight: 500;
    }
    nav a:hover { background: rgb(255 255 255 / 0.07); color: #fff; }
    nav a.active { background: rgb(255 255 255 / 0.1); color: #fff; border-left-color: #4FC3BF; }

    .delay { margin-top: auto; display: grid; gap: 0.4rem; padding: 0 0.5rem; }
    .delay-label { font-size: 0.8rem; color: #A9BDBA; }
    .segs { display: flex; flex-wrap: wrap; gap: 0.25rem; }
    .seg {
      padding: 0.2rem 0.55rem;
      border: 1.5px solid #6F8683;
      background: none;
      color: #fff;
      font: inherit;
      font-size: 0.8rem;
      border-radius: var(--radius);
      cursor: pointer;
    }
    .seg.on { background: #fff; color: var(--ink); border-color: #fff; }

    .me { display: grid; gap: 0.75rem; padding: 0.75rem; border-top: 1px solid rgb(255 255 255 / 0.15); }
    .who { display: grid; }
    .who span { color: #A9BDBA; font-size: 0.85rem; }
    .logout {
      justify-self: start;
      background: none;
      border: 1.5px solid #6F8683;
      color: #fff;
      padding: 0.3rem 0.8rem;
      border-radius: var(--radius);
      font: inherit;
      font-size: 0.85rem;
      cursor: pointer;
    }
    .logout:hover { background: #fff; color: var(--ink); }
    .main { padding: clamp(1rem, 3vw, 2.25rem); min-width: 0; }

    @media (max-width: 800px) {
      .shell { grid-template-columns: 1fr; }
      .side { position: static; height: auto; flex-direction: row; flex-wrap: wrap; align-items: center; gap: 0.75rem 1.5rem; padding: 0.75rem 1rem; }
      nav { display: flex; flex-wrap: wrap; }
      .delay { margin-top: 0; }
      .me { margin: 0 0 0 auto; border: 0; padding: 0; grid-auto-flow: column; align-items: center; }
      .who span { display: none; }
    }
  `]
})
export class ShellComponent {
  auth = inject(AuthService);
  delay = inject(DelayService);
  private router = inject(Router);

  links = computed(() =>
    this.auth.isAdmin()
      ? [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Manage cases', path: '/admin/cases' },
          { label: 'Manage users', path: '/admin/users' }
        ]
      : [
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'My cases', path: '/my-cases' }
        ]
  );

  signOut(): void {
    this.auth.logout();
    this.router.navigateByUrl('/login');
  }
}