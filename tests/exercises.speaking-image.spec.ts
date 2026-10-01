import { expect, test, type Page } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  fulfillJson,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockPracticeConfig } from './fixtures/practice-config.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

async function setupPracticePage(page: Page, token: string): Promise<void> {
  const user = testUser();
  await seedAuthenticatedSession(page, user, token);
  await mockDashboardProgress(page, user, { token });
  await mockPracticeConfig(page);
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

test('Speaking evaluation sends the generated attemptId', async ({ page }) => {
  const token = 'speaking-attempt-jwt';
  const attemptIds: string[] = [];

  await mockRecording(page);
  await setupPracticePage(page, token);
  await mockQuota(page, { token });
  await routeApi(page, '**/api/exercises/practice', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 1201,
      question: 'Wat maacht Dir gär de Weekend?',
      questionTranslation: 'What do you like doing at the weekend?',
      audio: 'AAAA',
    }),
  });
  await routeApi(page, '**/api/exercises/recording**', {
    method: 'POST',
    response: apiSuccess({
      transcript: 'Ech gi gär spadséieren.',
      score: 4,
      feedback: 'Good answer.',
      corrections: [],
    }),
    onRequest: (request) => {
      attemptIds.push(new URL(request.url()).searchParams.get('attemptId') ?? '');
    },
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();

  await expect(page.getByText('Good answer.')).toBeVisible();
  expect(attemptIds).toEqual(['1201']);
});

test('Image Description evaluation sends the generated attemptId', async ({
  page,
}) => {
  const token = 'image-attempt-jwt';
  const attemptIds: string[] = [];

  await mockRecording(page);
  await setupPracticePage(page, token);
  await mockQuota(page, { token });
  await routeApi(page, '**/api/exercises/generate-image', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 2302,
      image: 'iVBORw0KGgo=',
      imageDescription: 'A family is eating at a table.',
    }),
  });
  await routeApi(page, '**/api/exercises/image-description/recording**', {
    method: 'POST',
    response: apiSuccess({
      transcript: 'Eng Famill ësst um Dësch.',
      score: 5,
      feedback: 'Clear description.',
      corrections: [],
    }),
    onRequest: (request) => {
      attemptIds.push(new URL(request.url()).searchParams.get('attemptId') ?? '');
    },
  });

  await page.goto('/app/image-description');
  await page.getByRole('button', { name: /Generate image/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();

  await expect(page.getByText('Clear description.')).toBeVisible();
  expect(attemptIds).toEqual(['2302']);
});

test('already evaluated recordings show a clear non-retryable message', async ({
  page,
}) => {
  const token = 'speaking-evaluated-jwt';

  await mockRecording(page);
  await setupPracticePage(page, token);
  await mockQuota(page, { token });
  await routeApi(page, '**/api/exercises/practice', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 1202,
      question: 'Wéi geet et?',
      questionTranslation: 'How are you?',
      audio: 'AAAA',
    }),
  });
  await routeApi(page, '**/api/exercises/recording**', {
    method: 'POST',
    status: 409,
    response: apiFailure('Exercise attempt has already been evaluated.'),
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();

  await expect(
    page.getByText(
      'This answer has already been evaluated. Generate a new exercise to try again.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /Send recording again/ })).toHaveCount(0);
});

test('429 refreshes Speaking quota without blocking Listening', async ({ page }) => {
  const token = 'speaking-quota-jwt';
  let quotaRequests = 0;

  await setupPracticePage(page, token);
  await page.route('**/api/users/me/ai-quota', async (route) => {
    quotaRequests += 1;
    await fulfillJson(
      route,
      apiSuccess(
        quota(quotaRequests === 1 ? {} : { exhausted: 'SPEAKING' }),
        'Quota loaded',
      ),
    );
  });
  await routeApi(page, '**/api/exercises/practice', {
    method: 'POST',
    status: 429,
    response: apiFailure('Speaking weekly limit reached.'),
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();

  await expect(page.getByText('Speaking weekly limit reached.')).toBeVisible();
  await expect(page.getByRole('button', { name: /Generate prompt/ })).toBeDisabled();
  await expect(page.getByRole('link', { name: 'Upgrade to Premium' })).toBeVisible();
  expect(quotaRequests).toBeGreaterThanOrEqual(2);

  await page.goto('/app/listening');
  await expect(
    page.getByRole('button', { name: /Generate listening exercise/ }),
  ).toBeEnabled();
});
