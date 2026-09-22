import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, shareReplay, tap, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import type { components } from '../api/backend-schema';
import { ApiResponse } from '../models';
import { CacheRegistryService } from './cache-registry.service';
import { PracticeConfigService } from './practice-config.service';

export type AdminUser = components['schemas']['ResponseUserDto'];
export type AdminUserDetail = components['schemas']['AdminUserDetailDto'];
export type AdminUserProgress = components['schemas']['AdminUserProgressDto'];
export type AdminAiUsage = components['schemas']['AdminAiUsageDto'];
export type AdminAuditLog = components['schemas']['AdminAuditLogDto'];
export type AdminPrompt = components['schemas']['AdminPromptDto'];
export type AdminPromptCreateRequest =
  components['schemas']['AdminPromptCreateRequest'];
export type AdminPromptUpdateRequest =
  components['schemas']['AdminPromptUpdateRequest'];
export type AdminExerciseConfig =
  components['schemas']['AdminExerciseConfigDto'];
export type AdminLevelOption =
  components['schemas']['AdminLevelOptionDto'];
export type AdminTopicOption =
  components['schemas']['AdminTopicOptionDto'];
export type AdminExerciseTypeOption =
  components['schemas']['AdminExerciseTypeOptionDto'];
export type AdminLevelConfigRequest =
  components['schemas']['AdminLevelConfigRequest'];
export type AdminTopicConfigRequest =
  components['schemas']['AdminTopicConfigRequest'];
export type AdminExerciseTypeConfigRequest =
  components['schemas']['AdminExerciseTypeConfigRequest'];
export interface AdminSupportEmailList {
  id?: number;
  fromEmail?: string;
  subject?: string;
  receivedAt?: string;
  read?: boolean;
}
export interface AdminSupportEmailDetail extends AdminSupportEmailList {
  toEmail?: string;
  textBody?: string;
  htmlBody?: string;
}
export type PageResponse<T> = {
  items?: T[];
  page?: number;
  size?: number;
  totalItems?: number;
  totalPages?: number;
};

export interface AdminUserFilters {
  search?: string;
  subscribed?: boolean;
  adminDisabled?: boolean;
  page?: number;
  size?: number;
}

