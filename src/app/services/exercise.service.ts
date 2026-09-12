import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import {
  ApiResponse,
  GeneratedExerciseDto,
  GenerateExerciseRequest,
} from '../models';
import { DashboardService } from './dashboard.service';

type GenerateExerciseResponse = ApiResponse<GeneratedExerciseDto | null>;
type CompleteExerciseResponse = ApiResponse<unknown>;

@Injectable({ providedIn: 'root' })
export class ExerciseService {
  private readonly url = apiUrl('/exercises');
  private readonly http = inject(HttpClient);
  private readonly dashboard = inject(DashboardService);

  generateExercise(
    request: GenerateExerciseRequest,
  ): Observable<GeneratedExerciseDto> {
    return this.http
      .post<GenerateExerciseResponse>(`${this.url}/generate`, request)
      .pipe(
        map((response) => this.unwrapExercise(response)),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not generate exercise.')),
        ),
      );
  }

  completeAttempt(
    attemptId: number,
    learnerAnswer?: string,
  ): Observable<void> {
    return this.http
      .post<CompleteExerciseResponse>(
        apiUrl(`/progress/exercises/${attemptId}/complete`),
        learnerAnswer ? { learnerAnswer } : {},
      )
      .pipe(
        map((response) => this.unwrapCompletedAttempt(response)),
        tap(() => {
          this.dashboard.clearCache();
        }),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not save exercise progress.'),
          ),
        ),
      );
  }

  private unwrapExercise(response: GenerateExerciseResponse): GeneratedExerciseDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not generate exercise.');
    }

    if (!response.data) {
      throw new Error('Exercise response did not include exercise data.');
    }

    return response.data;
  }

  private unwrapCompletedAttempt(
    response: CompleteExerciseResponse,
  ): void {
    if (!response.success) {
      throw new Error(response.message || 'Could not save exercise progress.');
    }
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
