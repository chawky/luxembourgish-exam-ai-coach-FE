import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  Router,
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
} from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../components/logo.component';
import { IconComponent } from '../../components/icon.component';

interface NavItem {
  path: string;
  label: string;
  icon: string;
}

@Component({
  selector: 'app-shell',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    RouterLink,
    RouterLinkActive,
    LogoComponent,
    IconComponent,
  ],
  template: `
    <div class="layout" [class.open]="menuOpen()">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="side-top">
          <a routerLink="/app/dashboard"><app-logo></app-logo></a>
        </div>
        <nav class="side-nav" aria-label="App sections">
          @for (item of nav; track item.path) {
            <a
              [routerLink]="item.path"
              routerLinkActive="active"
              (click)="menuOpen.set(false)"
            >
              <app-icon [name]="item.icon" [size]="20"></app-icon>
              <span>{{ item.label }}</span>
            </a>
          }
        </nav>
        <div class="side-foot">
          <div class="user">
            <span class="avatar">{{ initials() }}</span>
            <div class="user-meta">
              <strong>{{ auth.currentUser()?.username }}</strong>
              <small class="text-muted">{{ auth.currentUser()?.email }}</small>
            </div>
          </div>
          <button class="btn btn-ghost btn-block logout" (click)="logout()">
            <app-icon name="logout" [size]="18"></app-icon> Sign out
          </button>
        </div>
      </aside>

      <!-- Backdrop for mobile -->
      <div class="backdrop" (click)="menuOpen.set(false)"></div>

      <!-- Main -->
      <div class="main">
        <header class="topbar">
          <button
            class="icon-btn"
            (click)="menuOpen.set(!menuOpen())"
            aria-label="Toggle navigation menu"
          >
            <app-icon name="menu" [size]="22"></app-icon>
          </button>
          <a routerLink="/app/dashboard" class="mobile-logo">
            <app-logo></app-logo>
          </a>
          <span class="badge badge-green streak">
            <app-icon name="flame" [size]="14"></app-icon> 12-day streak
          </span>
        </header>
        <main class="content">
          <router-outlet></router-outlet>
        </main>
      </div>
    </div>
  `,
  styleUrl: './shell.component.css',
})
export class ShellComponent {
  auth = inject(AuthService);
  private router = inject(Router);
  menuOpen = signal(false);

  nav: NavItem[] = [
    { path: '/app/dashboard', label: 'Dashboard', icon: 'chart' },
    { path: '/app/speaking', label: 'Speaking', icon: 'mic' },
    { path: '/app/listening', label: 'Listening', icon: 'headphones' },
    { path: '/app/exercises', label: 'Exercises', icon: 'book' },
    { path: '/app/mock-exam', label: 'Mock Exam', icon: 'clipboard' },
    { path: '/app/vocabulary', label: 'Vocabulary', icon: 'cards' },
    { path: '/app/chat', label: 'AI Tutor', icon: 'chat' },
  ];

  initials(): string {
    const name = this.auth.currentUser()?.username ?? '';
    return name
      .split(' ')
      .map((p) => p[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  logout(): void {
    this.auth.logout().subscribe(() => {
      this.router.navigate(['/']);
    });
  }
}
