import { test, expect } from '@playwright/test';
import {
  apiSuccess,
  apiFailure,
  expectNoRouteErrors,
  fulfillJson,
  routeApi,
} from './fixtures/api.fixture';
import {
  mockCurrentUser,
  responseUser,
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

test('admin confirms disabling and deleting an account', async ({ page }) => {
  const admin = testUser({ roles: ['ADMIN'] });
  const learner = testUser({
    id: 77,
    email: `delete.target.${Date.now()}@example.com`,
    emailVerified: false,
  });
  const jwt = 'admin-delete-jwt';
  let statusPayload: Record<string, unknown> | undefined;
  let deleteCalls = 0;

  const currentUser = await seedAuthenticatedSession(page, admin, jwt);
  const progress = await mockDashboardProgress(page, admin, { token: jwt });

  await page.route('**/api/admin/users**', async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    const path = url.pathname;

    if (request.method() === 'GET' && path === '/api/admin/users') {
      await fulfillJson(
        route,
        apiSuccess(
          {
            items: [learner],
            page: 0,
            size: 20,
            totalItems: 1,
            totalPages: 1,
          },
          'Users loaded',
        ),
      );
      return;
    }

    if (request.method() === 'GET' && path === `/api/admin/users/${learner.id}`) {
      await fulfillJson(
        route,
        apiSuccess(
          {
            user: learner,
            progress: {
              totalActivities: 0,
              completedActivities: 0,
              evaluatedActivities: 0,
            },
            aiUsage: { totalRequests: 0, totalEstimatedCostUsd: 0 },
            aiQuota: { tier: 'FREE', categories: [] },
          },
          'User loaded',
        ),
      );
      return;
    }

    if (
      request.method() === 'GET' &&
      (path === `/api/admin/users/${learner.id}/progress` ||
        path === `/api/admin/users/${learner.id}/ai-usage`)
    ) {
      await fulfillJson(
        route,
        apiSuccess(
          {
            items: [],
            page: 0,
            size: 8,
            totalItems: 0,
            totalPages: 0,
          },
          'Page loaded',
        ),
      );
      return;
    }

    if (
      request.method() === 'PATCH' &&
      path === `/api/admin/users/${learner.id}/status`
    ) {
      statusPayload = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(
        route,
        apiSuccess(
          {
            user: { ...learner, adminDisabled: true },
            progress: {
              totalActivities: 0,
              completedActivities: 0,
              evaluatedActivities: 0,
            },
            aiUsage: { totalRequests: 0, totalEstimatedCostUsd: 0 },
            aiQuota: { tier: 'FREE', categories: [] },
          },
          'Status updated',
        ),
      );
      return;
    }

    if (request.method() === 'DELETE' && path === `/api/admin/users/${learner.id}`) {
      deleteCalls += 1;
      await fulfillJson(route, apiSuccess(null, 'Account deleted'));
      return;
    }

    throw new Error(`Unexpected admin users request: ${request.method()} ${path}`);
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
  await expect(
    page.locator('.user-row').filter({ hasText: learner.email }),
  ).toBeVisible();
  await expect(page.getByText('Pending verification')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Disable account' })).toBeVisible();

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Disable');
    await dialog.accept();
  });
  await page.getByPlaceholder('Reason for audit log').fill('Policy check');
  await page.getByRole('button', { name: 'Disable account' }).click();

  await expect(page.getByRole('button', { name: 'Enable account' })).toBeVisible();
  expect(statusPayload).toEqual({
    adminDisabled: true,
    reason: 'Policy check',
  });

  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Delete');
    expect(dialog.message()).toContain('permanently removes the account');
    await dialog.accept();
  });
  await page.getByRole('button', { name: 'Delete account' }).click();

  await expect(page.getByText('Select a user')).toBeVisible();
  await expect(page.getByText(learner.email)).toHaveCount(0);
  expect(deleteCalls).toBe(1);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(promptCalls);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(auditCalls);
});

test('logout clears the session and leaves protected routes inaccessible', async ({ page }) => {
  const learner = testUser();
  const jwt = 'logout-jwt';

  const currentUser = await mockCurrentUser(page, learner, { token: jwt });
  const progress = await mockDashboardProgress(page, learner, { token: jwt });
  const quotaStatus = await mockQuota(page, { token: jwt });

  await page.goto('/');

  await page.goto('/app/dashboard');
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();

  await page.getByRole('button', { name: /Sign out/ }).click();

  await expect(page).toHaveURL(/\/$/);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);

  await page.unroute('**/api/users/me');
  const unauthenticatedCurrentUser = await routeApi(page, '**/api/users/me', {
    method: 'GET',
    status: 401,
    response: apiFailure('Please log in and try again.'),
  });
  await page.goto('/app/dashboard');

  await expect(page).toHaveURL(/\/login$/);
  expectNoRouteErrors(unauthenticatedCurrentUser);
});

