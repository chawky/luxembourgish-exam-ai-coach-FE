import { expect, test, type Page } from '@playwright/test';
import { apiSuccess, routeApi } from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockPracticeConfig } from './fixtures/practice-config.fixture';
import { mockQuota } from './fixtures/quota.fixture';

interface ObjectUrlLog {
  created: string[];
  revoked: string[];
}

async function setupPracticeSession(page: Page, token: string) {
  const user = testUser({ id: 42 });
  await seedAuthenticatedSession(page, user, token);
  await mockDashboardProgress(page, user, { token });
  await mockPracticeConfig(page);
  const quotaCalls = await mockQuota(page, { token });
  return { user, quotaCalls };
}

async function mockRecording(page: Page): Promise<void> {
  await page.addInitScript(() => {
    Object.defineProperty(navigator, 'mediaDevices', {
      configurable: true,
      value: {
        getUserMedia: async () => ({
          getTracks: () => [{ stop: () => undefined }],
        }),
      },
    });

    class FakeMediaRecorder extends EventTarget {
      static isTypeSupported(): boolean {
        return true;
      }

      state: RecordingState = 'inactive';
      mimeType = 'audio/webm';

      start(): void {
        this.state = 'recording';
      }

      stop(): void {
        this.state = 'inactive';
        const dataEvent = new Event('dataavailable');
        Object.defineProperty(dataEvent, 'data', {
          value: new Blob(['recording'], { type: this.mimeType }),
        });
        this.dispatchEvent(dataEvent);
        this.dispatchEvent(new Event('stop'));
      }
    }

    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      value: FakeMediaRecorder,
    });
  });
}

async function instrumentObjectUrls(page: Page): Promise<void> {
  await page.addInitScript(() => {
    const target = window as Window & { __practiceObjectUrls?: ObjectUrlLog };
    target.__practiceObjectUrls = { created: [], revoked: [] };

    URL.createObjectURL = (): string => {
      const url = `blob:practice-${crypto.randomUUID()}`;
      target.__practiceObjectUrls?.created.push(url);
      return url;
    };
    URL.revokeObjectURL = (url: string): void => {
      target.__practiceObjectUrls?.revoked.push(url);
    };
  });
}

async function objectUrlLog(page: Page): Promise<ObjectUrlLog> {
  return page.evaluate(() => {
    const target = window as Window & { __practiceObjectUrls?: ObjectUrlLog };
    return target.__practiceObjectUrls ?? { created: [], revoked: [] };
  });
}

test('topic exercise survives navigation and refresh without regeneration or quota mutation', async ({
  page,
}) => {
  const { quotaCalls } = await setupPracticeSession(page, 'topic-session-jwt');
  let generationRequests = 0;
  let completionRequests = 0;

  await routeApi(page, '**/api/exercises/generate', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7101,
      question: 'Session-persisted topic question',
      expectedAnswer: 'A model answer',
      type: 'SHORT_ANSWER',
      level: 'A1',
      topic: 'DAILY_ROUTINE',
    }),
    onRequest: () => {
      generationRequests += 1;
    },
  });
  await page.route('**/api/progress/exercises/**/complete', async (route) => {
    completionRequests += 1;
    await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(apiSuccess(null)) });
  });

  await page.goto('/app/exercises');
  await page.getByRole('button', { name: /Generate exercise/ }).click();
  await page.getByPlaceholder('Write your answer here...').fill('Mäi gespäicherten Entworf');
  await page.goto('/app/dashboard');
  await page.goto('/app/exercises');

  await expect(page.getByText('Session-persisted topic question')).toBeVisible();
  await expect(page.getByPlaceholder('Write your answer here...')).toHaveValue('Mäi gespäicherten Entworf');
  await page.reload();
  await expect(page.getByText('Session-persisted topic question')).toBeVisible();
  expect(generationRequests).toBe(1);
  expect(completionRequests).toBe(0);
  expect(quotaCalls.calls.every((call) => call.method === 'GET')).toBe(true);

  await page.getByRole('button', { name: 'Clear exercise' }).click();
  await expect(page.getByText('No exercise generated yet')).toBeVisible();
  await page.reload();
  await expect(page.getByText('No exercise generated yet')).toBeVisible();
  expect(generationRequests).toBe(1);
  expect(completionRequests).toBe(0);
});

