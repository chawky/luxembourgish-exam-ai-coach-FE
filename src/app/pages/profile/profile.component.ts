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
import { ActivatedRoute, Router } from '@angular/router';
import { IconComponent } from '../../components/icon.component';
import { LocationSuggestion, User } from '../../models';
import { AuthService } from '../../services/auth.service';
import { LocationService } from '../../services/location.service';
import { PaymentService } from '../../services/payment.service';

type ProfileTab = 'account' | 'subscription';
type SubscriptionStatus = 'active' | 'canceled' | 'inactive';

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
            @if (activeTab() === 'account' && !editMode()) {
              <button type="button" class="btn btn-outline" (click)="startEdit()">
                Edit profile
              </button>
            }
          </div>

          <div class="profile-tabs" role="tablist" aria-label="Profile sections">
            <button
              type="button"
              class="profile-tab"
              role="tab"
              [class.active]="activeTab() === 'account'"
              [attr.aria-selected]="activeTab() === 'account'"
              (click)="showTab('account')"
            >
              Account
            </button>
            <button
              type="button"
              class="profile-tab"
              role="tab"
              [class.active]="activeTab() === 'subscription'"
              [attr.aria-selected]="activeTab() === 'subscription'"
              (click)="showTab('subscription')"
            >
              Subscription
            </button>
          </div>

          @if (activeTab() === 'account') {
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
            <section class="subscription-panel" aria-label="Subscription">
              @if (subscriptionSuccess()) {
                <div class="form-success" role="status">
                  {{ subscriptionSuccess() }}
                </div>
              }

              @if (subscriptionInfo()) {
                <div class="form-info" role="status">
                  {{ subscriptionInfo() }}
                </div>
              }

              @if (subscriptionError()) {
                <div class="form-error" role="alert">
                  {{ subscriptionError() }}
                </div>
              }

              <div class="subscription-hero">
                <div>
                  <span class="eyebrow">Subscription</span>
                  @if (subscriptionCancellationPending()) {
                    <h3>
                      {{
                        subscriptionCancellationLoading()
                          ? 'Cancelling subscription...'
                          : 'Cancellation requested'
                      }}
                    </h3>
                    <p class="text-muted">
                      We are checking your latest subscription status.
                    </p>
                  } @else if (hasCanceledSubscription()) {
                    <h3>Subscription canceled</h3>
                    @if (subscriptionPeriodEnd()) {
                      <p class="text-muted">
                        Your access remains available until
                        {{ subscriptionPeriodEnd() }}.
                      </p>
                    } @else {
                      <p class="text-muted">
                        Your subscription is no longer set to renew.
                      </p>
                    }
                  } @else if (hasActiveSubscription()) {
                    <h3>Your practice plan is active</h3>
                    <p class="text-muted">
                      You currently have access to guided speaking, listening,
                      vocabulary, and exam-style exercises.
                    </p>
                  } @else {
                    <h3>Unlock the full practice plan</h3>
                    <p class="text-muted">
                      Start your subscription to keep using guided practice for
                      speaking, listening, vocabulary, and exam-style exercises.
                    </p>
                  }
                </div>
                <span class="subscription-icon">
                  <app-icon name="shield" [size]="24"></app-icon>
                </span>
              </div>

              <ul class="subscription-features">
                @for (feature of subscriptionFeatures; track feature) {
                  <li>
                    <app-icon name="check" [size]="18"></app-icon>
                    <span>{{ feature }}</span>
                  </li>
                }
              </ul>

              @if (showSubscriptionDetails()) {
                <dl class="subscription-details" aria-label="Subscription details">
                  <div>
                    <dt>Status</dt>
                    <dd>
                      <span
                        class="subscription-status"
                        [class.active]="hasActiveSubscription()"
                        [class.canceled]="hasCanceledSubscription()"
                      >
                        {{ subscriptionStatusLabel() }}
                      </span>
                    </dd>
                  </div>

                  @if (subscriptionStartedAt()) {
                    <div>
                      <dt>Started</dt>
                      <dd>{{ subscriptionStartedAt() }}</dd>
                    </div>
                  }

                  @if (subscriptionPeriodEnd()) {
                    <div>
                      <dt>{{ subscriptionPeriodEndLabel() }}</dt>
                      <dd>{{ subscriptionPeriodEnd() }}</dd>
                    </div>
                  }
                </dl>
              }

              <div class="subscription-actions">
                @if (subscriptionCancellationPending()) {
                  <button
                    type="button"
                    class="btn btn-outline btn-lg subscription-cancel-button"
                    disabled
                  >
                    @if (subscriptionCancellationLoading()) {
                      <span class="inline-loading-icon">
                        <app-icon name="sparkles" [size]="16"></app-icon>
                      </span>
                    }
                    {{
                      subscriptionCancellationLoading()
                        ? 'Cancelling...'
                        : 'Cancellation requested'
                    }}
                  </button>
                  <p class="text-muted">
                    This may take a moment to update.
                  </p>
                } @else if (hasActiveSubscription()) {
                  <button
                    type="button"
                    class="btn btn-outline btn-lg subscription-cancel-button"
                    (click)="cancelSubscription()"
                    [disabled]="subscriptionBusy()"
                  >
                    @if (subscriptionCancellationLoading()) {
                      <span class="inline-loading-icon">
                        <app-icon name="sparkles" [size]="16"></app-icon>
                      </span>
                    }
                    {{
                      subscriptionCancellationLoading()
                        ? 'Cancelling...'
                        : 'Cancel subscription'
                    }}
                  </button>
                  <p class="text-muted">
                    Cancel here if you no longer want your subscription to renew.
                  </p>
                } @else if (canStartSubscription()) {
                  <button
                    type="button"
                    class="btn btn-primary btn-lg"
                    (click)="startSubscription()"
                    [disabled]="subscriptionBusy()"
                  >
                    @if (subscriptionLoading()) {
                      <span class="inline-loading-icon">
                        <app-icon name="sparkles" [size]="16"></app-icon>
                      </span>
                    }
                    {{ subscriptionLoading() ? 'Opening checkout...' : 'Start subscription' }}
                  </button>
                  <p class="text-muted">
                    Payment is completed on a secure checkout page. You will
                    return here afterwards.
                  </p>
                } @else {
                  <p class="text-muted">
                    Your subscription status is being updated.
                  </p>
                }
              </div>
            </section>
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
  private paymentService = inject(PaymentService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private locationSearchTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptionRefreshTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly subscriptionRefreshDelayMs = 1500;
  private readonly subscriptionRefreshMaxAttempts = 6;

  currentUser = computed(() => this.auth.currentUser());
  subscriptionStatus = computed(() => this.currentSubscriptionStatus());
  activeTab = signal<ProfileTab>('account');
  loading = signal(false);
  saving = signal(false);
  subscriptionLoading = signal(false);
  subscriptionCancellationLoading = signal(false);
  subscriptionCancellationPending = signal(false);
  subscriptionBusy = computed(
    () => this.subscriptionLoading() || this.subscriptionCancellationLoading(),
  );
  hasActiveSubscription = computed(
    () =>
      this.subscriptionStatus() === 'active' ||
      (this.currentUser()?.subscription?.subscribed === true &&
        this.subscriptionStatus() !== 'canceled'),
  );
  hasCanceledSubscription = computed(
    () => this.subscriptionStatus() === 'canceled',
  );
  showSubscriptionDetails = computed(
    () => this.hasActiveSubscription() || this.hasCanceledSubscription(),
  );
  subscriptionStatusLabel = computed(() =>
    this.toSubscriptionStatusLabel(
      this.currentUser()?.subscription?.status,
      this.subscriptionStatus(),
    ),
  );
  subscriptionStartedAt = computed(() =>
    this.formatSubscriptionDate(this.currentUser()?.subscription?.startedAt),
  );
  canStartSubscription = computed(
    () => this.currentUser()?.subscription?.subscribed !== true,
  );
  subscriptionPeriodEnd = computed(() =>
    this.formatSubscriptionDate(
      this.currentUser()?.subscription?.currentPeriodEnd,
    ),
  );
  subscriptionPeriodEndLabel = computed(() =>
    this.hasCanceledSubscription() ? 'Access until' : 'Current period ends',
  );
  editMode = signal(false);
  errorMsg = signal('');
  successMsg = signal('');
  subscriptionError = signal('');
  subscriptionInfo = signal('');
  subscriptionSuccess = signal('');
  locationQuery = signal('');
  locationLoading = signal(false);
  locationError = signal('');
  locationSuggestions = signal<LocationSuggestion[]>([]);
  readonly subscriptionFeatures = [
    'Unlimited speaking and listening practice',
    'AI-generated exam-style exercises',
    'Vocabulary support for exam topics',
  ];

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
    this.applyRouteState();
    this.patchForm(this.currentUser());
    this.loadProfile();
  }

  ngOnDestroy(): void {
    this.clearLocationSearchTimer();
    this.clearSubscriptionRefreshTimer();
  }

  startEdit(): void {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.patchForm(this.currentUser());
    this.editMode.set(true);
  }

  showTab(tab: ProfileTab): void {
    if (this.activeTab() === tab) {
      return;
    }

    if (tab === 'subscription' && this.editMode()) {
      this.cancelEdit();
    }

    this.errorMsg.set('');
    this.successMsg.set('');
    this.activeTab.set(tab);
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
    const passwordChanged = !!formValue.password;
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
          if (passwordChanged) {
            this.auth.logout().subscribe(() => {
              this.router.navigate(['/login'], {
                state: {
                  notice: 'Your password was changed. Please sign in again.',
                },
              });
            });
            return;
          }

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

  startSubscription(): void {
    if (!this.canStartSubscription()) {
      return;
    }

    this.clearSubscriptionRefreshTimer();
    this.subscriptionCancellationPending.set(false);
    this.subscriptionError.set('');
    this.subscriptionInfo.set('');
    this.subscriptionSuccess.set('');
    this.subscriptionLoading.set(true);

    this.paymentService.startSubscriptionCheckout().subscribe({
      next: (checkoutUrl) => {
        window.location.assign(checkoutUrl);
      },
      error: () => {
        this.subscriptionError.set(
          'Could not open checkout. Please try again or sign in again.',
        );
        this.subscriptionLoading.set(false);
      },
    });
  }

  cancelSubscription(): void {
    if (!this.hasActiveSubscription()) {
      return;
    }

    const confirmed = window.confirm(
      'Cancel your subscription? Your access may change after the current billing period.',
    );

    if (!confirmed) {
      return;
    }

    this.clearSubscriptionRefreshTimer();
    this.subscriptionError.set('');
    this.subscriptionInfo.set('');
    this.subscriptionSuccess.set('');
    this.subscriptionCancellationPending.set(true);
    this.subscriptionCancellationLoading.set(true);

    this.paymentService.cancelSubscription().subscribe({
      next: () => {
        this.scheduleSubscriptionRefresh(1);
      },
      error: () => {
        this.subscriptionCancellationPending.set(false);
        this.subscriptionError.set(
          'Could not cancel your subscription. Please try again or sign in again.',
        );
        this.subscriptionCancellationLoading.set(false);
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

  private applyRouteState(): void {
    const queryParams = this.route.snapshot.queryParamMap;

    if (queryParams.get('tab') === 'subscription') {
      this.activeTab.set('subscription');
    }

    const checkout = queryParams.get('checkout');
    if (checkout === 'success') {
      this.subscriptionSuccess.set(
        'Checkout completed. Your access may take a moment to update.',
      );
      this.subscriptionInfo.set('');
      this.subscriptionError.set('');
    } else if (checkout === 'cancel') {
      this.subscriptionInfo.set(
        'Checkout was cancelled. You can start again whenever you are ready.',
      );
      this.subscriptionSuccess.set('');
      this.subscriptionError.set('');
    }
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

  private scheduleSubscriptionRefresh(attempt: number): void {
    this.clearSubscriptionRefreshTimer();
    this.subscriptionRefreshTimer = setTimeout(() => {
      this.refreshSubscriptionAfterCancellation(attempt);
    }, this.subscriptionRefreshDelayMs);
  }

  private refreshSubscriptionAfterCancellation(attempt: number): void {
    this.auth.loadCurrentUser().subscribe({
      next: () => {
        if (
          this.hasCanceledSubscription() ||
          this.currentUser()?.subscription?.subscribed === false
        ) {
          this.subscriptionCancellationPending.set(false);
          this.subscriptionCancellationLoading.set(false);
          this.subscriptionInfo.set('');
          this.subscriptionSuccess.set('Subscription canceled.');
          return;
        }

        if (attempt < this.subscriptionRefreshMaxAttempts) {
          this.scheduleSubscriptionRefresh(attempt + 1);
          return;
        }

        this.subscriptionCancellationLoading.set(false);
        this.subscriptionInfo.set(
          'Cancellation is still processing. Check again in a moment.',
        );
      },
      error: () => {
        if (attempt < this.subscriptionRefreshMaxAttempts) {
          this.scheduleSubscriptionRefresh(attempt + 1);
          return;
        }

        this.subscriptionCancellationLoading.set(false);
        this.subscriptionInfo.set(
          'Cancellation was requested, but the latest status could not be loaded. Check again in a moment.',
        );
      },
    });
  }

  private clearSubscriptionRefreshTimer(): void {
    if (this.subscriptionRefreshTimer) {
      clearTimeout(this.subscriptionRefreshTimer);
      this.subscriptionRefreshTimer = null;
    }
  }

  private currentSubscriptionStatus(): SubscriptionStatus {
    const subscription = this.currentUser()?.subscription;
    const normalizedStatus = this.normalizeSubscriptionStatus(
      subscription?.status,
    );

    if (normalizedStatus === 'active' || normalizedStatus === 'canceled') {
      return normalizedStatus;
    }

    return subscription?.subscribed === true ? 'active' : 'inactive';
  }

  private normalizeSubscriptionStatus(
    status: string | undefined,
  ): SubscriptionStatus | null {
    const normalizedStatus = status?.trim().toLowerCase();

    if (normalizedStatus === 'active') {
      return 'active';
    }

    if (normalizedStatus === 'canceled' || normalizedStatus === 'cancelled') {
      return 'canceled';
    }

    return null;
  }

  private formatSubscriptionDate(value: string | undefined): string {
    if (!value) {
      return '';
    }

    const date = new Date(`${value}T00:00:00`);
    if (Number.isNaN(date.getTime())) {
      return '';
    }

    return new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(date);
  }

  private toSubscriptionStatusLabel(
    rawStatus: string | undefined,
    fallbackStatus: SubscriptionStatus,
  ): string {
    if (rawStatus?.trim()) {
      return this.toTitleCase(rawStatus);
    }

    if (fallbackStatus === 'active') {
      return 'Active';
    }

    if (fallbackStatus === 'canceled') {
      return 'Canceled';
    }

    return 'Inactive';
  }

  private toTitleCase(value: string): string {
    return value
      .trim()
      .replace(/[_-]+/g, ' ')
      .replace(/\s+/g, ' ')
      .toLowerCase()
      .replace(/\b\w/g, (letter) => letter.toUpperCase());
  }

  private errorMessage(error: unknown): string {
    return error instanceof Error && error.message
      ? error.message
      : 'Something went wrong.';
  }
}
