import { Injectable, signal, computed, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpHeaders,
} from '@angular/common/http';
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

interface ResponseUserDto {
  id?: number;
  username?: string;
  email?: string;
  jwt?: string;
  roles?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly url = 'http://localhost:8080/api/users';
  private readonly tokenStorageKey = 'sproochen.authToken';
  private readonly https = inject(HttpClient);

  readonly currentUser = signal<User | null>(null);
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  initializeSession(): Promise<void> {
    const token = this.getToken();
    if (!token) {
      return Promise.resolve();
    }

    return firstValueFrom(
      this.fetchCurrentUser(token).pipe(
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

  signup(data: User) {
    console.log(data);
    //console.log(this.https.post(this.url+'/addUser', data));
    return this.https
      .post<ApiResponse<User | null>>(this.url + '/addUser', data)
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

  private fetchCurrentUser(token: string) {
    return this.https
      .get<ApiResponse<ResponseUserDto | null>>(
        this.url + '/me',
        this.getAuthOptions(token),
      )
      .pipe(
        this.requireSuccess('Could not load current user.'),
        tap((response) => {
          this.currentUser.set(
            response.data ? this.toCurrentUser(response.data) : null,
          );
        }),
      );
  }

  private getAuthOptions(token: string) {
    return {
      headers: new HttpHeaders({
        Authorization: `Bearer ${this.normalizeToken(token)}`,
      }),
    };
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

  private toCurrentUser(user: ResponseUserDto, fallbackEmail = user.email): User {
    const email = user.email || fallbackEmail || '';

    return {
      username: user.username || email,
      email,
      password: '',
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
