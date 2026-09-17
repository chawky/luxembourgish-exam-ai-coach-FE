import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormBuilder,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { GoogleSignInService } from '../../services/google-sign-in.service';
import { LogoComponent } from '../../components/logo.component';
import { AuthLayoutComponent } from './auth-layout.component';
import { IconComponent } from '../../components/icon.component';
import { friendlyErrorMessage } from '../../error-message';
import { GoogleSignInButtonComponent } from '../../components/google-sign-in-button.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    AuthLayoutComponent,
    IconComponent,
    GoogleSignInButtonComponent,
  ],
  template: `
    <app-auth-layout>
      <a routerLink="/" class="back-link">&larr; Back to home</a>
      <app-logo></app-logo>
      <h1 class="title">Welcome back</h1>
      <p class="text-muted subtitle">
        Sign in to continue your Luxembourgish practice.
      </p>

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
          <div class="password-control">
            <input
              id="password"
              [type]="passwordVisible() ? 'text' : 'password'"
              class="input password-input"
              formControlName="password"
              [class.error]="invalid('password')"
              autocomplete="current-password"
              placeholder="Your password"
            />
            <button
              type="button"
              class="password-toggle"
              [attr.aria-label]="passwordVisible() ? 'Hide secret' : 'Show secret'"
              (click)="passwordVisible.set(!passwordVisible())"
            >
              <app-icon [name]="passwordVisible() ? 'eye-off' : 'eye'" [size]="18"></app-icon>
            </button>
          </div>
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

      @if (googleConfigured) {
        <div class="auth-divider"><span>or</span></div>
        <app-google-sign-in-button
          text="signin_with"
          unavailableMessage="Google sign-in is not available right now. Use email and password."
          (credential)="submitGoogle($event)"
        ></app-google-sign-in-button>
        @if (googleLoading()) {
          <p class="google-status" role="status">Signing in with Google...</p>
        }
      }

      @if (noticeMsg()) {
        <div class="form-success" role="status">{{ noticeMsg() }}</div>
      }

      <p class="forgot">
        <a routerLink="/forgot-password">Forgot password?</a>
      </p>

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
      .form-error {
        background: var(--red-50);
        color: var(--red);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .form-success {
        background: #143525;
        color: var(--green);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-top: 16px;
      }
      .auth-divider {
        display: flex;
        align-items: center;
        gap: 12px;
        color: var(--slate-500);
        font-size: 13px;
        font-weight: 700;
        margin: 18px 0;
      }
      .auth-divider::before,
      .auth-divider::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }
      .google-status {
        color: var(--slate-500);
        font-size: 14px;
        margin: 10px 0 0;
        text-align: center;
      }
      .password-control {
        position: relative;
      }
      .password-input {
        padding-right: 46px;
      }
      .password-toggle {
        position: absolute;
        top: 50%;
        right: 12px;
        transform: translateY(-50%);
        border: 0;
        background: transparent;
        color: var(--slate-500);
        cursor: pointer;
        display: inline-flex;
        align-items: center;
        justify-content: center;
        padding: 6px;
      }
      .password-toggle:hover {
        color: var(--blue-700);
      }
      .switch {
        margin-top: 20px;
        font-size: 14.5px;
      }
      .forgot {
        margin: 14px 0 0;
        text-align: center;
        font-size: 14.5px;
      }
      .forgot a,
      .switch a {
        color: var(--blue-700);
        font-weight: 600;
      }
    `,
  ],
})
export class LoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private googleSignIn = inject(GoogleSignInService);
  private router = inject(Router);

  loading = signal(false);
  googleLoading = signal(false);
  errorMsg = signal('');
  noticeMsg = signal('');
  passwordVisible = signal(false);
  readonly googleConfigured = this.googleSignIn.isConfigured;

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });

  ngOnInit(): void {
    const notice =
      this.router.getCurrentNavigation()?.extras.state?.['notice'] ??
      window.history.state?.['notice'];

    if (typeof notice === 'string' && notice) {
      this.noticeMsg.set(notice);
    }
  }

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    this.errorMsg.set('');
    this.noticeMsg.set('');
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
        if (this.isEmailVerificationError(error)) {
          this.router.navigate(['/otp'], {
            queryParams: { email },
            state: {
              notice:
                'Please verify your email. Use Resend code if you need a new code.',
            },
          });
          return;
        }

        this.errorMsg.set(this.errorMessage(error));
        this.loading.set(false);
      },
      complete: () => {
        this.loading.set(false);
      },
    });
  }

  submitGoogle(idToken: string): void {
    if (this.loading()) {
      return;
    }

    this.errorMsg.set('');
    this.noticeMsg.set('');
    this.loading.set(true);
    this.googleLoading.set(true);

    this.auth.googleLogin(idToken).subscribe({
      next: () => {
        this.router.navigate(['/app/dashboard']);
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.loading.set(false);
        this.googleLoading.set(false);
      },
      complete: () => {
        this.loading.set(false);
        this.googleLoading.set(false);
      },
    });
  }

  private errorMessage(error: unknown): string {
    const message = error instanceof Error ? error.message.trim().toLowerCase() : '';

    if (
      message === 'please log in and try again.' ||
      message === 'unauthorized' ||
      message.includes('bad credentials') ||
      message.includes('invalid username or password')
    ) {
      return 'Email or password is incorrect.';
    }

    return friendlyErrorMessage(error);
  }

  private isEmailVerificationError(error: unknown): boolean {
    if (!(error instanceof Error) || !error.message) {
      return false;
    }

    const message = error.message.toLowerCase();
    return (
      message.includes('verify your email') ||
      message.includes('email is not verified') ||
      message.includes('email not verified') ||
      message.includes('account is not verified') ||
      message.includes('account not verified') ||
      message.includes('unverified account') ||
      message.includes('unverified email')
    );
  }
}
