import { Injectable, signal, computed, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import {
  catchError,
  firstValueFrom,
  map,
  MonoTypeOperatorFunction,
  of,
  tap,
  throwError,
} from 'rxjs';
import { ApiResponse, User } from '../models';
import type { components } from '../api/backend-schema';
import { displayName } from '../location-utils';

type RequestUserDto = components['schemas']['RequestUserDto'];
type ResponseUserDto = components['schemas']['ResponseUserDto'];

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
  private readonly url = 'http://localhost:8080/api/users';
  private readonly tokenStorageKey = 'sproochen.authToken';
  private readonly https = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);
  readonly isAdmin = computed(() =>
    (this.currentUser()?.roles ?? []).some((role) => role === 'ADMIN' || role === 'ROLE_ADMIN'),
  );

  initializeSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve();
    }

    return firstValueFrom(
      this.loadCurrentUser().pipe(
        map(() => undefined),
        catchError(() => {
          this.currentUser.set(null);
          this.clearToken();
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
          const token = user?.jwt;
          if (!token) {
            throw new Error(response.message || 'Login response did not include a token.');
          }

          this.saveToken(token);
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

  logout() {
    this.currentUser.set(null);
    this.clearToken();
    return of(null);
  }

  loadCurrentUser() {
    return this.https
      .get<ApiResponse<ResponseUserDto | null>>(this.url + '/me')
      .pipe(
        this.requireSuccess('Could not load current user.'),
        map((response) => {
          const user = response.data ? this.toCurrentUser(response.data) : null;
          this.currentUser.set(user);
          return user;
        }),
      );
  }

  updateProfile(data: UpdateProfileRequest) {
    const userId = data.id ?? this.currentUser()?.id;
    if (userId === undefined) {
      return throwError(
        () => new Error('Could not update profile. Please sign in again.'),
      );
    }

    const request = this.toUserRequest(data);

    return this.https
      .put<ApiResponse<ResponseUserDto | null>>(
        `${this.url}/${userId}`,
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

          if (updatedUser.jwt) {
            this.saveToken(updatedUser.jwt);
          }

          const user = this.toCurrentUser(updatedUser, request.email);
          this.currentUser.set(user);
          return user;
        }),
      );
  }

  private getToken(): string | null {
    return (
      localStorage.getItem(this.tokenStorageKey) ||
      sessionStorage.getItem(this.tokenStorageKey)
    );
  }

  private saveToken(token: string): void {
    localStorage.setItem(this.tokenStorageKey, this.normalizeToken(token));
    sessionStorage.removeItem(this.tokenStorageKey);
  }

  private clearToken(): void {
    localStorage.removeItem(this.tokenStorageKey);
    sessionStorage.removeItem(this.tokenStorageKey);
  }

  private normalizeToken(token: string): string {
    return token.replace(/^Bearer\s+/i, '').trim();
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
    if (!errorBody) {
      return null;
    }

    try {
      return this.getApiErrorMessage(JSON.parse(errorBody));
    } catch {
      return errorBody;
    }
  }
}
