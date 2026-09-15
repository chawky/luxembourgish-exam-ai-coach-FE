import { expect, type Page, type Request } from '@playwright/test';
import { apiSuccess, type CapturedRequest, routeApi } from './api.fixture';

export interface TestUser {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  password: string;
  roles: string[];
  emailVerified: boolean;
  adminDisabled: boolean;
  googleLinked: boolean;
  hasPassword: boolean;
}

export const authTokenStorageKey = 'sproochen.authToken';

export interface MockedProtectedRoute {
  authHeaders: string[];
  calls: CapturedRequest[];
}

export function testUser(overrides: Partial<TestUser> = {}): TestUser {
  const suffix = Math.random().toString(36).slice(2);
  const email = `playwright.${Date.now()}.${suffix}@example.com`;

  return {
    id: 42,
    username: 'Playwright Tester',
    email,
    firstName: 'Playwright',
    lastName: 'Tester',
    password: 'QaTest!2026Secure',
    roles: ['USER'],
    emailVerified: true,
    adminDisabled: false,
    googleLinked: false,
    hasPassword: true,
    ...overrides,
  };
}

export function responseUser(user: TestUser, jwt?: string): Record<string, unknown> {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    emailVerified: user.emailVerified,
    adminDisabled: user.adminDisabled,
    googleLinked: user.googleLinked,
    hasPassword: user.hasPassword,
    roles: user.roles,
    subscription: null,
    ...(jwt ? { jwt } : {}),
  };
}

export async function mockCurrentUser(
  page: Page,
  user: TestUser,
  options: {
    token?: string;
    requireAuth?: boolean;
  } = {},
): Promise<MockedProtectedRoute> {
  const authHeaders: string[] = [];
  const { token = 'playwright-jwt-token', requireAuth = false } = options;

  const calls = await routeApi(page, '**/api/users/me', {
    method: 'GET',
    response: apiSuccess(responseUser(user), 'User loaded'),
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

export async function seedAuthenticatedSession(
  page: Page,
  user: TestUser,
  token = 'playwright-jwt-token',
): Promise<MockedProtectedRoute> {
  return mockCurrentUser(page, user, { token, requireAuth: false });
}

export async function expectStoredToken(page: Page, token: string | null): Promise<void> {
  await expect
    .poll(() => page.evaluate((key) => localStorage.getItem(key), authTokenStorageKey))
    .toBe(token);
}
