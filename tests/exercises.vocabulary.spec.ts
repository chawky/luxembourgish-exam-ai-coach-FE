import { test, expect, type Page } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  expectNoRouteErrors,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockPracticeConfig } from './fixtures/practice-config.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

async function setupAuthenticatedVocabularyPage(page: Page) {
  const user = testUser();
  const token = 'vocabulary-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, token);
  const dashboardProgress = await mockDashboardProgress(page, user, { token });

  return { token, currentUser, dashboardProgress };
}

test('loads config, generates vocabulary, and completes attempt on reveal', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);
  let vocabularyPayload: Record<string, unknown> | undefined;
  let completionPayload: Record<string, unknown> | undefined;

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const vocabularyCalls = await routeApi(page, '**/api/exercises/vocabulary', {
    method: 'POST',
    response: apiSuccess(
      {
        attemptId: 888,
        usefulSentences: [
          {
            vocabularyWord: 'Moien',
            wordTranslation: 'Hello',
            sentence: 'Moien, wéi geet et?',
            sentenceTranslation: 'Hello, how are you?',
          },
          {
            vocabularyWord: 'Merci',
            wordTranslation: 'Thank you',
            sentence: 'Merci fir deng Hëllef.',
            sentenceTranslation: 'Thank you for your help.',
          },
        ],
      },
      'Vocabulary generated',
    ),
    onRequest: (request) => {
      vocabularyPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });
  const completionCalls = await routeApi(
    page,
    '**/api/progress/exercises/888/complete',
    {
      method: 'POST',
      response: apiSuccess(null, 'Attempt completed'),
      onRequest: (request) => {
        completionPayload = request.postDataJSON() as Record<string, unknown>;
      },
    },
  );

  await page.goto('/app/vocabulary');

  await expect(
    page.getByRole('heading', { name: 'Build everyday Luxembourgish' }),
  ).toBeVisible();
  await expect(page.getByLabel('Level')).toHaveValue('A1');
  await expect(page.getByLabel('Topic')).toHaveValue('DAILY_ROUTINE');

  await page.getByRole('button', { name: /Generate vocabulary/ }).click();

  await expect(page.getByRole('heading', { name: 'Daily Routine vocabulary' })).toBeVisible();
  await expect(page.getByText('Moien', { exact: true })).toBeVisible();
  await expect(page.getByText('Moien, wéi geet et?')).toBeVisible();
  await expect(page.getByText('Card 1 of 2')).toBeVisible();

  await page
    .locator('button')
    .filter({ hasText: 'Reveal translation' })
    .click();

  await expect(page.getByText('Hello', { exact: true })).toBeVisible();
  await expect(page.getByText('Hello, how are you?')).toBeVisible();
  expect(vocabularyPayload).toEqual({
    level: 'A1',
    topic: 'DAILY_ROUTINE',
  });
  expect(vocabularyPayload).not.toHaveProperty('type');
  await expect.poll(() => completionPayload).toEqual({});
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(vocabularyCalls);
  expectNoRouteErrors(completionCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('moves between vocabulary cards and resets flip state', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const vocabularyCalls = await routeApi(page, '**/api/exercises/vocabulary', {
    method: 'POST',
    response: apiSuccess(
      {
        attemptId: 889,
        usefulSentences: [
          {
            vocabularyWord: 'Moien',
            wordTranslation: 'Hello',
            sentence: 'Moien.',
            sentenceTranslation: 'Hello.',
          },
          {
            vocabularyWord: 'Äddi',
            wordTranslation: 'Goodbye',
            sentence: 'Äddi a bis geschwënn.',
            sentenceTranslation: 'Goodbye and see you soon.',
          },
        ],
      },
      'Vocabulary generated',
    ),
  });
  const completionCalls = await routeApi(
    page,
    '**/api/progress/exercises/889/complete',
    {
      method: 'POST',
      response: apiSuccess(null, 'Attempt completed'),
    },
  );

  await page.goto('/app/vocabulary');
  await page.getByRole('button', { name: /Generate vocabulary/ }).click();
  await page
    .locator('button')
    .filter({ hasText: 'Reveal translation' })
    .click();
  await expect(page.getByText('Hello', { exact: true })).toBeVisible();

  await page.getByRole('button', { name: 'Next card' }).click();

  await expect(page.getByText('Äddi', { exact: true })).toBeVisible();
  await expect(page.getByText('Card 2 of 2')).toBeVisible();
  // CSS transforms keep the back-face text visible to Playwright, so assert the component flip state directly.
  await expect(page.locator('.flashcard')).not.toHaveClass(/flipped/);
  await expect(
    page.locator('button').filter({ hasText: 'Reveal translation' }),
  ).toBeVisible();

  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(vocabularyCalls);
  expectNoRouteErrors(completionCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows empty state when vocabulary response has no sentences', async ({ page }) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const vocabularyCalls = await routeApi(page, '**/api/exercises/vocabulary', {
    method: 'POST',
    response: apiSuccess(
      {
        attemptId: 890,
        usefulSentences: [],
      },
      'Vocabulary generated',
    ),
  });

  await page.goto('/app/vocabulary');
  await page.getByRole('button', { name: /Generate vocabulary/ }).click();

  await expect(page.getByRole('heading', { name: 'No vocabulary returned' })).toBeVisible();
  await expect(page.getByText('Try generating a new set or choose another topic.')).toBeVisible();

  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(vocabularyCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows config load failure and disables vocabulary generation', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);

  const configCalls = await routeApi(page, '**/api/exercise-config', {
    method: 'GET',
    response: apiFailure('Could not load practice options.'),
  });
  const quotaStatus = await mockQuota(page, { token });

  await page.goto('/app/vocabulary');

  await expect(page.getByRole('alert')).toHaveText(
    'Could not load practice options.',
  );
  await expect(page.getByRole('button', { name: /Generate vocabulary/ })).toBeDisabled();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows vocabulary generation failures and re-enables generation', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const vocabularyCalls = await routeApi(page, '**/api/exercises/vocabulary', {
    method: 'POST',
    status: 429,
    response: apiFailure('Daily AI practice limit reached. Upgrade to continue.'),
  });

  await page.goto('/app/vocabulary');
  await page.getByRole('button', { name: /Generate vocabulary/ }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Daily AI practice limit reached. Upgrade to continue.',
  );
  await expect(page.getByRole('button', { name: /Generate vocabulary/ })).toBeEnabled();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(vocabularyCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('disables vocabulary generation when CHAT quota is exhausted', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedVocabularyPage(page);
  let vocabularyCalls = 0;

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, {
    token,
    data: quota({ exhausted: 'CHAT' }),
  });
  await page.route('**/api/exercises/vocabulary', async (route) => {
    vocabularyCalls += 1;
    await route.abort();
  });

  await page.goto('/app/vocabulary');

  await expect(
    page.getByText('Daily AI practice limit reached. Upgrade to continue.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate vocabulary/ })).toBeDisabled();
  expect(vocabularyCalls).toBe(0);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});
