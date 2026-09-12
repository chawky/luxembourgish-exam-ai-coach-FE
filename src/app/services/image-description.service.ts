import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, tap, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import {
  ApiResponse,
  GenerateExerciseRequest,
  GeneratedImageDto,
  SpeakingEvaluationDto,
} from '../models';
import { DashboardService } from './dashboard.service';

type GenerateImageResponse = ApiResponse<GeneratedImageDto | null>;
type ImageDescriptionEvaluationResponse =
  ApiResponse<SpeakingEvaluationDto | null>;

@Injectable({ providedIn: 'root' })
export class ImageDescriptionService {
  private readonly generateImageUrl =
    apiUrl('/exercises/generate-image');
  private readonly recordingUrl =
    apiUrl('/exercises/image-description/recording');
  private readonly http = inject(HttpClient);
  private readonly dashboard = inject(DashboardService);

  generateImage(request: GenerateExerciseRequest): Observable<GeneratedImageDto> {
    return this.http.post<GenerateImageResponse>(this.generateImageUrl, request).pipe(
      map((response) => this.unwrapImage(response)),
      catchError((error) =>
        throwError(() =>
          this.toApiError(error, 'Could not generate image practice.'),
        ),
      ),
    );
  }

  uploadRecording(
    audio: Blob,
    imageDescription: string,
    attemptId?: number,
    durationSeconds?: number,
  ): Observable<SpeakingEvaluationDto> {
    const formData = new FormData();
    formData.append('audio', this.toRecordingFile(audio));

    let params = new HttpParams().set('imageDescription', imageDescription);

    if (attemptId !== undefined) {
      params = params.set('attemptId', attemptId);
    }

    if (durationSeconds !== undefined) {
      params = params.set('durationSeconds', durationSeconds);
    }

    return this.http
      .post<ImageDescriptionEvaluationResponse>(this.recordingUrl, formData, {
        params,
      })
      .pipe(
        map((response) => this.unwrapEvaluation(response)),
        tap(() => {
          this.dashboard.clearCache();
        }),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not evaluate your description.'),
          ),
        ),
      );
  }

  private unwrapImage(response: GenerateImageResponse): GeneratedImageDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not generate image practice.');
    }

    if (!response.data?.image || !response.data.imageDescription) {
      throw new Error('The image task was incomplete. Please generate a new one.');
    }

    return response.data;
  }

  private unwrapEvaluation(
    response: ImageDescriptionEvaluationResponse,
  ): SpeakingEvaluationDto {
    if (!response.success) {
      throw new Error(response.message || 'Could not evaluate your description.');
    }

    if (!response.data) {
      throw new Error('The evaluation was not returned. Please try again.');
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
