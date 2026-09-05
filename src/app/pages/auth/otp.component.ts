import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { LogoComponent } from '../../components/logo.component';
import { AuthLayoutComponent } from './auth-layout.component';

@Component({
  selector: 'app-otp',
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
      <a routerLink="/signup" class="back-link">&larr; Back to signup</a>
      <app-logo></app-logo>
      <h1 class="title">Verify your email</h1>
      <p class="text-muted subtitle">
        Enter the one-time password sent to your email address.
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
          <label for="otp">One-time password</label>
          <input
            id="otp"
            type="text"
            class="input otp-input"
            formControlName="otp"
            [class.error]="invalid('otp')"
            autocomplete="one-time-code"
            inputmode="numeric"
            maxlength="6"
            placeholder="123456"
          />
          @if (invalid('otp')) {
            <span class="field-error">Enter the 6-digit code.</span>
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
          [disabled]="verifying()"
        >
          {{ verifying() ? 'Verifying...' : 'Verify account' }}
        </button>

        <button
          type="button"
          class="btn btn-outline btn-block resend"
          [disabled]="sending()"
          (click)="resendOtp()"
        >
          {{ sending() ? 'Sending code...' : 'Resend code' }}
        </button>
      </form>

      <p class="switch text-muted">
        Already verified? <a routerLink="/login">Sign in</a>
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
      .otp-input {
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
export class OtpComponent implements OnInit {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  sending = signal(false);
  verifying = signal(false);
  statusMsg = signal('');
  errorMsg = signal('');

  form = this.fb.nonNullable.group({
    email: ['', [Validators.required, Validators.email]],
    otp: [
      '',
      [
        Validators.required,
        Validators.minLength(6),
        Validators.maxLength(6),
        Validators.pattern(/^[0-9]{6}$/),
      ],
    ],
  });

  ngOnInit(): void {
    const email = this.route.snapshot.queryParamMap.get('email');

    if (email) {
      this.form.patchValue({ email });
      this.sendOtp();
    }
  }

  invalid(name: string): boolean {
    const c = this.form.get(name);
    return !!c && c.invalid && (c.dirty || c.touched);
  }

  sendOtp(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    const emailControl = this.form.controls.email;
    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this.sending.set(true);
    const { email } = this.form.getRawValue();

    this.auth.sendOtp(email).subscribe({
      next: (response) => {
        this.statusMsg.set(
          response.message || 'We sent a verification code to your email.',
        );
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.sending.set(false);
      },
      complete: () => {
        this.sending.set(false);
      },
    });
  }

  resendOtp(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    const emailControl = this.form.controls.email;
    if (emailControl.invalid) {
      emailControl.markAsTouched();
      return;
    }

    this.sending.set(true);
    const { email } = this.form.getRawValue();

    this.auth.resendOtp(email).subscribe({
      next: (response) => {
        this.statusMsg.set(
          response.message || 'We resent a verification code to your email.',
        );
      },
      error: (error) => {
        this.errorMsg.set(this.errorMessage(error));
        this.sending.set(false);
      },
      complete: () => {
        this.sending.set(false);
      },
    });
  }

  submit(): void {
    this.statusMsg.set('');
    this.errorMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.verifying.set(true);
    const { email, otp } = this.form.getRawValue();

    this.auth.verifyOtp(email, Number(otp)).subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: (e) => {
        this.errorMsg.set(this.errorMessage(e));
        this.verifying.set(false);
      },
      complete: () => {
        this.verifying.set(false);
      },
    });
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
