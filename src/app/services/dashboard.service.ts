import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ApiResponse, ProgressDashboardDto } from '../models';

type ProgressDashboardResponse = ApiResponse<ProgressDashboardDto | null>;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = apiUrl('/progress/me');
  private readonly http = inject(HttpClient);
  private readonly progressCacheTtlMs = 10_000;
  private progressRequest?: Observable<ProgressDashboardDto>;
  private progressCachedAt = 0;

  getMyProgress(refresh = false): Observable<ProgressDashboardDto> {
    if (
      !refresh &&
      this.progressRequest &&
      Date.now() - this.progressCachedAt < this.progressCacheTtlMs
    ) {
      return this.progressRequest;
    }

    this.progressCachedAt = Date.now();
    this.progressRequest = this.http.get<ProgressDashboardResponse>(this.url).pipe(
      map((response) => this.unwrapDashboard(response)),
      catchError((error) => {
        this.clearCache();
        return throwError(() =>
          this.toApiError(error, 'Could not load dashboard progress.'),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.progressRequest;
  }

  clearCache(): void {
    this.progressRequest = undefined;
    this.progressCachedAt = 0;
  }

  private unwrapDashboard(
    response: ProgressDashboardResponse,
  ): ProgressDashboardDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not load dashboard progress.');
    }

    if (!response.data) {
      throw new Error('Dashboard response did not include progress data.');
    }

    return {
      ...response.data,
      skillProgress: response.data.skillProgress ?? [],
    };
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
