import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import {
  ApiResponse,
  GenerateExerciseRequest,
  SpeakingEvaluationDto,
  SpeakingPracticeDto,
} from '../models';

type GenerateSpeakingPracticeResponse = ApiResponse<SpeakingPracticeDto | null>;
type SpeakingEvaluationResponse = ApiResponse<SpeakingEvaluationDto | null>;

@Injectable({ providedIn: 'root' })
export class SpeakingService {
  private readonly practiceUrl = 'http://localhost:8080/api/exercises/practice';
  private readonly recordingUrl = 'http://localhost:8080/api/exercises/recording';
  private readonly http = inject(HttpClient);

  generatePractice(
    request: GenerateExerciseRequest,
  ): Observable<SpeakingPracticeDto> {
    return this.http
      .post<GenerateSpeakingPracticeResponse>(this.practiceUrl, request)
      .pipe(
        map((response) => this.unwrapPractice(response)),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not generate speaking practice.'),
          ),
        ),
      );
  }

  uploadRecording(
    audio: Blob,
    attemptId?: number,
    durationSeconds?: number,
  ): Observable<SpeakingEvaluationDto> {
    const formData = new FormData();
    formData.append('audio', this.toRecordingFile(audio));
    let params = new HttpParams();

    if (attemptId !== undefined) {
      params = params.set('attemptId', attemptId);
    }

    if (durationSeconds !== undefined) {
      params = params.set('durationSeconds', durationSeconds);
    }

    return this.http
      .post<SpeakingEvaluationResponse>(this.recordingUrl, formData, {
        params,
      })
      .pipe(
        map((response) => this.unwrapEvaluation(response)),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not evaluate recording.'),
          ),
        ),
      );
  }

  private unwrapPractice(
    response: GenerateSpeakingPracticeResponse,
  ): SpeakingPracticeDto {
    if (!response.success) {
      throw new Error(
        response.message || 'Could not generate speaking practice.',
      );
    }

    if (!response.data) {
      throw new Error('Speaking practice response did not include prompt data.');
    }

    return response.data;
  }

  private unwrapEvaluation(
    response: SpeakingEvaluationResponse,
  ): SpeakingEvaluationDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not evaluate recording.');
    }

    if (!response.data) {
      throw new Error('Recording response did not include evaluation data.');
    }

    return response.data;
  }

  private toRecordingFile(audio: Blob): File {
    if (audio instanceof File) {
      return audio;
    }

    return new File([audio], 'recording.webm', {
      type: audio.type || 'audio/webm',
    });
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
