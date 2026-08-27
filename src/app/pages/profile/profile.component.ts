import { CommonModule } from '@angular/common';
import {
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import {
  displayName,
  formatAddress,
  parseLocationSuggestion,
} from '../../location-utils';
import { IconComponent } from '../../components/icon.component';
import { LocationSuggestion, User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';

function profilePasswordValidator(
  group: AbstractControl,
): ValidationErrors | null {
  const password = group.get('password')?.value;
  const confirmPassword = group.get('confirmPassword')?.value;

  if (!password && !confirmPassword) {
    return null;
  }

  if (!password) {
    return { passwordRequired: true };
  }

  if (!confirmPassword) {
    return { confirmPasswordRequired: true };
  }

  return password === confirmPassword ? null : { passwordMismatch: true };
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, IconComponent],
  template: `
    <header class="page-head">
      <div>
        <span class="eyebrow">Profile</span>
        <h1>Your account</h1>
        <p class="text-muted">
          Review your account details and update them when needed.
        </p>
      </div>
    </header>

    <section class="card card-pad profile-card">
      @if (loading()) {
        <div class="loading-panel">
          <span class="profile-icon loading-icon">
            <app-icon name="sparkles" [size]="20"></app-icon>
          </span>
          <div>
            <strong>Loading your profile...</strong>
            <p class="text-muted">Getting your latest account details.</p>
          </div>
        </div>
      } @else {
        @if (currentUser(); as user) {
          <div class="profile-head">
            <span class="profile-avatar">{{ initials(user) }}</span>
            <div class="profile-title">
              <h2>{{ displayUserName(user) }}</h2>
              <p class="text-muted">{{ user.email }}</p>
            </div>
            @if (!editMode()) {
              <button type="button" class="btn btn-outline" (click)="startEdit()">
                Edit profile
              </button>
            }
          </div>

          @if (errorMsg()) {
            <div class="form-error" role="alert">{{ errorMsg() }}</div>
          }

          @if (successMsg()) {
            <div class="form-success" role="status">{{ successMsg() }}</div>
          }

          @if (!editMode()) {
            <dl class="profile-details">
              <div>
                <dt>First name</dt>
                <dd>{{ user.firstName || 'Not added yet' }}</dd>
              </div>
              <div>
                <dt>Last name</dt>
                <dd>{{ user.lastName || 'Not added yet' }}</dd>
              </div>
              <div>
                <dt>Email</dt>
                <dd>{{ user.email }}</dd>
              </div>
              <div>
                <dt>Address</dt>
                <dd>{{ addressText(user) || 'Not added yet' }}</dd>
              </div>
            </dl>
          } @else {
            <form [formGroup]="form" (ngSubmit)="save()" novalidate>
              <div class="form-grid">
                <div class="field">
                  <label for="profile-first-name">First name</label>
                  <input
                    id="profile-first-name"
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
                  <label for="profile-last-name">Last name</label>
                  <input
                    id="profile-last-name"
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

                <div class="field span-2">
                  <label for="profile-email">Email</label>
                  <input
                    id="profile-email"
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
              </div>

              <div class="address-section">
                <h3>Address in Luxembourg</h3>
                <p class="text-muted">
                  Search for an address, street, or commune to fill the fields.
                </p>

                <div class="field">
                  <label for="profile-location-search">Find address</label>
                  <input
                    id="profile-location-search"
                    type="text"
                    class="input"
                    [value]="locationQuery()"
                    (input)="onLocationInput($event)"
                    (change)="applyLocationInput($event)"
                    list="profile-location-options"
                    autocomplete="off"
                    placeholder="Start typing a Luxembourg address"
                  />
                  <datalist id="profile-location-options">
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
                    <label for="profile-street-number">No.</label>
                    <input
                      id="profile-street-number"
                      type="text"
                      class="input"
                      formControlName="streetNumber"
                      autocomplete="address-line2"
                      placeholder="23"
                    />
                  </div>

                  <div class="field wide-field">
                    <label for="profile-street">Street</label>
                    <input
                      id="profile-street"
                      type="text"
                      class="input"
                      formControlName="street"
                      autocomplete="address-line1"
                      placeholder="Rue Emile Lux"
                    />
                  </div>

                  <div class="field">
                    <label for="profile-postal-code">Postal code</label>
                    <input
                      id="profile-postal-code"
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
                    <label for="profile-city">City</label>
                    <input
                      id="profile-city"
                      type="text"
                      class="input"
                      formControlName="city"
                      autocomplete="address-level2"
                      placeholder="Rumelange"
                    />
                  </div>

                  <div class="field span-2">
                    <label for="profile-address-info">Additional address info</label>
                    <input
                      id="profile-address-info"
                      type="text"
                      class="input"
                      formControlName="addressInfo"
                      autocomplete="address-line3"
                      placeholder="Apartment, floor, or building"
                    />
                  </div>
                </div>
              </div>

              <div class="password-section">
                <h3>Change password</h3>
                <p class="text-muted">
                  Leave these fields empty to keep your current password.
                </p>

                <div class="form-grid">
                  <div class="field">
                    <label for="profile-password">New password</label>
                    <input
                      id="profile-password"
                      type="password"
                      class="input"
                      formControlName="password"
                      [class.error]="passwordInvalid()"
                      autocomplete="new-password"
                      placeholder="At least 8 characters"
                    />
                    @if (passwordInvalid()) {
                      <span class="field-error">Use at least 8 characters.</span>
                    }
                  </div>

                  <div class="field">
                    <label for="profile-confirm-password">Confirm new password</label>
                    <input
                      id="profile-confirm-password"
                      type="password"
                      class="input"
                      formControlName="confirmPassword"
                      [class.error]="confirmPasswordInvalid()"
                      autocomplete="new-password"
                      placeholder="Re-enter the new password"
                    />
                    @if (form.hasError('confirmPasswordRequired') && confirmPasswordTouched()) {
                      <span class="field-error">Confirm the new password.</span>
                    } @else if (form.hasError('passwordMismatch') && confirmPasswordTouched()) {
                      <span class="field-error">Passwords do not match.</span>
                    }
                  </div>
                </div>
              </div>

              <div class="actions">
                <button
                  type="submit"
                  class="btn btn-primary"
                  [disabled]="saving()"
                >
                  {{ saving() ? 'Saving...' : 'Save changes' }}
                </button>
                <button
                  type="button"
                  class="btn btn-ghost"
                  (click)="cancelEdit()"
                  [disabled]="saving()"
                >
                  Cancel
                </button>
              </div>
            </form>
          }
        } @else {
          <div class="empty-state">
            <span class="profile-icon">
              <app-icon name="info" [size]="20"></app-icon>
            </span>
            <h2>Profile unavailable</h2>
            <p class="text-muted">Sign in again to view your account details.</p>
          </div>
        }
      }
    </section>
  `,
  styleUrl: './profile.component.css',
})
export class ProfileComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private locationService = inject(LocationService);
  private locationSearchTimer: ReturnType<typeof setTimeout> | null = null;

  currentUser = computed(() => this.auth.currentUser());
  loading = signal(false);
  saving = signal(false);
  editMode = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  locationQuery = signal('');
  locationLoading = signal(false);
  locationError = signal('');
  locationSuggestions = signal<LocationSuggestion[]>([]);

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
      password: ['', [Validators.minLength(8)]],
      confirmPassword: [''],
    },
    { validators: profilePasswordValidator },
  );

  ngOnInit(): void {
    this.patchForm(this.currentUser());
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearLocationSearchTimer();
  }

  startEdit(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.patchForm(this.currentUser());
    this.editMode.set(true);
  }

  cancelEdit(): void {
    this.patchForm(this.currentUser());
    this.errorMsg.set('');
    this.locationError.set('');
    this.editMode.set(false);
  }

  save(): void {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.saving.set(true);
    const formValue = this.form.getRawValue();
    this.auth
      .updateProfile({
        id: this.currentUser()?.id,
        username: displayName(formValue),
        email: formValue.email,
        firstName: formValue.firstName,
        lastName: formValue.lastName,
        street: formValue.street,
        streetNumber: formValue.streetNumber,
        postalCode: formValue.postalCode,
        city: formValue.city,
        addressInfo: formValue.addressInfo,
        ...(formValue.password ? { password: formValue.password } : {}),
      })
      .subscribe({
        next: (user) => {
          this.patchForm(user);
          this.editMode.set(false);
          this.successMsg.set('Profile updated.');
        },
        error: (error) => {
          this.errorMsg.set(this.errorMessage(error));
          this.saving.set(false);
        },
        complete: () => {
          this.saving.set(false);
        },
      });
  }

  invalid(
    controlName: 'firstName' | 'lastName' | 'email' | 'postalCode',
  ): boolean {
    const control = this.form.controls[controlName];
    return control.invalid && (control.dirty || control.touched);
  }

  passwordInvalid(): boolean {
    const control = this.form.controls.password;
    return (
      (control.invalid && (control.dirty || control.touched)) ||
      (this.form.hasError('passwordRequired') &&
        this.form.controls.confirmPassword.touched)
    );
  }

  confirmPasswordInvalid(): boolean {
    return (
      this.confirmPasswordTouched() &&
      (this.form.hasError('confirmPasswordRequired') ||
        this.form.hasError('passwordMismatch'))
    );
  }

  confirmPasswordTouched(): boolean {
    const control = this.form.controls.confirmPassword;
    return control.dirty || control.touched;
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

  initials(user: User): string {
    return this.displayUserName(user)
      .split(' ')
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join('')
      .toUpperCase();
  }

  displayUserName(user: User): string {
    return displayName(user);
  }

  addressText(user: User): string {
    return formatAddress(user);
  }

  private loadProfile(): void {
    this.loading.set(true);
    this.auth.loadCurrentUser().subscribe({
      next: (user) => {
        this.patchForm(user);
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

  private patchForm(user: User | null): void {
    if (!user) {
      return;
    }

    this.form.reset({
      firstName: user.firstName ?? '',
      lastName: user.lastName ?? '',
      email: user.email,
      streetNumber: user.streetNumber ?? '',
      street: user.street ?? '',
      postalCode: user.postalCode ?? '',
      city: user.city ?? '',
      addressInfo: user.addressInfo ?? '',
      password: '',
      confirmPassword: '',
    });
    this.locationQuery.set('');
    this.locationSuggestions.set([]);
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
