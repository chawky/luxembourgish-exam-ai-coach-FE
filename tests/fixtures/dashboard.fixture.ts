import { type Page, type Request } from '@playwright/test';
import { apiSuccess, routeApi } from './api.fixture';
import { type MockedProtectedRoute, type TestUser } from './auth.fixture';

export function progressDashboard(
  user: TestUser,
  overrides: Record<string, unknown> = {},
): Record<string, unknown> {
  return {
    userId: user.id,
    username: user.username,
    email: user.email,
    loggedInDays: 3,
    currentStreakDays: 2,
    lastLoginDate: '2026-09-05',
    totalActivities: 7,
    completedActivities: 5,
    evaluatedActivities: 4,
    averageRatingOverall: 4.25,
    skillProgress: [],
    ...overrides,
  };
}

export async function mockDashboardProgress(
  page: Page,
  user: TestUser,
  options: {
    token?: string;
    data?: Record<string, unknown>;
    requireAuth?: boolean;
  } = {},
): Promise<MockedProtectedRoute> {
  const authHeaders: string[] = [];
  const {
    token = 'playwright-jwt-token',
    data = progressDashboard(user),
    requireAuth = true,
  } = options;

  const calls = await routeApi(page, '**/api/progress/me', {
    method: 'GET',
    response: apiSuccess(data, 'Progress loaded'),
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
