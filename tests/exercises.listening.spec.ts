import { test, expect, type Page } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  expectNoRouteErrors,
  fulfillJson,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockPracticeConfig } from './fixtures/practice-config.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

interface AudioUrlLog {
  created: string[];
  revoked: string[];
}

async function setupAuthenticatedListeningPage(page: Page) {
  const user = testUser();
  const token = 'listening-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, token);
  const dashboardProgress = await mockDashboardProgress(page, user, { token });

  return { token, currentUser, dashboardProgress };
}

async function instrumentObjectUrls(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as Window & {
      __audioUrlLog?: AudioUrlLog;
    };
    const originalCreateObjectURL = URL.createObjectURL.bind(URL);
    const originalRevokeObjectURL = URL.revokeObjectURL.bind(URL);

    target.__audioUrlLog = {
      created: [],
      revoked: [],
    };

    URL.createObjectURL = (object: Blob | MediaSource): string => {
      const url = originalCreateObjectURL(object);
      target.__audioUrlLog?.created.push(url);
      return url;
    };

    URL.revokeObjectURL = (url: string): void => {
      target.__audioUrlLog?.revoked.push(url);
      originalRevokeObjectURL(url);
    };
  });
}

async function audioUrlLog(page: Page): Promise<AudioUrlLog> {
  return page.evaluate(() => {
    const target = window as Window & {
      __audioUrlLog?: AudioUrlLog;
    };

    return target.__audioUrlLog ?? { created: [], revoked: [] };
  });
}

function listeningExercise(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    attemptId: 901,
    question: 'Ech ginn haut op de Maart.',
    questionTranslation: 'I am going to the market today.',
    hint: 'What is the speaker doing today?',
    hintTranslation: 'Wat mécht de Spriecher haut?',
    expectedAnswer: 'Going to the market.',
    type: 'MULTIPLE_CHOICE',
    level: 'A1',
    topic: 'DAILY_ROUTINE',
    options: [
      {
        label: 'A',
        text: 'Going to the market.',
        correct: true,
      },
      {
        label: 'B',
        text: 'Going to work.',
        correct: false,
      },
    ],
    audio: 'AAAA',
    audioMimeType: 'audio/mpeg',
    ...overrides,
  };
}

