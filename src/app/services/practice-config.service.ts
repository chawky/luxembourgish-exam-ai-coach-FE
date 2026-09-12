import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, shareReplay, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import type { components } from '../api/backend-schema';
import { ApiResponse } from '../models';
import {
  SelectOption,
  TopicOption,
  formatPracticeLabel,
} from '../practice-options';

type ExerciseConfigDto =
  components['schemas']['ExerciseConfigDto'];
type LevelOptionDto = components['schemas']['LevelOptionDto'];
type TopicOptionDto = components['schemas']['TopicOptionDto'];
type ExerciseTypeOptionDto =
  components['schemas']['ExerciseTypeOptionDto'];

export interface PracticeConfig {
  levels: SelectOption[];
  topics: TopicOption[];
  exerciseTypes: SelectOption[];
}

@Injectable({ providedIn: 'root' })
export class PracticeConfigService {
  private readonly url = apiUrl('/exercise-config');
  private readonly http = inject(HttpClient);
  private configRequest?: Observable<PracticeConfig>;

  getConfig(): Observable<PracticeConfig> {
    if (this.configRequest) {
      return this.configRequest;
    }

    this.configRequest = this.http.get<ApiResponse<ExerciseConfigDto | null>>(this.url).pipe(
      map((response) => this.unwrapConfig(response)),
      catchError((error) => {
        this.configRequest = undefined;
        return throwError(() =>
          this.toApiError(error, 'Could not load practice options.'),
        );
      }),
      shareReplay({ bufferSize: 1, refCount: false }),
    );

    return this.configRequest;
  }

  clearCache(): void {
    this.configRequest = undefined;
  }

  private unwrapConfig(
    response: ApiResponse<ExerciseConfigDto | null>,
  ): PracticeConfig {
    if (!response.success) {
      throw new Error(response.message || 'Could not load practice options.');
    }

    if (!response.data) {
      throw new Error('Practice options were not returned.');
    }

    const levels = (response.data.levels ?? [])
      .filter((level) => this.isEnabled(level))
      .map((level) => this.toLevelOption(level));
    const topics = (response.data.topics ?? [])
      .filter((topic) => this.isEnabled(topic))
      .map((topic) => this.toTopicOption(topic));
    const exerciseTypes = (response.data.exerciseTypes ?? [])
      .filter((type) => this.isEnabled(type))
      .map((type) => this.toExerciseTypeOption(type));

    return { levels, topics, exerciseTypes };
  }

  private toLevelOption(level: LevelOptionDto): SelectOption {
    const value = level.code ?? '';
    const description = level.description?.trim();

    return {
      value,
      label: description
        ? `${level.label || formatPracticeLabel(value)} - ${description}`
        : level.label || formatPracticeLabel(value),
    };
  }

  private toTopicOption(topic: TopicOptionDto): TopicOption {
    const value = topic.code ?? '';

    return {
      value,
      label: topic.label || formatPracticeLabel(value),
      level: topic.levelCode ?? '',
    };
  }

  private toExerciseTypeOption(
    type: ExerciseTypeOptionDto,
  ): SelectOption {
    const value = type.code ?? '';

    return {
      value,
      label: type.label || formatPracticeLabel(value),
    };
  }

  private isEnabled(option: { code?: string }): boolean {
    return !!option.code;
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
