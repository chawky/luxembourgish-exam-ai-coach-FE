import { test, expect } from '@playwright/test';
import { apiSuccess, expectNoRouteErrors, routeApi } from './fixtures/api.fixture';
import {
  authTokenStorageKey,
  expectStoredToken,
  mockCurrentUser,
  seedAuthenticatedSession,
  testUser,
} from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockQuota } from './fixtures/quota.fixture';

test('logged-out user is redirected from dashboard to login', async ({ page }) => {
  await page.goto('/app/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  await expect(page.getByRole('heading', { name: 'Welcome back' })).toBeVisible();
});

test('learner cannot open the admin route', async ({ page }) => {
  const learner = testUser({ roles: ['USER'] });
  const jwt = 'learner-route-guard-jwt';

  const currentUser = await seedAuthenticatedSession(page, learner, jwt);
  const progress = await mockDashboardProgress(page, learner, { token: jwt });
  const quotaStatus = await mockQuota(page, { token: jwt });

  await page.goto('/app/admin');

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('link', { name: /Admin/ })).toHaveCount(0);
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('admin can open the admin route', async ({ page }) => {
  const admin = testUser({ roles: ['ADMIN'] });
  const jwt = 'admin-route-guard-jwt';

  const currentUser = await seedAuthenticatedSession(page, admin, jwt);
  const progress = await mockDashboardProgress(page, admin, { token: jwt });
  const usersCalls = await routeApi(page, '**/api/admin/users**', {
    method: 'GET',
    response: apiSuccess(
      {
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      },
      'Users loaded',
    ),
  });
  const promptCalls = await routeApi(page, '**/api/admin/prompts', {
    method: 'GET',
    response: apiSuccess([], 'Prompts loaded'),
  });
  const configCalls = await routeApi(page, '**/api/admin/exercise-config', {
    method: 'GET',
    response: apiSuccess(
      {
        levels: [],
        topics: [],
        exerciseTypes: [],
      },
      'Config loaded',
    ),
  });
  const auditCalls = await routeApi(page, '**/api/admin/audit-logs**', {
    method: 'GET',
    response: apiSuccess(
      {
        items: [],
        page: 0,
        size: 20,
        totalItems: 0,
        totalPages: 0,
      },
      'Audit loaded',
    ),
  });

  await page.goto('/app/admin');

  await expect(page).toHaveURL(/\/app\/admin$/);
  await expect(page.getByRole('link', { name: /Admin/ })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Admin dashboard' })).toBeVisible();
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(usersCalls);
  expectNoRouteErrors(promptCalls);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(auditCalls);
});

test('logout clears the token and leaves protected routes inaccessible', async ({ page }) => {
  const learner = testUser();
  const jwt = 'logout-jwt';

  const currentUser = await mockCurrentUser(page, learner, { token: jwt });
  const progress = await mockDashboardProgress(page, learner, { token: jwt });
  const quotaStatus = await mockQuota(page, { token: jwt });

  // Set the token after the first navigation so later reloads do not re-seed it.
  await page.goto('/');
  await page.evaluate(
    ({ key, value }) => localStorage.setItem(key, value),
    { key: authTokenStorageKey, value: jwt },
  );

  await page.goto('/app/dashboard');
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();

  await page.getByRole('button', { name: /Sign out/ }).click();

  await expect(page).toHaveURL(/\/$/);
  await expectStoredToken(page, null);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);

  await page.unroute('**/api/users/me');
  const unauthenticatedCurrentUser = await mockCurrentUser(page, learner, {
    requireAuth: false,
  });
  await page.goto('/app/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  expectNoRouteErrors(unauthenticatedCurrentUser.calls);
});
