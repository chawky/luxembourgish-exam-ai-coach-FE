import { test, expect } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  expectNoRouteErrors,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import {
  mockPracticeConfig,
  practiceConfig,
} from './fixtures/practice-config.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

async function setupAuthenticatedExercisePage(page: import('@playwright/test').Page) {
  const user = testUser();
  const token = 'text-exercise-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, token);
  const dashboardProgress = await mockDashboardProgress(page, user, { token });

  return { user, token, currentUser, dashboardProgress };
}

test('loads practice config, generates text exercise, and completes attempt', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedExercisePage(page);
  let generatePayload: Record<string, unknown> | undefined;
  let completionPayload: Record<string, unknown> | undefined;

  const configCalls = await mockPracticeConfig(page);
  const quotaCalls = await mockQuota(page, { token });
  const generateCalls = await routeApi(page, '**/api/exercises/generate', {
    method: 'POST',
    response: apiSuccess(
      {
        attemptId: 777,
        question: 'Translate: I am learning Luxembourgish.',
        type: 'MULTIPLE_CHOICE',
        level: 'A1',
        topic: 'DAILY_ROUTINE',
        options: [
          {
            label: 'A',
            text: 'Ech léieren Lëtzebuergesch.',
            correct: true,
          },
          {
            label: 'B',
            text: 'Ech schaffen zu Lëtzebuerg.',
            correct: false,
          },
        ],
        expectedAnswer: 'Ech léieren Lëtzebuergesch.',
        hint: 'Use Ech for I.',
      },
      'Exercise generated',
    ),
    onRequest: (request) => {
      generatePayload = request.postDataJSON() as Record<string, unknown>;
    },
  });
  const completionCalls = await routeApi(
    page,
    '**/api/progress/exercises/777/complete',
    {
      method: 'POST',
      response: apiSuccess(null, 'Attempt completed'),
      onRequest: (request) => {
        completionPayload = request.postDataJSON() as Record<string, unknown>;
      },
    },
  );

  await page.goto('/app/exercises');

  await expect(page.getByRole('heading', { name: 'Exercises by topic' })).toBeVisible();
  await expect(page.getByLabel('Level')).toHaveValue('A1');
  await expect(page.getByLabel('Topic')).toHaveValue('DAILY_ROUTINE');
  await expect(page.getByLabel('Exercise type')).toHaveValue('TRANSLATION');

  await page.getByLabel('Exercise type').selectOption('MULTIPLE_CHOICE');

  await page.getByRole('button', { name: /Generate exercise/ }).click();

  await expect(page.getByText('Translate: I am learning Luxembourgish.')).toBeVisible();
  await expect(page.getByText('Use Ech for I.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Ech léieren Lëtzebuergesch/ })).toBeVisible();

  await page.getByRole('button', { name: /Ech léieren Lëtzebuergesch/ }).click();

  expect(generatePayload).toEqual({
    level: 'A1',
    topic: 'DAILY_ROUTINE',
    type: 'MULTIPLE_CHOICE',
  });
  await expect.poll(() => completionPayload).toEqual({
    learnerAnswer: 'Ech léieren Lëtzebuergesch.',
  });
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaCalls.calls);
  expectNoRouteErrors(generateCalls);
  expectNoRouteErrors(completionCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('filters topics when the selected level changes', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedExercisePage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaCalls = await mockQuota(page, { token });

  await page.goto('/app/exercises');

  await expect(page.getByLabel('Topic')).toHaveValue('DAILY_ROUTINE');

  await page.getByLabel('Level').selectOption('A2');
  await expect(page.getByLabel('Topic')).toHaveValue('WORK');
  await expect(page.getByRole('option', { name: 'Daily Routine' })).toHaveCount(0);

  await page.getByLabel('Level').selectOption('B1');
  await expect(page.getByLabel('Topic')).toHaveValue('CULTURE');
  await expect(page.getByRole('option', { name: 'Work' })).toHaveCount(0);

  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaCalls.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows a blocking message when practice config cannot load', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedExercisePage(page);

  const configCalls = await routeApi(page, '**/api/exercise-config', {
    method: 'GET',
    response: apiFailure('Could not load practice options.'),
  });
  const quotaCalls = await mockQuota(page, { token });

  await page.goto('/app/exercises');

  await expect(page.getByRole('alert')).toHaveText(
    'Could not load practice options.',
  );
  await expect(page.getByRole('button', { name: /Generate exercise/ })).toBeDisabled();

  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaCalls.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows backend generation failures and re-enables generation', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedExercisePage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaCalls = await mockQuota(page, { token });
  const generateCalls = await routeApi(page, '**/api/exercises/generate', {
    method: 'POST',
    status: 429,
    response: apiFailure('Daily AI practice limit reached. Upgrade to continue.'),
  });

  await page.goto('/app/exercises');
  await page.getByRole('button', { name: /Generate exercise/ }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Daily AI practice limit reached. Upgrade to continue.',
  );
  await expect(page.getByRole('button', { name: /Generate exercise/ })).toBeEnabled();

  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaCalls.calls);
  expectNoRouteErrors(generateCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('disables generation when CHAT quota is exhausted', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedExercisePage(page);
  let generateCalls = 0;

  const configCalls = await mockPracticeConfig(page, {
    data: practiceConfig(),
  });
  const quotaCalls = await mockQuota(page, {
    token,
    data: quota({ exhausted: 'CHAT' }),
  });
  await page.route('**/api/exercises/generate', async (route) => {
    generateCalls += 1;
    await route.abort();
  });

  await page.goto('/app/exercises');

  await expect(
    page.getByText('Daily AI practice limit reached. Upgrade to continue.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate exercise/ })).toBeDisabled();
  expect(generateCalls).toBe(0);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaCalls.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});