test('generates listening audio and completes attempt on answer selection', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);
  let listeningPayload: Record<string, unknown> | undefined;
  let completionPayload: Record<string, unknown> | undefined;

  await instrumentObjectUrls(page);
  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const listeningCalls = await routeApi(page, '**/api/exercises/listening', {
    method: 'POST',
    response: apiSuccess(listeningExercise(), 'Listening generated'),
    onRequest: (request) => {
      listeningPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });
  const completionCalls = await routeApi(
    page,
    '**/api/progress/exercises/901/complete',
    {
      method: 'POST',
      response: apiSuccess(null, 'Attempt completed'),
      onRequest: (request) => {
        completionPayload = request.postDataJSON() as Record<string, unknown>;
      },
    },
  );

  await page.goto('/app/listening');

  await expect(page.getByRole('heading', { name: 'Train your ear' })).toBeVisible();
  await expect(page.getByLabel('Level')).toHaveValue('A1');
  await expect(page.getByLabel('Topic')).toHaveValue('DAILY_ROUTINE');
  await expect(page.getByLabel('Answer type')).toHaveValue('MULTIPLE_CHOICE');

  await page.getByRole('button', { name: /Generate listening exercise/ }).click();

  await expect(page.getByText('Generated audio')).toBeVisible();
  await expect(page.getByText('What is the speaker doing today?')).toBeVisible();
  await expect(page.getByRole('button', { name: /Going to the market/ })).toBeVisible();

  await page.getByRole('button', { name: 'Show transcript' }).click();
  await expect(page.getByText('Ech ginn haut op de Maart.')).toBeVisible();

  await page.getByRole('button', { name: 'Show translation' }).click();
  await expect(page.getByText('I am going to the market today.')).toBeVisible();

  await page.getByRole('button', { name: /Going to the market/ }).click();

  expect(listeningPayload).toEqual({
    level: 'A1',
    topic: 'DAILY_ROUTINE',
    type: 'MULTIPLE_CHOICE',
  });
  await expect.poll(() => completionPayload).toEqual({
    learnerAnswer: 'Going to the market.',
  });
  await expect.poll(() => audioUrlLog(page)).toMatchObject({
    created: expect.arrayContaining([expect.stringMatching(/^blob:/)]),
  });
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(listeningCalls);
  expectNoRouteErrors(completionCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('revokes previous listening audio object URL when generating again', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);
  let requestCount = 0;

  await instrumentObjectUrls(page);
  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  await page.route('**/api/exercises/listening', async (route) => {
    requestCount += 1;

    await fulfillJson(
      route,
      apiSuccess(
        listeningExercise({
          attemptId: 910 + requestCount,
          question:
            requestCount === 1
              ? 'Déi éischt Audio-Aufgab.'
              : 'Déi zweet Audio-Aufgab.',
        }),
        'Listening generated',
      ),
    );
  });

  await page.goto('/app/listening');
  await page.getByRole('button', { name: /Generate listening exercise/ }).click();
  await expect(page.getByText('Déi éischt Audio-Aufgab.')).not.toBeVisible();
  await page.getByRole('button', { name: 'Show transcript' }).click();
  await expect(page.getByText('Déi éischt Audio-Aufgab.')).toBeVisible();

  const firstLog = await audioUrlLog(page);
  expect(firstLog.created.length).toBeGreaterThanOrEqual(1);
  const firstExerciseUrl = firstLog.created[0];

  await page.getByRole('button', { name: /Generate listening exercise/ }).click();
  await page.getByRole('button', { name: 'Show transcript' }).click();
  await expect(page.getByText('Déi zweet Audio-Aufgab.')).toBeVisible();

  await expect
    .poll(async () => (await audioUrlLog(page)).revoked.includes(firstExerciseUrl))
    .toBe(true);
  await expect
    .poll(async () => (await audioUrlLog(page)).created.length)
    .toBeGreaterThan(firstLog.created.length);
  expect(requestCount).toBe(2);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows a no-audio fallback when listening response omits audio', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const listeningCalls = await routeApi(page, '**/api/exercises/listening', {
    method: 'POST',
    response: apiSuccess(
      listeningExercise({
        attemptId: 902,
        audio: undefined,
      }),
      'Listening generated',
    ),
  });

  await page.goto('/app/listening');
  await page.getByRole('button', { name: /Generate listening exercise/ }).click();

  await expect(page.getByText('No audio returned')).toBeVisible();
  await expect(page.getByText('The exercise text is ready')).toBeVisible();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(listeningCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows invalid Base64 audio errors without crashing the exercise', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const listeningCalls = await routeApi(page, '**/api/exercises/listening', {
    method: 'POST',
    response: apiSuccess(
      listeningExercise({
        attemptId: 903,
        audio: 'not valid base64!!',
      }),
      'Listening generated',
    ),
  });

  await page.goto('/app/listening');
  await page.getByRole('button', { name: /Generate listening exercise/ }).click();

  await expect(page.getByText('Generated audio could not be loaded.')).toBeVisible();
  await expect(page.getByText('No audio returned')).toBeVisible();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(listeningCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows config load failure and disables listening generation', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);

  const configCalls = await routeApi(page, '**/api/exercise-config', {
    method: 'GET',
    response: apiFailure('Could not load practice options.'),
  });
  const quotaStatus = await mockQuota(page, { token });

  await page.goto('/app/listening');

  await expect(page.getByRole('alert')).toHaveText(
    'Could not load practice options.',
  );
  await expect(
    page.getByRole('button', { name: /Generate listening exercise/ }),
  ).toBeDisabled();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('shows listening generation failures and re-enables generation', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, { token });
  const listeningCalls = await routeApi(page, '**/api/exercises/listening', {
    method: 'POST',
    status: 429,
    response: apiFailure('Daily audio generation limit reached. Upgrade to continue.'),
  });

  await page.goto('/app/listening');
  await page.getByRole('button', { name: /Generate listening exercise/ }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Daily audio generation limit reached. Upgrade to continue.',
  );
  await expect(
    page.getByRole('button', { name: /Generate listening exercise/ }),
  ).toBeEnabled();
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(listeningCalls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});

test('disables listening generation when TTS quota is exhausted', async ({
  page,
}) => {
  const { token, currentUser, dashboardProgress } =
    await setupAuthenticatedListeningPage(page);
  let listeningCalls = 0;

  const configCalls = await mockPracticeConfig(page);
  const quotaStatus = await mockQuota(page, {
    token,
    data: quota({ exhausted: 'TTS' }),
  });
  await page.route('**/api/exercises/listening', async (route) => {
    listeningCalls += 1;
    await route.abort();
  });

  await page.goto('/app/listening');

  await expect(
    page.getByText('Daily audio generation limit reached. Upgrade to continue.'),
  ).toBeVisible();
  await expect(
    page.getByRole('button', { name: /Generate listening exercise/ }),
  ).toBeDisabled();
  expect(listeningCalls).toBe(0);
  expectNoRouteErrors(configCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(dashboardProgress.calls);
});
