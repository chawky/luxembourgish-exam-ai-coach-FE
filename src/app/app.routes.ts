import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/auth/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'signup',
    loadComponent: () =>
      import('./pages/auth/signup.component').then((m) => m.SignupComponent),
  },
  {
    path: 'otp',
    loadComponent: () =>
      import('./pages/auth/otp.component').then((m) => m.OtpComponent),
  },
  {
    path: 'app',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./pages/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./pages/dashboard/dashboard.component').then(
            (m) => m.DashboardComponent,
          ),
      },
      {
        path: 'speaking',
        loadComponent: () =>
          import('./pages/speaking/speaking.component').then(
            (m) => m.SpeakingComponent,
          ),
      },
      {
        path: 'listening',
        loadComponent: () =>
          import('./pages/listening/listening.component').then(
            (m) => m.ListeningComponent,
          ),
      },
      {
        path: 'mock-exam',
        loadComponent: () =>
          import('./pages/mock-exam/mock-exam.component').then(
            (m) => m.MockExamComponent,
          ),
      },
      {
        path: 'vocabulary',
        loadComponent: () =>
          import('./pages/vocabulary/vocabulary.component').then(
            (m) => m.VocabularyComponent,
          ),
      },
      {
        path: 'chat',
        loadComponent: () =>
          import('./pages/chat/chat.component').then((m) => m.ChatComponent),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
