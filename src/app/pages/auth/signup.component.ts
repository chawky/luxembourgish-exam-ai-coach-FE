import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../components/logo.component';
import { AuthLayoutComponent } from './auth-layout.component';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const pw = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return pw && confirm && pw !== confirm ? { mismatch: true } : null;
}

@Component({
  selector: 'app-signup',
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
      <h1 class="title">Create your account</h1>
      <p class="text-muted subtitle">
        Start your free Sproochentest preparation today.
      </p>

      <form [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="field">
          <label for="username">Full name</label>
          <input
            id="username"
            type="text"
            class="input"
            formControlName="username"
            [class.error]="invalid('username')"
            autocomplete="username"
            placeholder="Jean Weber"
          />
          @if (invalid('username')) {
            <span class="field-error">Please enter your name.</span>
          }
        </div>

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
            autocomplete="new-password"
            placeholder="At least 8 characters"
          />
          @if (invalid('password')) {
            <span class="field-error">Use at least 8 characters.</span>
          }
        </div>

        <div class="field">
          <label for="confirm">Confirm password</label>
          <input
            id="confirm"
            type="password"
            class="input"
            formControlName="confirm"
            [class.error]="form.hasError('mismatch') && form.get('confirm')?.touched"
            autocomplete="new-password"
            placeholder="Re-enter your password"
          />
          @if (form.hasError('mismatch') && form.get('confirm')?.touched) {
            <span class="field-error">Passwords do not match.</span>
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
          {{ loading() ? 'Creating account…' : 'Create account' }}
        </button>
      </form>

      <p class="switch text-muted">
        Already have an account? <a routerLink="/login">Sign in</a>
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
export class SignupComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);

  loading = signal(false);
  errorMsg = signal('');

  form = this.fb.nonNullable.group(
    {
      username: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(2)]],
      confirm: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  invalid(username: string): boolean {
    const c = this.form.get(username);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  submit(): void {
    this.errorMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const user = this.form.getRawValue();

    this.auth.signup(user).subscribe({
      next: () => {
        this.router.navigate(['/otp'], { queryParams: { email: user.email } });
      },
      error: (e) => {
        this.errorMsg.set(this.errorMessage(e));
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