export interface AuditLogFilters {
  actorUserId?: number;
  targetUserId?: number;
  targetType?: string;
  targetId?: string;
  action?: string;
  page?: number;
  size?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminService {
  private readonly url = apiUrl('/admin');
  private readonly http = inject(HttpClient);
  private readonly cacheRegistry = inject(CacheRegistryService);
  private readonly practiceConfig = inject(PracticeConfigService);
  private readonly usersCache = new Map<string, Observable<PageResponse<AdminUser>>>();
  private readonly userDetailCache = new Map<number, Observable<AdminUserDetail>>();
  private readonly userProgressCache = new Map<string, Observable<PageResponse<AdminUserProgress>>>();
  private readonly userAiUsageCache = new Map<string, Observable<PageResponse<AdminAiUsage>>>();
  private promptsCache?: Observable<AdminPrompt[]>;
  private exerciseConfigCache?: Observable<AdminExerciseConfig>;

  constructor() {
    this.cacheRegistry.register(() => this.clearCache());
  }

  getUsers(filters: AdminUserFilters = {}): Observable<PageResponse<AdminUser>> {
    const cacheKey = this.cacheKey({ ...filters });
    const cachedUsers = this.usersCache.get(cacheKey);

    if (cachedUsers) {
      return cachedUsers;
    }

    const request = this.http
      .get<ApiResponse<PageResponse<AdminUser> | null>>(`${this.url}/users`, {
        params: this.toParams({ ...filters }),
      })
      .pipe(
        map((response) => this.unwrapPage(response, 'Could not load users.')),
        catchError((error) => {
          this.usersCache.delete(cacheKey);
          return throwError(() => this.toApiError(error, 'Could not load users.'));
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.usersCache.set(cacheKey, request);
    return request;
  }

  getUser(userId: number): Observable<AdminUserDetail> {
    const cachedUser = this.userDetailCache.get(userId);

    if (cachedUser) {
      return cachedUser;
    }

    const request = this.http
      .get<ApiResponse<AdminUserDetail | null>>(`${this.url}/users/${userId}`)
      .pipe(
        map((response) => this.unwrapData(response, 'Could not load user profile.')),
        catchError((error) => {
          this.userDetailCache.delete(userId);
          return throwError(() =>
            this.toApiError(error, 'Could not load user profile.'),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.userDetailCache.set(userId, request);
    return request;
  }

  updateUserStatus(
    userId: number,
    adminDisabled: boolean,
    reason?: string,
  ): Observable<AdminUserDetail> {
    return this.http
      .patch<ApiResponse<AdminUserDetail | null>>(
        `${this.url}/users/${userId}/status`,
        { adminDisabled, reason: reason?.trim() || undefined },
      )
      .pipe(
        map((response) => this.unwrapData(response, 'Could not update status.')),
        tap((detail) => {
          this.usersCache.clear();
          this.userDetailCache.set(userId, of(detail));
        }),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not update status.'),
          ),
        ),
      );
  }

  deleteUser(userId: number): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.url}/users/${userId}`)
      .pipe(
        map((response) => this.unwrapVoid(response, 'Could not delete account.')),
        tap(() => this.clearUserCaches(userId)),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not delete account.')),
        ),
      );
  }

  clearUserCache(): void {
    this.usersCache.clear();
    this.userDetailCache.clear();
    this.userProgressCache.clear();
    this.userAiUsageCache.clear();
  }

  clearCache(): void {
    this.clearUserCache();
    this.promptsCache = undefined;
    this.exerciseConfigCache = undefined;
  }

  getUserProgress(
    userId: number,
    page = 0,
    size = 8,
  ): Observable<PageResponse<AdminUserProgress>> {
    const cacheKey = this.cacheKey({ userId, page, size });
    const cachedProgress = this.userProgressCache.get(cacheKey);

    if (cachedProgress) {
      return cachedProgress;
    }

    const request = this.http
      .get<ApiResponse<PageResponse<AdminUserProgress> | null>>(
        `${this.url}/users/${userId}/progress`,
        { params: this.toParams({ page, size }) },
      )
      .pipe(
        map((response) =>
          this.unwrapPage(response, 'Could not load user progress.'),
        ),
        catchError((error) => {
          this.userProgressCache.delete(cacheKey);
          return throwError(() =>
            this.toApiError(error, 'Could not load user progress.'),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.userProgressCache.set(cacheKey, request);
    return request;
  }

  getUserAiUsage(
    userId: number,
    page = 0,
    size = 8,
  ): Observable<PageResponse<AdminAiUsage>> {
    const cacheKey = this.cacheKey({ userId, page, size });
    const cachedAiUsage = this.userAiUsageCache.get(cacheKey);

    if (cachedAiUsage) {
      return cachedAiUsage;
    }

    const request = this.http
      .get<ApiResponse<PageResponse<AdminAiUsage> | null>>(
        `${this.url}/users/${userId}/ai-usage`,
        { params: this.toParams({ page, size }) },
      )
      .pipe(
        map((response) =>
          this.unwrapPage(response, 'Could not load AI usage.'),
        ),
        catchError((error) => {
          this.userAiUsageCache.delete(cacheKey);
          return throwError(() =>
            this.toApiError(error, 'Could not load AI usage.'),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    this.userAiUsageCache.set(cacheKey, request);
    return request;
  }

  getPrompts(): Observable<AdminPrompt[]> {
    if (this.promptsCache) {
      return this.promptsCache;
    }

    this.promptsCache = this.http
      .get<ApiResponse<AdminPrompt[] | null>>(`${this.url}/prompts`)
      .pipe(
        map((response) => this.unwrapData(response, 'Could not load prompts.')),
        map((prompts) => prompts ?? []),
        catchError((error) => {
          this.promptsCache = undefined;
          return throwError(() => this.toApiError(error, 'Could not load prompts.'));
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.promptsCache;
  }

  createPrompt(request: AdminPromptCreateRequest): Observable<AdminPrompt> {
    return this.http
      .post<ApiResponse<AdminPrompt | null>>(`${this.url}/prompts`, request)
      .pipe(
        map((response) => this.unwrapData(response, 'Could not create prompt.')),
        tap(() => {
          this.promptsCache = undefined;
        }),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not create prompt.')),
        ),
      );
  }

  updatePrompt(
    key: string,
    request: AdminPromptUpdateRequest,
  ): Observable<AdminPrompt> {
    return this.http
      .put<ApiResponse<AdminPrompt | null>>(
        `${this.url}/prompts/${encodeURIComponent(key)}`,
        request,
      )
      .pipe(
        map((response) => this.unwrapData(response, 'Could not update prompt.')),
        tap(() => {
          this.promptsCache = undefined;
        }),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not update prompt.')),
        ),
      );
  }

  deletePrompt(key: string): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(`${this.url}/prompts/${encodeURIComponent(key)}`)
      .pipe(
        map((response) => this.unwrapVoid(response, 'Could not delete prompt.')),
        tap(() => {
          this.promptsCache = undefined;
        }),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not delete prompt.')),
        ),
      );
  }

  getExerciseConfig(): Observable<AdminExerciseConfig> {
    if (this.exerciseConfigCache) {
      return this.exerciseConfigCache;
    }

    this.exerciseConfigCache = this.http
      .get<ApiResponse<AdminExerciseConfig | null>>(`${this.url}/exercise-config`)
      .pipe(
        map((response) =>
          this.unwrapData(response, 'Could not load exercise config.'),
        ),
        catchError((error) => {
          this.exerciseConfigCache = undefined;
          return throwError(() =>
            this.toApiError(error, 'Could not load exercise config.'),
          );
        }),
        shareReplay({ bufferSize: 1, refCount: false }),
      );

    return this.exerciseConfigCache;
  }

  saveLevel(
    request: AdminLevelConfigRequest,
    existingCode?: string,
  ): Observable<AdminLevelOption> {
    const call = existingCode
      ? this.http.put<ApiResponse<AdminLevelOption | null>>(
          `${this.url}/exercise-config/levels/${encodeURIComponent(existingCode)}`,
          request,
        )
      : this.http.post<ApiResponse<AdminLevelOption | null>>(
          `${this.url}/exercise-config/levels`,
          request,
        );

    return call.pipe(
      map((response) => this.unwrapData(response, 'Could not save level.')),
      tap(() => {
        this.exerciseConfigCache = undefined;
        this.practiceConfig.clearCache();
      }),
      catchError((error) =>
        throwError(() => this.toApiError(error, 'Could not save level.')),
      ),
    );
  }

  saveTopic(
    request: AdminTopicConfigRequest,
    existingCode?: string,
  ): Observable<AdminTopicOption> {
    const call = existingCode
      ? this.http.put<ApiResponse<AdminTopicOption | null>>(
          `${this.url}/exercise-config/topics/${encodeURIComponent(existingCode)}`,
          request,
        )
      : this.http.post<ApiResponse<AdminTopicOption | null>>(
          `${this.url}/exercise-config/topics`,
          request,
        );

    return call.pipe(
      map((response) => this.unwrapData(response, 'Could not save topic.')),
      tap(() => {
        this.exerciseConfigCache = undefined;
        this.practiceConfig.clearCache();
      }),
      catchError((error) =>
        throwError(() => this.toApiError(error, 'Could not save topic.')),
      ),
    );
  }

  saveExerciseType(
    request: AdminExerciseTypeConfigRequest,
    existingCode?: string,
  ): Observable<AdminExerciseTypeOption> {
    const call = existingCode
      ? this.http.put<ApiResponse<AdminExerciseTypeOption | null>>(
          `${this.url}/exercise-config/types/${encodeURIComponent(existingCode)}`,
          request,
        )
      : this.http.post<ApiResponse<AdminExerciseTypeOption | null>>(
          `${this.url}/exercise-config/types`,
          request,
        );

    return call.pipe(
      map((response) => this.unwrapData(response, 'Could not save exercise type.')),
      tap(() => {
        this.exerciseConfigCache = undefined;
        this.practiceConfig.clearCache();
      }),
      catchError((error) =>
        throwError(() =>
          this.toApiError(error, 'Could not save exercise type.'),
        ),
      ),
    );
  }

  deleteConfigItem(
    kind: 'levels' | 'topics' | 'types',
    code: string,
  ): Observable<void> {
    return this.http
      .delete<ApiResponse<unknown>>(
        `${this.url}/exercise-config/${kind}/${encodeURIComponent(code)}`,
      )
      .pipe(
        map((response) =>
          this.unwrapVoid(response, 'Could not delete exercise config item.'),
        ),
        tap(() => {
          this.exerciseConfigCache = undefined;
          this.practiceConfig.clearCache();
        }),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not delete exercise config item.'),
          ),
        ),
      );
  }

  getAuditLogs(
    filters: AuditLogFilters = {},
  ): Observable<PageResponse<AdminAuditLog>> {
    return this.http
      .get<ApiResponse<PageResponse<AdminAuditLog> | null>>(
        `${this.url}/audit-logs`,
        { params: this.toParams({ ...filters }) },
      )
      .pipe(
        map((response) =>
          this.unwrapPage(response, 'Could not load audit logs.'),
        ),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not load audit logs.')),
        ),
      );
  }

  getSupportEmails(): Observable<AdminSupportEmailList[]> {
    return this.http
      .get<ApiResponse<AdminSupportEmailList[] | null>>(
        `${this.url}/support-emails`,
      )
      .pipe(
        map((response) =>
          this.unwrapData(response, 'Could not load support emails.'),
        ),
        map((emails) => emails ?? []),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not load support emails.'),
          ),
        ),
      );
  }

  getSupportEmail(id: number): Observable<AdminSupportEmailDetail> {
    return this.http
      .get<ApiResponse<AdminSupportEmailDetail | null>>(
        `${this.url}/support-emails/${id}`,
      )
      .pipe(
        map((response) =>
          this.unwrapData(response, 'Could not load support email.'),
        ),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not load support email.'),
          ),
        ),
      );
  }

  markSupportEmailRead(id: number): Observable<AdminSupportEmailDetail> {
    return this.http
      .patch<ApiResponse<AdminSupportEmailDetail | null>>(
        `${this.url}/support-emails/${id}/read`,
        {},
      )
      .pipe(
        map((response) =>
          this.unwrapData(response, 'Could not mark support email as read.'),
        ),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not mark support email as read.'),
          ),
        ),
      );
  }

  private unwrapData<T>(
    response: ApiResponse<T | null>,
    fallbackMessage: string,
  ): T {
    if (!response.success) {
      throw new Error(response.message || fallbackMessage);
    }

    if (!response.data) {
      throw new Error(fallbackMessage);
    }

    return response.data;
  }

  private unwrapPage<T>(
    response: ApiResponse<PageResponse<T> | null>,
    fallbackMessage: string,
  ): PageResponse<T> {
    return {
      items: [],
      page: 0,
      size: 0,
      totalItems: 0,
      totalPages: 0,
      ...this.unwrapData(response, fallbackMessage),
    };
  }

  private unwrapVoid(
    response: ApiResponse<unknown>,
    fallbackMessage: string,
  ): void {
    if (!response.success) {
      throw new Error(response.message || fallbackMessage);
    }
  }

  private toParams(values: Record<string, unknown>): HttpParams {
    let params = new HttpParams();

    Object.entries(values).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params = params.set(key, String(value));
      }
    });

    return params;
  }

  private cacheKey(values: Record<string, unknown>): string {
    return Object.entries(values)
      .filter(([, value]) => value !== undefined && value !== '')
      .sort(([left], [right]) => left.localeCompare(right))
      .map(([key, value]) => `${key}:${String(value)}`)
      .join('|');
  }

  private clearUserCaches(userId: number): void {
    this.usersCache.clear();
    this.userDetailCache.delete(userId);
    this.deleteMatchingKeys(this.userProgressCache, `userId:${userId}`);
    this.deleteMatchingKeys(this.userAiUsageCache, `userId:${userId}`);
  }

  private deleteMatchingKeys<T>(cache: Map<string, T>, value: string): void {
    [...cache.keys()]
      .filter((key) => key.includes(value))
      .forEach((key) => cache.delete(key));
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
