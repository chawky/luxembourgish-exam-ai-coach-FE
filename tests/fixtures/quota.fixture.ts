import { type Page, type Request } from '@playwright/test';
import { apiSuccess, routeApi } from './api.fixture';
import { type MockedProtectedRoute } from './auth.fixture';

export type QuotaFeature =
  | 'SPEAKING'
  | 'LISTENING'
  | 'IMAGE_DESCRIPTION'
  | 'VOCABULARY'
  | 'TOPIC_EXERCISE';

const quotaFeatures: QuotaFeature[] = [
  'SPEAKING',
  'LISTENING',
  'IMAGE_DESCRIPTION',
  'VOCABULARY',
  'TOPIC_EXERCISE',
];

export function quota(
  options: { exhausted?: QuotaFeature; tier?: 'BASIC' | 'PREMIUM' } = {},
): Record<string, unknown> {
  const tier = options.tier ?? 'BASIC';

  return {
    tier,
    features: quotaFeatures.map((feature) => {
      if (tier === 'PREMIUM') {
        return {
          feature,
          weeklyLimit: null,
          used: 0,
          remaining: null,
          windowStart: null,
          windowEnd: null,
        };
      }

      const exhausted = options.exhausted === feature;

      return {
        feature,
        window: 'WEEKLY',
        weeklyLimit: 15,
        used: exhausted ? 15 : 3,
        remaining: exhausted ? 0 : 12,
        windowStart: '2026-09-28T00:00:00Z',
        windowEnd: '2026-10-05T00:00:00Z',
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
    requireAuth = false,
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