test('evaluated Speaking stays closed after restore and clearing it preserves Listening', async ({
  page,
}) => {
  await mockRecording(page);
  await instrumentObjectUrls(page);
  await setupPracticeSession(page, 'speaking-listening-session-jwt');
  let speakingGenerations = 0;
  let listeningGenerations = 0;

  await routeApi(page, '**/api/exercises/practice', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7201,
      question: 'Persisted speaking prompt',
      questionTranslation: 'Persisted translation',
      audio: 'AAAA',
    }),
    onRequest: () => {
      speakingGenerations += 1;
    },
  });
  await routeApi(page, '**/api/exercises/recording**', {
    method: 'POST',
    response: apiSuccess({
      transcript: 'Persisted transcript',
      score: 88,
      feedback: 'Persisted speaking evaluation',
      corrections: [],
    }),
  });
  await routeApi(page, '**/api/exercises/listening', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7202,
      question: 'Persisted listening transcript',
      questionTranslation: 'Listening translation',
      hint: 'Listen carefully',
      expectedAnswer: 'Answer',
      type: 'SHORT_ANSWER',
      level: 'A1',
      topic: 'DAILY_ROUTINE',
      audio: 'AAAA',
    }),
    onRequest: () => {
      listeningGenerations += 1;
    },
  });

  await page.goto('/app/listening');
  await page.getByRole('button', { name: /Generate listening exercise/ }).click();
  await page.getByRole('button', { name: 'Show transcript' }).click();
  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Persisted speaking evaluation')).toBeVisible();

  await page.goto('/app/dashboard');
  await page.goto('/app/speaking');
  await expect(page.getByText('Persisted speaking evaluation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  expect(speakingGenerations).toBe(1);

  await page.getByRole('button', { name: 'Clear exercise' }).click();
  await expect(page.getByText('No prompt generated yet')).toBeVisible();
  await page.goto('/app/listening');
  await expect(page.getByText('Persisted listening transcript')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Hide transcript' })).toBeVisible();
  expect(listeningGenerations).toBe(1);
  await page.getByRole('button', { name: 'Clear exercise' }).click();
  expect((await objectUrlLog(page)).revoked.length).toBeGreaterThan(0);
});

test('image description recreates its image and remains closed after refresh', async ({ page }) => {
  await mockRecording(page);
  await instrumentObjectUrls(page);
  await setupPracticeSession(page, 'image-session-jwt');
  let generationRequests = 0;
  let evaluationRequests = 0;

  await routeApi(page, '**/api/exercises/generate-image', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7301,
      image: 'iVBORw0KGgo=',
      imageDescription: 'A persisted image description',
    }),
    onRequest: () => {
      generationRequests += 1;
    },
  });
  await routeApi(page, '**/api/exercises/image-description/recording**', {
    method: 'POST',
    response: apiSuccess({
      transcript: 'Image transcript',
      score: 91,
      feedback: 'Persisted image evaluation',
      corrections: [],
    }),
    onRequest: () => {
      evaluationRequests += 1;
    },
  });

  await page.goto('/app/image-description');
  await page.getByRole('button', { name: /Generate image/ }).click();
  const firstImageUrl = await page.getByRole('img').getAttribute('src');
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Persisted image evaluation')).toBeVisible();

  await page.reload();
  const restoredImageUrl = await page.getByRole('img').getAttribute('src');
  expect(firstImageUrl).toMatch(/^blob:practice-/);
  expect(restoredImageUrl).toMatch(/^blob:practice-/);
  expect(restoredImageUrl).not.toBe(firstImageUrl);
  await expect(page.getByText('Persisted image evaluation')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  expect(generationRequests).toBe(1);
  expect(evaluationRequests).toBe(1);

  await page.getByRole('button', { name: 'Clear exercise' }).click();
  await expect(page.getByText('No image generated yet')).toBeVisible();
  expect((await objectUrlLog(page)).revoked).toContain(restoredImageUrl);
});

test('vocabulary restores its current card and reveal state without completing twice', async ({ page }) => {
  await setupPracticeSession(page, 'vocabulary-session-jwt');
  let generationRequests = 0;
  let completionRequests = 0;

  await routeApi(page, '**/api/exercises/vocabulary', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7401,
      usefulSentences: [
        { vocabularyWord: 'Moien', wordTranslation: 'Hello' },
        { vocabularyWord: 'Merci', wordTranslation: 'Thank you' },
      ],
    }),
    onRequest: () => {
      generationRequests += 1;
    },
  });
  await routeApi(page, '**/api/progress/exercises/7401/complete', {
    method: 'POST',
    response: apiSuccess(null),
    onRequest: () => {
      completionRequests += 1;
    },
  });

  await page.goto('/app/vocabulary');
  await page.getByRole('button', { name: /Generate vocabulary/ }).click();
  await page.getByRole('button', { name: 'Next card' }).click();
  await page.getByRole('button', { name: 'Reveal translation' }).last().click();
  await expect(page.getByText('Thank you')).toBeVisible();
  await page.goto('/app/dashboard');
  await page.goto('/app/vocabulary');

  await expect(page.getByText('Card 2 of 2')).toBeVisible();
  await expect(page.getByText('Thank you')).toBeVisible();
  await page.reload();
  await expect(page.getByText('Card 2 of 2')).toBeVisible();
  expect(generationRequests).toBe(1);
  expect(completionRequests).toBe(1);
});

test('logout clears all persisted practice sessions', async ({ page }) => {
  await setupPracticeSession(page, 'logout-practice-session-jwt');
  await routeApi(page, '**/api/exercises/generate', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 7501,
      question: 'Cleared on logout',
      type: 'SHORT_ANSWER',
      level: 'A1',
      topic: 'DAILY_ROUTINE',
    }),
  });
  await routeApi(page, '**/api/users/logout', {
    method: 'POST',
    response: apiSuccess(null),
  });

  await page.goto('/app/exercises');
  await page.getByRole('button', { name: /Generate exercise/ }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('sproochen.practice-session.')).length)).toBe(1);

  await page.getByRole('button', { name: 'Sign out' }).click();
  await expect.poll(() => page.evaluate(() => Object.keys(sessionStorage).filter((key) => key.startsWith('sproochen.practice-session.')).length)).toBe(0);
});
