import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { LogoComponent } from './logo.component';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-public-nav',
  standalone: true,
  imports: [RouterLink, LogoComponent],
  template: `
    <header class="nav">
      <div class="container flex items-center justify-between">
        <a routerLink="/" aria-label="Letz speak home">
          <app-logo></app-logo>
        </a>
        <nav class="links" aria-label="Primary">
          <a routerLink="/" fragment="features">Features</a>
          <a routerLink="/" fragment="how">How it works</a>
          <a routerLink="/sproochentest">Sproochentest guide</a>
          <a routerLink="/" fragment="support">Support</a>
        </nav>
        <div class="flex items-center gap-2">
          @if (auth.isLoggedIn()) {
            <a routerLink="/app/dashboard" class="btn btn-primary">Dashboard</a>
          } @else {
            <a routerLink="/login" class="btn btn-ghost">Sign in</a>
            <a routerLink="/signup" class="btn btn-primary">Start preparing</a>
          }
        </div>
      </div>
    </header>
  `,
  styles: [
    `
      .nav {
        position: sticky;
        top: 0;
        z-index: 20;
        background: rgba(16, 24, 38, 0.88);
        backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--border);
        padding: 12px 0;
      }
      .links {
        display: none;
        gap: 28px;
        font-weight: 600;
        font-size: 15px;
        color: var(--slate-700);
      }
      .links a:hover {
        color: var(--blue-700);
      }
      @media (min-width: 860px) {
        .links {
          display: flex;
        }
      }
    `,
  ],
})
export class PublicNavComponent {
  readonly auth = inject(AuthService);
}
