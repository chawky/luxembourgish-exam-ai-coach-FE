import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ApiResponse, ProgressDashboardDto } from '../models';

type ProgressDashboardResponse = ApiResponse<ProgressDashboardDto | null>;

@Injectable({ providedIn: 'root' })
export class DashboardService {
  private readonly url = apiUrl('/progress/me');
  private readonly http = inject(HttpClient);

  getMyProgress(): Observable<ProgressDashboardDto> {
    return this.http.get<ProgressDashboardResponse>(this.url).pipe(
      map((response) => this.unwrapDashboard(response)),
      catchError((error) =>
        throwError(() =>
          this.toApiError(error, 'Could not load dashboard progress.'),
        ),
      ),
    );
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
