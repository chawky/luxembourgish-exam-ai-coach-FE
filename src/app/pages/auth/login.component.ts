import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../components/logo.component';
import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    AuthLayoutComponent,
  ],
  template: `
    <app-auth-layout>
      <a routerLink="/" class="back-link">&larr; Back to home</a>
      <app-logo></app-logo>
      <h1 class="title">Welcome back</h1>
      <p class="text-muted subtitle">
        Sign in to continue preparing for your Sproochentest.
      </p>

      <div class="demo-hint">
        <strong>Demo account</strong>
        <span>demo&#64;sproochen.lu &middot; demo1234</span>
      </div>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="email">Email</label>
          <input
            id="email"
            type="email"
            class="input"
            formControlName="email"
            [class.error]="invalid('email')"
            autocomplete="email"
            placeholder="you@example.com"
          />
          @if (invalid('email')) {
            <span class="field-error">Enter a valid email address.</span>
          }
        </div>

        <div class="field">
          <label for="password">Password</label>
          <input
            id="password"
            type="password"
            class="input"
            formControlName="password"
            [class.error]="invalid('password')"
            autocomplete="current-password"
            placeholder="Your password"
          />
          @if (invalid('password')) {
            <span class="field-error">Password is required.</span>
          }
        </div>

        @if (errorMsg()) {
          <div class="form-error" role="alert">{{ errorMsg() }}</div>
        }

        <button
          type="submit"
          class="btn btn-primary btn-block btn-lg"
          [disabled]="loading()"
        >
          {{ loading() ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <p class="switch text-muted">
        New here? <a routerLink="/signup">Create an account</a>
      </p>
    </app-auth-layout>
  `,
  styles: [
    `
      .back-link {
        font-size: 14px;
        font-weight: 600;
        color: var(--slate-500);
        display: block;
        width: fit-content;
        margin-bottom: 22px;
      }
      .back-link:hover {
        color: var(--blue-700);
      }
      .title {
        font-size: 28px;
        margin-top: 22px;
      }
      .subtitle {
        margin: 8px 0 20px;
      }
      .demo-hint {
        display: flex;
        flex-direction: column;
        gap: 2px;
        background: var(--blue-50);
        border: 1px solid var(--blue-100);
        border-radius: 10px;
        padding: 12px 14px;
        margin-bottom: 22px;
        font-size: 13.5px;
        color: var(--blue-700);
      }
      .form-error {
        background: var(--red-50);
        color: var(--red);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .switch {
        margin-top: 20px;
        font-size: 14.5px;
      }
      .switch a {
        color: var(--blue-700);
        font-weight: 600;
      }
    `,
  ],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.nonNullable.group({
    email: ['demo@sproochen.lu', [Validators.required, Validators.email]],
    password: ['demo1234', [Validators.required]],
  });

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    this.errorMsg.set('');
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, password } = this.form.getRawValue();

    this.auth.login(email, password).subscribe({
      next: () => {
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
