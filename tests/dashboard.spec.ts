import { test, expect } from '@playwright/test';
import {
  apiFailure,
  expectNoRouteErrors,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import {
  mockDashboardProgress,
  progressDashboard,
} from './fixtures/dashboard.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

test('dashboard renders progress, quota, and quick links', async ({ page }) => {
  const user = testUser();
  const jwt = 'dashboard-success-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, jwt);
  const progress = await mockDashboardProgress(page, user, {
    token: jwt,
    data: progressDashboard(user, {
      currentStreakDays: 4,
      loggedInDays: 12,
      totalActivities: 21,
      completedActivities: 18,
      evaluatedActivities: 10,
    }),
  });
  const quotaStatus = await mockQuota(page, { token: jwt, data: quota() });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  await expect(page.getByText('4 days')).toBeVisible();
  await expect(page.getByText('Days logged in')).toBeVisible();
  await expect(page.getByText('Total activities')).toBeVisible();
  await expect(page.getByText('Completed activities')).toBeVisible();
  await expect(page.getByText('Practice usage')).toBeVisible();
  await expect(page.getByText('AI practice')).toBeVisible();
  await expect(page.getByRole('link', { name: /Speaking drill/ })).toBeVisible();
  await expect(page.getByRole('link', { name: /Listening exercise/ })).toBeVisible();
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('dashboard renders an empty progress state cleanly', async ({ page }) => {
  const user = testUser();
  const jwt = 'dashboard-empty-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, jwt);
  const progress = await mockDashboardProgress(page, user, {
    token: jwt,
    data: progressDashboard(user, {
      loggedInDays: 0,
      currentStreakDays: 0,
      totalActivities: 0,
      completedActivities: 0,
      evaluatedActivities: 0,
      latestExerciseName: undefined,
      skillProgress: [],
    }),
  });
  const quotaStatus = await mockQuota(page, { token: jwt, data: quota() });

  await page.goto('/app/dashboard');

  await expect(page.getByText('No progress yet')).toBeVisible();
  await expect(page.getByText('undefined')).toHaveCount(0);
  await expect(page.getByText('NaN')).toHaveCount(0);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('dashboard shows progress errors without breaking quota display', async ({
  page,
}) => {
  const user = testUser();
  const jwt = 'dashboard-error-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, jwt);
  const quotaStatus = await mockQuota(page, { token: jwt, data: quota() });
  const progressCalls = await routeApi(page, '**/api/progress/me', {
    method: 'GET',
    response: apiFailure('Could not load dashboard progress.'),
  });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('alert')).toHaveText(
    'Could not load dashboard progress.',
  );
  await expect(page.getByText('Practice usage')).toBeVisible();
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progressCalls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('dashboard shows quota errors without hiding progress', async ({ page }) => {
  const user = testUser();
  const jwt = 'quota-error-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, jwt);
  const progress = await mockDashboardProgress(page, user, { token: jwt });
  const quotaCalls = await routeApi(page, '**/api/users/me/ai-quota', {
    method: 'GET',
    response: apiFailure('Could not load AI quota.'),
  });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  await expect(page.getByRole('alert')).toHaveText('Could not load AI quota.');
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
  expectNoRouteErrors(quotaCalls);
});
