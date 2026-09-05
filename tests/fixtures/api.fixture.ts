import { expect, type Page, type Request, type Route } from '@playwright/test';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T | null;
}

export interface CapturedRequest {
  method: string;
  url: string;
  headers: Record<string, string>;
  body?: unknown;
  errors: string[];
}

export function apiSuccess<T>(data: T | null, message = 'OK'): ApiResponse<T> {
  return {
    success: true,
    message,
    data,
  };
}

export function apiFailure<T = never>(
  message: string,
  data: T | null = null,
): ApiResponse<T> {
  return {
    success: false,
    message,
    data,
  };
}

export async function routeApi<T>(
  page: Page,
  url: string,
  options: {
    method?: string;
    response: ApiResponse<T>;
    status?: number;
    onRequest?: (request: Request) => void | Promise<void>;
  },
): Promise<CapturedRequest[]> {
  const calls: CapturedRequest[] = [];

  await page.route(url, async (route) => {
    const request = route.request();
    const errors: string[] = [];

    if (options.method && request.method() !== options.method) {
      errors.push(`Expected ${options.method}, got ${request.method()}`);
    }

    try {
      await options.onRequest?.(request);
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }

    calls.push({
      method: request.method(),
      url: request.url(),
      headers: request.headers(),
      body: requestBody(request),
      errors,
    });

    await fulfillJson(route, options.response, options.status);
  });

  return calls;
}

export async function fulfillJson<T>(
  route: Route,
  response: ApiResponse<T>,
  status = 200,
): Promise<void> {
  await route.fulfill({
    status,
    contentType: 'application/json',
    body: JSON.stringify(response),
  });
}

export function requestBody(request: Request): unknown {
  const postData = request.postData();

  if (!postData) {
    return undefined;
  }

  return request.postDataJSON();
}

export function expectBearerAuth(request: Request, token: string): void {
  expect(request.headers().authorization).toBe(`Bearer ${token}`);
}

export function expectNoRouteErrors(calls: CapturedRequest[]): void {
  expect(calls.flatMap((call) => call.errors)).toEqual([]);
}
