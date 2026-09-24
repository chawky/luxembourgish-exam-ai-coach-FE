import { Routes } from '@angular/router';
import { adminGuard, authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/landing/landing.component').then((m) => m.LandingComponent),
  },
  {
    path: 'sproochentest',
    loadComponent: () =>
      import('./pages/sproochentest/sproochentest.component').then(
        (m) => m.SproochentestComponent,
      ),
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
    path: 'forgot-password',
    loadComponent: () =>
      import('./pages/auth/password-reset.component').then(
        (m) => m.PasswordResetComponent,
      ),
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./pages/auth/password-reset.component').then(
        (m) => m.PasswordResetComponent,
      ),
  },
  {
    path: 'payment/success',
    loadComponent: () =>
      import('./pages/payment/payment-return.component').then(
        (m) => m.PaymentReturnComponent,
      ),
    data: { checkout: 'success' },
  },
  {
    path: 'payment/cancel',
    loadComponent: () =>
      import('./pages/payment/payment-return.component').then(
        (m) => m.PaymentReturnComponent,
      ),
    data: { checkout: 'cancel' },
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
        path: 'profile',
        loadComponent: () =>
          import('./pages/profile/profile.component').then(
            (m) => m.ProfileComponent,
          ),
      },
      {
        path: 'admin',
        canActivate: [adminGuard],
        loadComponent: () =>
          import('./pages/admin/admin-profiles.component').then(
            (m) => m.AdminProfilesComponent,
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
        path: 'exercises',
        loadComponent: () =>
          import('./pages/exercises/exercises.component').then(
            (m) => m.ExercisesComponent,
          ),
      },
      {
        path: 'image-description',
        loadComponent: () =>
          import('./pages/image-description/image-description.component').then(
            (m) => m.ImageDescriptionComponent,
          ),
      },
      { path: 'mock-exam', redirectTo: 'image-description' },
      {
        path: 'vocabulary',
        loadComponent: () =>
          import('./pages/vocabulary/vocabulary.component').then(
            (m) => m.VocabularyComponent,
          ),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
