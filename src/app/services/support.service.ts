import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { catchError, map, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ApiResponse } from '../models';

export interface SupportRequest {
  email: string;
  subject: string;
  message: string;
  attachments: File[];
}

type SupportResponse = Partial<ApiResponse<unknown>> & {
  message?: string;
};

@Injectable({ providedIn: 'root' })
export class SupportService {
  private readonly http = inject(HttpClient);
  private readonly url = apiUrl('/support');

  send(request: SupportRequest) {
    const formData = new FormData();
    formData.append('email', request.email.trim());
    formData.append('subject', request.subject.trim());
    formData.append('message', request.message.trim());

    for (const file of request.attachments) {
      formData.append('attachments', file, file.name);
    }

    return this.http.post<SupportResponse>(this.url, formData).pipe(
      map((response) => {
        if (response.success === false) {
          throw new Error(response.message || 'Could not send your message.');
        }

        return response.message || 'Support request sent successfully.';
      }),
      catchError((error) =>
        throwError(() => this.toApiError(error, 'Could not send your message.')),
      ),
    );
  }

  private toApiError(error: unknown, fallbackMessage: string): Error {
    if (error instanceof HttpErrorResponse) {
      const message = this.getApiErrorMessage(error.error);

      if (message) {
        return new Error(message);
      }

      if (error.status === 429) {
        return new Error('Too many requests. Please wait a moment and try again.');
      }

      return new Error(error.status === 0 ? error.message : fallbackMessage);
    }

    return error instanceof Error ? error : new Error(fallbackMessage);
  }

  private getApiErrorMessage(errorBody: unknown): string | null {
    if (typeof errorBody === 'string') {
      const trimmedBody = errorBody.trim();
      const normalizedBody = trimmedBody.toLowerCase();

      if (
        !trimmedBody ||
        normalizedBody.startsWith('<!doctype html') ||
        normalizedBody.startsWith('<html')
      ) {
        return null;
      }

      try {
        return this.getApiErrorMessage(JSON.parse(trimmedBody));
      } catch {
        return trimmedBody;
      }
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
}
