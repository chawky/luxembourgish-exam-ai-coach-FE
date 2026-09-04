import { HttpClient, HttpErrorResponse, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, of, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import type { components } from '../api/backend-schema';
import { ApiResponse, LocationSuggestion } from '../models';

type LocationSuggestionDto = components['schemas']['LocationSuggestionDto'];

@Injectable({ providedIn: 'root' })
export class LocationService {
  private readonly url = apiUrl('/users/locations');
  private readonly http = inject(HttpClient);

  searchLocations(query: string, limit = 8) {
    const trimmedQuery = query.trim();

    if (trimmedQuery.length < 2) {
      return of([]);
    }

    const params = new HttpParams()
      .set('query', trimmedQuery)
      .set('limit', limit);

    return this.http
      .get<ApiResponse<LocationSuggestionDto[] | null>>(this.url, { params })
      .pipe(
        map((response) => {
          if (!response.success) {
            throw new Error(response.message || 'Could not load locations.');
          }

          return (response.data ?? []).map((suggestion) =>
            this.toLocationSuggestion(suggestion),
          );
        }),
        catchError((error) =>
          throwError(() => this.toApiError(error, 'Could not load locations.')),
        ),
      );
  }

  private toLocationSuggestion(
    suggestion: LocationSuggestionDto,
  ): LocationSuggestion {
    return {
      id: suggestion.id,
      label: suggestion.label,
      layerName: suggestion.layerName,
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
      try {
        return this.getApiErrorMessage(JSON.parse(errorBody));
      } catch {
        return errorBody;
      }
    }

    if (!errorBody || typeof errorBody !== 'object') {
      return null;
    }

    const message = (errorBody as Partial<ApiResponse<unknown>>).message;
    return typeof message === 'string' && message ? message : null;
  }
}
