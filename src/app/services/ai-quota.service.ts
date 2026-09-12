import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import type { components } from '../api/backend-schema';
import { ApiResponse } from '../models';

export type AiQuotaCategory = 'CHAT' | 'TTS' | 'STT' | 'IMAGE';
export type AiQuotaTier = 'BASIC' | 'PREMIUM' | string;
export type AiQuotaStatus = components['schemas']['AiQuotaStatusDto'];
export type AiQuotaCategoryStatus =
  components['schemas']['AiQuotaCategoryStatusDto'];

type AiQuotaResponse = components['schemas']['ApiResponseAiQuotaStatusDto'];

@Injectable({ providedIn: 'root' })
export class AiQuotaService {
  private readonly url = apiUrl('/users/me/ai-quota');
  private readonly http = inject(HttpClient);
  private quotaRequest?: Observable<AiQuotaStatus>;

  getMyQuota(refresh = false): Observable<AiQuotaStatus> {
    if (!refresh && this.quotaRequest) {
      return this.quotaRequest;
    }

    this.quotaRequest = this.http.get<AiQuotaResponse>(this.url).pipe(
      map((response) => this.unwrapQuota(response)),
      catchError((error) => {
        this.quotaRequest = undefined;
        return throwError(() => this.toApiError(error, 'Could not load AI quota.'));
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.quotaRequest;
  }

  clearCache(): void {
    this.quotaRequest = undefined;
  }

  category(
    quota: AiQuotaStatus | null,
    category: AiQuotaCategory,
  ): AiQuotaCategoryStatus | null {
    return (
      quota?.categories?.find(
        (item) => item.category?.toUpperCase() === category,
      ) ?? null
    );
  }

  isExhausted(quota: AiQuotaStatus | null, category: AiQuotaCategory): boolean {
    const categoryStatus = this.category(quota, category);
    return categoryStatus?.remaining !== undefined && categoryStatus.remaining <= 0;
  }

  blockedMessage(
    quota: AiQuotaStatus | null,
    category: AiQuotaCategory,
  ): string {
    const tier = quota?.tier?.toUpperCase();
    const categoryName = this.categoryLabel(category);

    if (tier === 'BASIC') {
      return `Daily ${categoryName} limit reached. Upgrade to continue.`;
    }

    if (tier === 'PREMIUM') {
      return `Monthly ${categoryName} limit reached.`;
    }

    return `${categoryName} limit reached.`;
  }

  private unwrapQuota(response: AiQuotaResponse): AiQuotaStatus {
    if (!response.success) {
      throw new Error(response.message || 'Could not load AI quota.');
    }

    if (!response.data) {
      throw new Error('AI quota was not returned.');
    }

    return response.data;
  }

  private categoryLabel(category: AiQuotaCategory): string {
    if (category === 'TTS') {
      return 'audio generation';
    }

    if (category === 'STT') {
      return 'recording evaluation';
    }

    if (category === 'IMAGE') {
      return 'image generation';
    }

    return 'AI practice';
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