test('support nav keeps authenticated users in session context', async ({ page }) => {
  const learner = testUser();
  const jwt = 'support-nav-jwt';

  const currentUser = await seedAuthenticatedSession(page, learner, jwt);
  const progress = await mockDashboardProgress(page, learner, { token: jwt });
  const quotaStatus = await mockQuota(page, { token: jwt });

  await page.goto('/app/dashboard');
  await page.getByRole('link', { name: /Support/ }).click();

  await expect(page).toHaveURL(/\/#support$/);
  await expect(page.getByRole('heading', { name: 'Need help with Letz Speak?' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Sign in' })).toHaveCount(0);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('google-linked user does not see profile link prompt', async ({ page }) => {
  const learner = testUser({ googleLinked: true });

  const currentUser = await seedAuthenticatedSession(page, learner);
  const progress = await mockDashboardProgress(page, learner);
  const quotaStatus = await mockQuota(page);

  await page.goto('/app/profile');

  await expect(page.getByRole('heading', { name: 'Your account' })).toBeVisible();
  await expect(page.getByLabel('Google sign-in')).toHaveCount(0);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('google-only user can set first password from profile', async ({ page }) => {
  const learner = testUser({ googleLinked: true, hasPassword: false });
  const userRouteErrors: string[] = [];
  let profilePayload: Record<string, unknown> | undefined;
  let passwordPayload: Record<string, unknown> | undefined;

  const progress = await mockDashboardProgress(page, learner);
  const quotaStatus = await mockQuota(page);
  await page.route('**/api/users/me', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await fulfillJson(route, apiSuccess(responseUser(learner), 'User loaded'));
      return;
    }

    if (request.method() === 'PUT') {
      profilePayload = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(
        route,
        apiSuccess(responseUser(learner), 'Current user updated successfully'),
      );
      return;
    }

    userRouteErrors.push(`Unexpected ${request.method()} ${request.url()}`);
    await route.abort();
  });
  const passwordCalls = await routeApi(page, '**/api/users/me/password', {
    method: 'POST',
    response: apiSuccess(
      responseUser({ ...learner, hasPassword: true }),
      'Password set successfully',
    ),
    onRequest: (request) => {
      passwordPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });

  await page.goto('/app/profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await expect(page.getByRole('heading', { name: 'Set password' })).toBeVisible();
  await expect(page.getByLabel('Current password')).toHaveCount(0);

  await page.getByLabel('New password', { exact: true }).fill('NewSecurePassword1!');
  await page.getByLabel('Confirm new password').fill('NewSecurePassword1!');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByRole('status')).toHaveText('Password set.');
  expect(profilePayload).not.toHaveProperty('password');
  expect(passwordPayload).toEqual({
    newPassword: 'NewSecurePassword1!',
    confirmPassword: 'NewSecurePassword1!',
  });
  expect(userRouteErrors).toEqual([]);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(passwordCalls);
});

test('password account changes password with current password', async ({ page }) => {
  const learner = testUser({ hasPassword: true });
  const userRouteErrors: string[] = [];
  let profilePayload: Record<string, unknown> | undefined;
  let passwordPayload: Record<string, unknown> | undefined;

  const progress = await mockDashboardProgress(page, learner);
  const quotaStatus = await mockQuota(page);
  await page.route('**/api/users/me', async (route) => {
    const request = route.request();

    if (request.method() === 'GET') {
      await fulfillJson(route, apiSuccess(responseUser(learner), 'User loaded'));
      return;
    }

    if (request.method() === 'PUT') {
      profilePayload = request.postDataJSON() as Record<string, unknown>;
      await fulfillJson(
        route,
        apiSuccess(responseUser(learner), 'Current user updated successfully'),
      );
      return;
    }

    userRouteErrors.push(`Unexpected ${request.method()} ${request.url()}`);
    await route.abort();
  });
  const passwordCalls = await routeApi(page, '**/api/users/me/password', {
    method: 'PUT',
    response: apiSuccess(responseUser(learner), 'Password changed successfully'),
    onRequest: (request) => {
      passwordPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });

  await page.goto('/app/profile');
  await page.getByRole('button', { name: 'Edit profile' }).click();
  await expect(page.getByRole('heading', { name: 'Change password' })).toBeVisible();

  await page.getByLabel('Current password').fill(learner.password);
  await page
    .getByLabel('New password', { exact: true })
    .fill('ChangedSecurePassword1!');
  await page.getByLabel('Confirm new password').fill('ChangedSecurePassword1!');
  await page.getByRole('button', { name: 'Save changes' }).click();

  await expect(page.getByRole('status')).toHaveText('Password changed.');
  expect(profilePayload).not.toHaveProperty('password');
  expect(passwordPayload).toEqual({
    currentPassword: learner.password,
    newPassword: 'ChangedSecurePassword1!',
    confirmPassword: 'ChangedSecurePassword1!',
  });
  expect(userRouteErrors).toEqual([]);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(passwordCalls);
});
