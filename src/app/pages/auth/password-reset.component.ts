import { CommonModule } from '@angular/common';
import { Component, OnInit, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { LogoComponent } from '../../components/logo.component';
import { IconComponent } from '../../components/icon.component';
import { AuthService } from '../../services/auth.service';
import { AuthLayoutComponent } from './auth-layout.component';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const password = group.get('newPassword')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-password-reset',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LogoComponent,
    IconComponent,
    AuthLayoutComponent,
  ],
  template: `
    <app-auth-layout>
      <a routerLink="/login" class="back-link">&larr; Back to sign in</a>
      <app-logo></app-logo>
      <h1 class="title">
        {{ resetMode() ? 'Reset your password' : 'Forgot password?' }}
      </h1>
      <p class="text-muted subtitle">
        {{
          resetMode()
            ? 'Enter the code from your email and choose a new password.'
            : 'Enter your email and we will send a password reset code if the account exists.'
        }}
      </p>

      @if (!resetMode()) {
        <form [formGroup]="requestForm" (ngSubmit)="requestCode()" novalidate>
          <div class="field">
            <label for="requestEmail">Email</label>
            <input
              id="requestEmail"
              type="email"
              class="input"
              formControlName="email"
              [class.error]="requestEmailInvalid()"
              autocomplete="email"
              placeholder="you@example.com"
            />
            @if (requestEmailInvalid()) {
              <span class="field-error">Enter a valid email address.</span>
            }
          </div>

          @if (statusMsg()) {
            <div class="form-success" role="status">{{ statusMsg() }}</div>
          }

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="loading()"
          >
            {{ loading() ? 'Sending code...' : 'Send reset code' }}
          </button>
        </form>
      } @else {
        <form [formGroup]="resetForm" (ngSubmit)="resetPassword()" novalidate>
          <div class="field">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              class="input"
              formControlName="email"
              [class.error]="resetInvalid('email')"
              autocomplete="email"
              placeholder="you@example.com"
            />
            @if (resetInvalid('email')) {
              <span class="field-error">Enter a valid email address.</span>
            }
          </div>

          <div class="field">
            <label for="code">Reset code</label>
            <input
              id="code"
              type="text"
              class="input code-input"
              formControlName="code"
              [class.error]="resetInvalid('code')"
              autocomplete="one-time-code"
              inputmode="numeric"
              maxlength="6"
              placeholder="123456"
            />
            @if (resetInvalid('code')) {
              <span class="field-error">Enter the 6-digit code.</span>
            }
          </div>

          <div class="field">
            <label for="newPassword">New password</label>
            <div class="password-control">
              <input
                id="newPassword"
                [type]="passwordVisible() ? 'text' : 'password'"
                class="input password-input"
                formControlName="newPassword"
                [class.error]="resetInvalid('newPassword')"
                autocomplete="new-password"
                placeholder="At least 8 characters"
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
            @if (resetInvalid('newPassword')) {
              <span class="field-error">Use at least 8 characters.</span>
            }
          </div>

          <div class="field">
            <label for="confirm">Confirm password</label>
            <div class="password-control">
              <input
                id="confirm"
                [type]="confirmPasswordVisible() ? 'text' : 'password'"
                class="input password-input"
                formControlName="confirm"
                [class.error]="resetForm.hasError('mismatch') && resetForm.controls.confirm.touched"
                autocomplete="new-password"
                placeholder="Re-enter your password"
              />
              <button
                type="button"
                class="password-toggle"
                [attr.aria-label]="confirmPasswordVisible() ? 'Hide confirmation secret' : 'Show confirmation secret'"
                (click)="confirmPasswordVisible.set(!confirmPasswordVisible())"
              >
                <app-icon [name]="confirmPasswordVisible() ? 'eye-off' : 'eye'" [size]="18"></app-icon>
              </button>
            </div>
            @if (resetForm.hasError('mismatch') && resetForm.controls.confirm.touched) {
              <span class="field-error">Passwords do not match.</span>
            }
          </div>

          @if (statusMsg()) {
            <div class="form-success" role="status">{{ statusMsg() }}</div>
          }

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          <button
            type="submit"
            class="btn btn-primary btn-block btn-lg"
            [disabled]="loading()"
          >
            {{ loading() ? 'Resetting password...' : 'Reset password' }}
          </button>

          <button
            type="button"
            class="btn btn-outline btn-block resend"
            [disabled]="resending()"
            (click)="resendCode()"
          >
            {{ resending() ? 'Sending code...' : 'Resend code' }}
          </button>
        </form>
      }

      <p class="switch text-muted">
        Remembered your password? <a routerLink="/login">Sign in</a>
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
        margin: 8px 0 24px;
      }
      .code-input {
        letter-spacing: 0.22em;
        text-align: center;
        font-weight: 700;
      }
      .form-error,
      .form-success {
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
      }
      .form-error {
        background: var(--red-50);
        color: var(--red);
      }
      .form-success {
        background: #143525;
        color: var(--green);
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
      .resend {
        margin-top: 12px;
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
export class PasswordResetComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  resending = signal(false);
  resetMode = signal(false);
  statusMsg = signal('');
  errorMsg = signal('');
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  requestForm = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
  });

  resetForm = this.fb.nonNullable.group(
    {
      email: ['', [Validators.required, Validators.email]],
      code: [
        '',
        [
          Validators.required,
          Validators.minLength(6),
          Validators.maxLength(6),
          Validators.pattern(/^[0-9]{6}$/),
        ],
      ],
      newPassword: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email') ?? '';
    const resetPath = this.route.snapshot.routeConfig?.path === 'reset-password';
    const notice =
      this.router.getCurrentNavigation()?.extras.state?.['notice'] ??
      window.history.state?.['notice'];

    if (email) {
      this.requestForm.patchValue({ email });
      this.resetForm.patchValue({ email });
    }

    if (typeof notice === 'string' && notice) {
      this.statusMsg.set(notice);
    }

    this.resetMode.set(resetPath || !!email);
  }

  requestEmailInvalid(): boolean {
    const control = this.requestForm.controls.email;
    return control.invalid && (control.dirty || control.touched);
  }

  resetInvalid(controlName: 'email' | 'code' | 'newPassword'): boolean {
    const control = this.resetForm.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  requestCode(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    if (this.requestForm.invalid) {
      this.requestForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email } = this.requestForm.getRawValue();

    this.auth.requestPasswordReset(email).subscribe({
      next: (response) => {
        this.resetForm.patchValue({ email });
        const notice =
          response.message || 'If an account exists, a reset code has been sent.';
        this.statusMsg.set(notice);
        this.resetMode.set(true);
        this.router.navigate(['/reset-password'], {
          queryParams: { email },
          state: { notice },
        });
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

  resendCode(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    const emailControl = this.resetForm.controls.email;
    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this.resending.set(true);
    const { email } = this.resetForm.getRawValue();

    this.auth.resendPasswordReset(email).subscribe({
      next: (response) => {
        this.statusMsg.set(
          response.message || 'If an account exists, a new reset code has been sent.',
        );
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.resending.set(false);
      },
      complete: () => {
        this.resending.set(false);
      },
    });
  }

  resetPassword(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    if (this.resetForm.invalid) {
      this.resetForm.markAllAsTouched();
      return;
    }

    this.loading.set(true);
    const { email, code, newPassword } = this.resetForm.getRawValue();

    this.auth.resetPassword({ email, code, newPassword }).subscribe({
      next: () => {
        this.router.navigate(['/login'], {
          state: { notice: 'Your password has been reset. Please sign in.' },
        });
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
