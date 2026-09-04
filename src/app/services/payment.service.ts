import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, throwError } from 'rxjs';
import { apiUrl } from '../api/api-url';
import { ApiResponse } from '../models';
import type { components } from '../api/backend-schema';

type CheckoutSessionResponse =
  components['schemas']['ApiResponseStripeSessionURLDto'];

@Injectable({ providedIn: 'root' })
export class PaymentService {
  private readonly url = apiUrl('/payments');
  private readonly http = inject(HttpClient);

  startSubscriptionCheckout(): Observable<string> {
    return this.http
      .post<CheckoutSessionResponse>(`${this.url}/checkout`, null)
      .pipe(
        map((response) => this.unwrapCheckoutUrl(response)),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not start subscription checkout.'),
          ),
        ),
      );
  }

  cancelSubscription(): Observable<void> {
    return this.http
      .post<void>(`${this.url}/subscription/cancel`, null)
      .pipe(
        map(() => undefined),
        catchError((error) =>
          throwError(() =>
            this.toApiError(error, 'Could not cancel subscription.'),
          ),
        ),
      );
  }

  private unwrapCheckoutUrl(response: CheckoutSessionResponse): string {
    if (!response.success) {
      throw new Error(
        response.message || 'Could not start subscription checkout.',
      );
    }

    const checkoutUrl = response.data?.stripeSessionUrl?.trim();
    if (!checkoutUrl) {
      throw new Error('Checkout response did not include a payment link.');
    }

    return checkoutUrl;
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
