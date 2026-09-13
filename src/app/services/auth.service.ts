import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  finalize,
  firstValueFrom,
  map,
  MonoTypeOperatorFunction,
  Observable,
  of,
  shareReplay,
  tap,
  throwError,
} from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ApiResponse, User } from '../models';
import type { components } from '../api/backend-schema';
import { displayName } from '../location-utils';
import { CacheRegistryService } from './cache-registry.service';

type ResponseUserDto = components['schemas']['ResponseUserDto'];

interface RequestUserDto {
  username?: string;
  password?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  addressInfo?: string;
}

interface EmailRequest {
  email: string;
}

interface ResetPasswordRequest {
  email: string;
  code: string;
  newPassword: string;
}

interface ResetPasswordFormValue {
  email: string;
  code: string;
  newPassword: string;
}

interface UpdateProfileRequest {
  id?: number;
  username?: string;
  email: string;
  firstName?: string;
  lastName?: string;
  street?: string;
  streetNumber?: string;
  postalCode?: string;
  city?: string;
  addressInfo?: string;
  password?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly url = apiUrl('/users');
  private readonly https = inject(HttpClient);
  private readonly cacheRegistry = inject(CacheRegistryService);
  private currentUserRequest?: Observable<User | null>;

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() =>
    (this.currentUser()?.roles ?? []).some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN'),
  );

  initializeSession(): Promise<void> {
    return firstValueFrom(
      this.loadCurrentUser().pipe(
        map(() => undefined),
        catchError(() => {
          this.currentUser.set(null);
          this.clearUserScopedCaches();
          return of(undefined);
        }),
      ),
    );
  }

  login(email: string, password: string) {
    return this.https
      .post<ApiResponse<ResponseUserDto | null>>(this.url + '/login', {
        email,
        password,
      })
      .pipe(
        this.requireSuccess('Could not sign in.'),
        tap((response) => {
          const user = response.data;
          if (!user) {
            throw new Error('Login response did not include your account.');
          }

          this.currentUserRequest = undefined;
          this.clearUserScopedCaches();
          this.currentUser.set(this.toCurrentUser(user, email));
        }),
      );
  }

  signup(data: RequestUserDto) {
    return this.https
      .post<ApiResponse<ResponseUserDto | null>>(
        this.url + '/addUser',
        this.toUserRequest(data),
      )
      .pipe(this.requireSuccess('Could not create account.'));
  }

  sendOtp(email: string) {
    return this.https
      .post<ApiResponse<null>>(this.url + '/sendOtp', { email })
      .pipe(this.requireSuccess('Could not send verification code.'));
  }

  resendOtp(email: string) {
    return this.https
      .post<ApiResponse<null>>(this.url + '/resendOtp', { email })
      .pipe(this.requireSuccess('Could not resend verification code.'));
  }

  verifyOtp(email: string, otp: number) {
    return this.https
      .post<ApiResponse<null>>(this.url + '/verifyOtp', { email, otp })
      .pipe(this.requireSuccess('Could not verify code.'));
  }

  requestPasswordReset(email: string) {
    const request: EmailRequest = { email: email.trim() };

    return this.https
      .post<ApiResponse<null>>(this.url + '/forgot-password', request)
      .pipe(this.requireSuccess('Could not send reset code.'));
  }

  resendPasswordReset(email: string) {
    const request: EmailRequest = { email: email.trim() };

    return this.https
      .post<ApiResponse<null>>(this.url + '/resend-password-reset', request)
      .pipe(this.requireSuccess('Could not resend reset code.'));
  }

  resetPassword(request: ResetPasswordFormValue) {
    const body: ResetPasswordRequest = {
      email: request.email.trim(),
      code: request.code.trim(),
      newPassword: request.newPassword,
    };

    return this.https
      .post<ApiResponse<null>>(this.url + '/reset-password', body)
      .pipe(this.requireSuccess('Could not reset password.'));
  }

  logout() {
    this.currentUserRequest = undefined;
    this.clearUserScopedCaches();
    this.currentUser.set(null);

    return this.https.post<ApiResponse<null>>(this.url + '/logout', {}).pipe(
      map(() => null),
      catchError(() => of(null)),
    );
  }

  loadCurrentUser(forceRefresh = false) {
    if (!forceRefresh && this.currentUserRequest) {
      return this.currentUserRequest;
    }

    this.currentUserRequest = this.https
      .get<ApiResponse<ResponseUserDto | null>>(this.url + '/me')
      .pipe(
        this.requireSuccess('Could not load current user.'),
        map((response) => {
          const user = response.data ? this.toCurrentUser(response.data) : null;
          this.currentUser.set(user);
          return user;
        }),
        finalize(() => {
          this.currentUserRequest = undefined;
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.currentUserRequest;
  }

  updateProfile(data: UpdateProfileRequest) {
    const request = this.toUserRequest(data);

    return this.https
      .put<ApiResponse<ResponseUserDto | null>>(
        this.url + '/me',
        request,
      )
      .pipe(
        this.requireSuccess('Could not update profile.'),
        map((response) => {
          const updatedUser = response.data;
          if (!updatedUser) {
            throw new Error(
              response.message || 'Profile update did not return your account.',
            );
          }

          const user = this.toCurrentUser(updatedUser, request.email);
          this.currentUserRequest = undefined;
          this.currentUser.set(user);
          return user;
        }),
      );
  }

  private clearUserScopedCaches(): void {
    this.cacheRegistry.clearUserScopedCaches();
  }

  private toUserRequest(data: RequestUserDto): RequestUserDto {
    const request: RequestUserDto = {
      username:
        data.username?.trim() ||
        displayName({
          firstName: data.firstName,
          lastName: data.lastName,
          email: data.email,
        }),
      email: data.email?.trim(),
      firstName: data.firstName?.trim(),
      lastName: data.lastName?.trim(),
      street: data.street?.trim(),
      streetNumber: data.streetNumber?.trim(),
      postalCode: data.postalCode?.trim(),
      city: data.city?.trim(),
      addressInfo: data.addressInfo?.trim(),
    };

    if (data.password) {
      request.password = data.password;
    }

    return request;
  }

  private toCurrentUser(user: ResponseUserDto, fallbackEmail = user.email): User {
    const email = user.email || fallbackEmail || '';

    return {
      id: user.id,
      username: displayName(user) || email,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      street: user.street,
      streetNumber: user.streetNumber,
      postalCode: user.postalCode,
      city: user.city,
      addressInfo: user.addressInfo,
      emailVerified: user.emailVerified,
      adminDisabled: user.adminDisabled,
      roles: user.roles,
      subscription: user.subscription,
    };
  }

  private requireSuccess<T>(
    fallbackMessage: string,
  ): MonoTypeOperatorFunction<ApiResponse<T>> {
    return (source) =>
      source.pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || fallbackMessage);
          }

          return response;
        }),
        catchError((error) =>
          throwError(() => this.toApiError(error, fallbackMessage)),
        ),
      );
  }

  private toApiError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof HttpErrorResponse) {
      const message = this.getApiErrorMessage(error.error);
      return new Error(
        message || (error.status === 0 ? error.message : fallbackMessage),
      );
    }

    if (error instanceof Error) {
      return error;
    }

    return new Error(fallbackMessage);
  }

  private getApiErrorMessage(errorBody: unknown): string | null {
    if (typeof errorBody === 'string') {
      return this.getApiErrorMessageFromString(errorBody);
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const message = (errorBody as Partial<ApiResponse<unknown>>).message;
    if (typeof message === 'string' && message) {
      return message;
    }

    const error = (errorBody as { error?: unknown }).error;
    return typeof error === 'string' && error ? error : null;
  }

  private getApiErrorMessageFromString(errorBody: string): string | null {
    const trimmedBody = errorBody.trim();

    if (!trimmedBody) {
      return null;
    }

    const normalizedBody = trimmedBody.toLowerCase();
    if (
      normalizedBody.startsWith('<!doctype html') ||
      normalizedBody.startsWith('<html')
    ) {
      return null;
    }

    try {
      return this.getApiErrorMessage(JSON.parse(trimmedBody));
    } catch {
      return trimmedBody;
    }
  }
}
