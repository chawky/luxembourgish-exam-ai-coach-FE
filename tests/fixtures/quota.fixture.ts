import { type Page, type Request } from '@playwright/test';
import { apiSuccess, routeApi } from './api.fixture';
import { type MockedProtectedRoute } from './auth.fixture';

export type QuotaCategory = 'CHAT' | 'TTS' | 'STT' | 'IMAGE';

const quotaCategories: QuotaCategory[] = ['CHAT', 'TTS', 'STT', 'IMAGE'];

export function quota(options: { exhausted?: QuotaCategory } = {}): Record<string, unknown> {
  return {
    tier: 'BASIC',
    categories: quotaCategories.map((category) => {
      const exhausted = options.exhausted === category;

      return {
        category,
        window: 'DAILY',
        used: exhausted ? 10 : 1,
        limit: 10,
        remaining: exhausted ? 0 : 9,
      };
    }),
  };
}

export async function mockQuota(
  page: Page,
  options: {
    token?: string;
    data?: Record<string, unknown>;
    requireAuth?: boolean;
  } = {},
): Promise<MockedProtectedRoute> {
  const authHeaders: string[] = [];
  const {
    token = 'playwright-jwt-token',
    data = quota(),
    requireAuth = true,
  } = options;

  const calls = await routeApi(page, '**/api/users/me/ai-quota', {
    method: 'GET',
    response: apiSuccess(data, 'Quota loaded'),
    onRequest: (request: Request) => {
      const authorization = request.headers().authorization ?? '';
      authHeaders.push(authorization);

      if (requireAuth) {
        if (authorization !== `Bearer ${token}`) {
          throw new Error(`Expected Authorization Bearer ${token}, got ${authorization}`);
        }
      }
    },
  });

  return { authHeaders, calls };
}
