import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import type { components } from '../api/backend-schema';
import { ApiResponse } from '../models';
import { CacheRegistryService } from './cache-registry.service';

export type AiQuotaFeature =
  | 'SPEAKING'
  | 'LISTENING'
  | 'IMAGE_DESCRIPTION'
  | 'VOCABULARY'
  | 'TOPIC_EXERCISE';
export type AiQuotaTier = 'BASIC' | 'PREMIUM' | string;
export type AiQuotaStatus = components['schemas']['AiQuotaStatusDto'];
export type AiQuotaFeatureStatus =
  components['schemas']['AiQuotaFeatureStatusDto'];

type AiQuotaResponse = components['schemas']['ApiResponseAiQuotaStatusDto'];

@Injectable({ providedIn: 'root' })
export class AiQuotaService {
  private readonly url = apiUrl('/users/me/ai-quota');
  private readonly http = inject(HttpClient);
  private readonly cacheRegistry = inject(CacheRegistryService);
  private quotaRequest?: Observable<AiQuotaStatus>;

  constructor() {
    this.cacheRegistry.register(() => this.clearCache());
  }

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

  feature(
    quota: AiQuotaStatus | null,
    feature: AiQuotaFeature,
  ): AiQuotaFeatureStatus | null {
    return (
      quota?.features?.find(
        (item) => item.feature?.toUpperCase() === feature,
      ) ?? null
    );
  }

  isExhausted(quota: AiQuotaStatus | null, feature: AiQuotaFeature): boolean {
    if (quota?.tier?.toUpperCase() !== 'BASIC') {
      return false;
    }

    const featureStatus = this.feature(quota, feature);
    return typeof featureStatus?.remaining === 'number' && featureStatus.remaining <= 0;
  }

  blockedMessage(
    quota: AiQuotaStatus | null,
    feature: AiQuotaFeature,
  ): string {
    const status = this.feature(quota, feature);
    const featureName = this.featureLabel(feature);
    const limit = status?.weeklyLimit;
    const usage = typeof limit === 'number' ? `${limit} ` : '';
    const reset = this.resetLabel(status?.windowEnd);

    if (quota?.tier?.toUpperCase() === 'BASIC') {
      return `You've used your ${usage}${featureName} exercises for this week. ${reset}`;
    }

    return `${featureName} practice is currently unavailable.`;
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

  private featureLabel(feature: AiQuotaFeature): string {
    if (feature === 'TOPIC_EXERCISE') {
      return 'topic';
    }

    return feature
      .toLowerCase()
      .split('_')
      .map((part) => part[0].toUpperCase() + part.slice(1))
      .join(' ');
  }

  private resetLabel(windowEnd: string | null | undefined): string {
    if (!windowEnd) {
      return 'Your weekly allowance will reset automatically.';
    }

    const date = new Date(windowEnd);
    if (Number.isNaN(date.getTime())) {
      return 'Your weekly allowance will reset automatically.';
    }

    return `Your allowance resets on ${new Intl.DateTimeFormat(undefined, {
      dateStyle: 'medium',
    }).format(date)}.`;
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
