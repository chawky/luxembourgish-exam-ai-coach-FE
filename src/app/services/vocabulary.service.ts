import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  ApiResponse,
  GenerateVocabularyRequest,
  VocabularyExerciseDto,
} from '../models';

type GenerateVocabularyResponse = ApiResponse<VocabularyExerciseDto | null>;

@Injectable({ providedIn: 'root' })
export class VocabularyService {
  private readonly url = 'http://localhost:8080/api/exercises/vocabulary';
  private readonly http = inject(HttpClient);

  generateVocabulary(
    request: GenerateVocabularyRequest,
  ): Observable<VocabularyExerciseDto> {
    return this.http.post<GenerateVocabularyResponse>(this.url, request).pipe(
      map((response) => this.unwrapVocabulary(response)),
      catchError((error) =>
        throwError(() =>
          this.toApiError(error, 'Could not generate vocabulary.'),
        ),
      ),
    );
  }

  private unwrapVocabulary(
    response: GenerateVocabularyResponse,
  ): VocabularyExerciseDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not generate vocabulary.');
    }

    if (!response.data) {
      throw new Error('Vocabulary response did not include exercise data.');
    }

    return {
      usefulSentences: response.data.usefulSentences ?? [],
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
