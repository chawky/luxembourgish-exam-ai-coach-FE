import { CommonModule } from '@angular/common';
import { Component, OnDestroy, inject, signal } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  displayName,
  parseLocationSuggestion,
} from '../../location-utils';
import { LocationSuggestion } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { LogoComponent } from '../../components/logo.component';
import { AuthLayoutComponent } from './auth-layout.component';
import { IconComponent } from '../../components/icon.component';

function matchPasswords(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirm = group.get('confirm')?.value;
  return password && confirm && password !== confirm ? { mismatch: true } : null;
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
    IconComponent,
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
        <div class="form-grid">
          <div class="field">
            <label for="firstName">First name</label>
            <input
              id="firstName"
              type="text"
              class="input"
              formControlName="firstName"
              [class.error]="invalid('firstName')"
              autocomplete="given-name"
              placeholder="Jean"
            />
            @if (invalid('firstName')) {
              <span class="field-error">Please enter your first name.</span>
            }
          </div>

          <div class="field">
            <label for="lastName">Last name</label>
            <input
              id="lastName"
              type="text"
              class="input"
              formControlName="lastName"
              [class.error]="invalid('lastName')"
              autocomplete="family-name"
              placeholder="Weber"
            />
            @if (invalid('lastName')) {
              <span class="field-error">Please enter your last name.</span>
            }
          </div>
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

        <div class="address-section">
          <h2>Address in Luxembourg</h2>
          <p class="text-muted">
            Search for an address, street, or commune to fill the fields.
          </p>

          <div class="field">
            <label for="locationSearch">Find address</label>
            <input
              id="locationSearch"
              type="text"
              class="input"
              [value]="locationQuery()"
              (input)="onLocationInput($event)"
              (change)="applyLocationInput($event)"
              list="signup-location-options"
              autocomplete="off"
              placeholder="Start typing a Luxembourg address"
            />
            <datalist id="signup-location-options">
              @for (location of locationSuggestions(); track locationTrack(location, $index)) {
                <option [value]="location.label || ''">
                  {{ location.layerName }}
                </option>
              }
            </datalist>
            @if (locationLoading()) {
              <span class="field-help">Searching locations...</span>
            } @else if (locationError()) {
              <span class="field-error">{{ locationError() }}</span>
            } @else {
              <span class="field-help">
                Select a result to auto-fill address details.
              </span>
            }
          </div>

          <div class="form-grid">
            <div class="field small-field">
              <label for="streetNumber">No.</label>
              <input
                id="streetNumber"
                type="text"
                class="input"
                formControlName="streetNumber"
                autocomplete="address-line2"
                placeholder="23"
              />
            </div>

            <div class="field wide-field">
              <label for="street">Street</label>
              <input
                id="street"
                type="text"
                class="input"
                formControlName="street"
                autocomplete="address-line1"
                placeholder="Rue Emile Lux"
              />
            </div>
          </div>

          <div class="form-grid">
            <div class="field">
              <label for="postalCode">Postal code</label>
              <input
                id="postalCode"
                type="text"
                class="input"
                formControlName="postalCode"
                [class.error]="invalid('postalCode')"
                autocomplete="postal-code"
                placeholder="3738"
              />
              @if (invalid('postalCode')) {
                <span class="field-error">Use a 4-digit postal code.</span>
              }
            </div>

            <div class="field">
              <label for="city">City</label>
              <input
                id="city"
                type="text"
                class="input"
                formControlName="city"
                autocomplete="address-level2"
                placeholder="Rumelange"
              />
            </div>
          </div>

          <div class="field">
            <label for="addressInfo">Additional address info</label>
            <input
              id="addressInfo"
              type="text"
              class="input"
              formControlName="addressInfo"
              autocomplete="address-line3"
              placeholder="Apartment, floor, or building"
            />
          </div>
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
              autocomplete="new-password"
              placeholder="At least 8 characters"
            />
            <button
              type="button"
              class="password-toggle"
              [attr.aria-label]="passwordVisible() ? 'Hide password' : 'Show password'"
              (click)="passwordVisible.set(!passwordVisible())"
            >
              <app-icon [name]="passwordVisible() ? 'eye-off' : 'eye'" [size]="18"></app-icon>
            </button>
          </div>
          @if (invalid('password')) {
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
              [class.error]="form.hasError('mismatch') && form.get('confirm')?.touched"
              autocomplete="new-password"
              placeholder="Re-enter your password"
            />
            <button
              type="button"
              class="password-toggle"
              [attr.aria-label]="confirmPasswordVisible() ? 'Hide confirm password' : 'Show confirm password'"
              (click)="confirmPasswordVisible.set(!confirmPasswordVisible())"
            >
              <app-icon [name]="confirmPasswordVisible() ? 'eye-off' : 'eye'" [size]="18"></app-icon>
            </button>
          </div>
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
          {{ loading() ? 'Creating account...' : 'Create account' }}
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
      .form-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 0 12px;
      }
      .small-field {
        grid-column: span 1;
      }
      .wide-field {
        grid-column: span 1;
      }
      .address-section {
        padding-top: 18px;
        margin-top: 2px;
        border-top: 1px solid var(--border);
      }
      .address-section h2 {
        font-size: 20px;
      }
      .address-section p {
        margin: 4px 0 16px;
      }
      .field-help {
        color: var(--slate-500);
        font-size: 13px;
      }
      .form-error {
        background: var(--red-50);
        color: var(--red);
        border-radius: 8px;
        padding: 10px 12px;
        font-size: 14px;
        margin-bottom: 16px;
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
      .switch a {
        color: var(--blue-700);
        font-weight: 600;
      }
      @media (max-width: 640px) {
        .form-grid {
          grid-template-columns: 1fr;
        }
        .small-field,
        .wide-field {
          grid-column: auto;
        }
      }
    `,
  ],
})
export class SignupComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private locationService = inject(LocationService);
  private router = inject(Router);
  private locationSearchTimer: ReturnType<typeof setTimeout> | null = null;

  loading = signal(false);
  errorMsg = signal('');
  locationQuery = signal('');
  locationLoading = signal(false);
  locationError = signal('');
  locationSuggestions = signal<LocationSuggestion[]>([]);
  passwordVisible = signal(false);
  confirmPasswordVisible = signal(false);

  form = this.fb.nonNullable.group(
    {
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      streetNumber: [''],
      street: [''],
      postalCode: ['', [Validators.pattern(/^\d{4}$/)]],
      city: [''],
      addressInfo: [''],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirm: ['', [Validators.required]],
    },
    { validators: matchPasswords },
  );

  ngOnDestroy(): void {
    this.clearLocationSearchTimer();
  }

  invalid(
    controlName:
      | 'firstName'
      | 'lastName'
      | 'email'
      | 'postalCode'
      | 'password',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  submit(): void {
    this.errorMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading.set(true);

    const formValue = this.form.getRawValue();
    const user = {
      username: displayName(formValue),
      email: formValue.email,
      firstName: formValue.firstName,
      lastName: formValue.lastName,
      street: formValue.street,
      streetNumber: formValue.streetNumber,
      postalCode: formValue.postalCode,
      city: formValue.city,
      addressInfo: formValue.addressInfo,
      password: formValue.password,
    };

    this.auth.signup(user).subscribe({
      next: () => {
        this.router.navigate(['/otp'], {
          queryParams: { email: formValue.email },
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

  onLocationInput(event: Event): void {
    const query = this.inputValue(event);
    this.locationQuery.set(query);
    this.locationError.set('');
    this.clearLocationSearchTimer();

    if (query.trim().length < 2) {
      this.locationSuggestions.set([]);
      this.locationLoading.set(false);
      return;
    }

    this.locationLoading.set(true);
    this.locationSearchTimer = setTimeout(() => {
      this.locationService.searchLocations(query).subscribe({
        next: (locations) => {
          this.locationSuggestions.set(locations);
          this.locationLoading.set(false);
        },
        error: () => {
          this.locationSuggestions.set([]);
          this.locationLoading.set(false);
          this.locationError.set(
            'Could not load suggestions. You can type the address manually.',
          );
        },
      });
    }, 250);
  }

  applyLocationInput(event: Event): void {
    const selectedLabel = this.inputValue(event);
    const selectedLocation = this.locationSuggestions().find(
      (location) => location.label === selectedLabel,
    );

    if (selectedLocation) {
      this.applyLocation(selectedLocation);
    }
  }

  locationTrack(location: LocationSuggestion, index: number): string {
    return location.id || location.label || String(index);
  }

  private applyLocation(location: LocationSuggestion): void {
    const parsedLocation = parseLocationSuggestion(location);

    this.form.patchValue({
      streetNumber:
        parsedLocation.streetNumber ?? this.form.controls.streetNumber.value,
      street: parsedLocation.street ?? this.form.controls.street.value,
      postalCode:
        parsedLocation.postalCode ?? this.form.controls.postalCode.value,
      city: parsedLocation.city ?? this.form.controls.city.value,
    });
    this.locationQuery.set(location.label ?? '');
  }

  private inputValue(event: Event): string {
    return event.target instanceof HTMLInputElement ? event.target.value : '';
  }

  private clearLocationSearchTimer(): void {
    if (this.locationSearchTimer) {
      clearTimeout(this.locationSearchTimer);
      this.locationSearchTimer = null;
    }
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
