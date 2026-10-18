import { expect, test, type Page, type Request } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  fulfillJson,
  routeApi,
} from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockPracticeConfig, practiceConfig } from './fixtures/practice-config.fixture';
import { mockQuota, quota } from './fixtures/quota.fixture';

function multipartField(request: Request, name: string): string {
  const body = request.postDataBuffer()?.toString() ?? '';
  return body.split(`name="${name}"\r\n\r\n`)[1]?.split('\r\n')[0] ?? '';
}

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
      static recordings = 0;

      start(): void {
        FakeMediaRecorder.recordings += 1;
        this.state = 'recording';
      }

      stop(): void {
        this.state = 'inactive';
        const dataEvent = new Event('dataavailable');
        Object.defineProperty(dataEvent, 'data', {
          value: new Blob([`recording-${FakeMediaRecorder.recordings}`], { type: this.mimeType }),
        });
        setTimeout(() => {
          this.dispatchEvent(dataEvent);
          this.dispatchEvent(new Event('stop'));
        }, 0);
      }
    }

    Object.defineProperty(window, 'MediaRecorder', {
      configurable: true,
      value: FakeMediaRecorder,
    });
  });
}

test('successful Speaking evaluation cannot submit the same attemptId again', async ({ page }) => {
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
      attemptIds.push(multipartField(request, 'attemptId'));
    },
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();

  await expect(page.getByText('Good answer.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record new answer' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate new speaking prompt' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  await page.getByRole('button', { name: 'Start recording' }).dispatchEvent('click');
  await page.waitForTimeout(100);
  expect(attemptIds).toEqual(['1201']);
});

test('successful Image Description evaluation cannot submit the same attemptId again', async ({
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
      attemptIds.push(multipartField(request, 'attemptId'));
    },
  });

  await page.goto('/app/image-description');
  await page.getByRole('button', { name: /Generate image/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();

  await expect(page.getByText('Clear description.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Record new description' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Generate another image' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  await page.getByRole('button', { name: 'Start recording' }).dispatchEvent('click');
  await page.waitForTimeout(100);
  expect(attemptIds).toEqual(['2302']);
});

test('failed provider evaluation can resend the retained recording', async ({ page }) => {
  const token = 'speaking-retry-jwt';
  const attemptIds: string[] = [];

  await mockRecording(page);
  await setupPracticePage(page, token);
  await mockQuota(page, { token });
  await routeApi(page, '**/api/exercises/practice', {
    method: 'POST',
    response: apiSuccess({
      attemptId: 1203,
      question: 'Wéi geet et?',
      questionTranslation: 'How are you?',
      audio: 'AAAA',
    }),
  });
  await page.route('**/api/exercises/recording**', async (route) => {
    attemptIds.push(multipartField(route.request(), 'attemptId'));
    if (attemptIds.length === 1) {
      await fulfillJson(route, apiFailure('The evaluation provider is temporarily unavailable.'), 502);
      return;
    }

    await fulfillJson(
      route,
      apiSuccess({
        transcript: 'Et geet mir gutt.',
        score: 4,
        feedback: 'Retry worked.',
        corrections: [],
      }),
    );
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();

  await expect(page.getByRole('button', { name: 'Resend recording' })).toBeVisible();
  await page.getByRole('button', { name: 'Resend recording' }).click();
  await expect(page.getByText('Retry worked.')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resend recording' })).toHaveCount(0);
  expect(attemptIds).toEqual(['1203', '1203']);
});

test('backend rejection retains recording and leaves retry eligibility to the backend', async ({
  page,
}) => {
  const token = 'speaking-evaluated-jwt';
  let evaluationRequests = 0;

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
    response: apiFailure('Exercise attempt cannot be evaluated'),
    onRequest: () => {
      evaluationRequests += 1;
    },
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();

  await expect(
    page.getByText(
      'This recording cannot be evaluated right now. Try again or generate a new exercise.',
    ),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: 'Resend recording' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeDisabled();
  await page.getByRole('button', { name: 'Start recording' }).dispatchEvent('click');
  await page.waitForTimeout(100);
  expect(evaluationRequests).toBe(1);
});

test('a newly generated Speaking attempt can be evaluated normally', async ({ page }) => {
  const token = 'speaking-new-attempt-jwt';
  const generatedAttemptIds = [1204, 1205];
  const evaluatedAttemptIds: string[] = [];
  let generationRequests = 0;

  await mockRecording(page);
  await setupPracticePage(page, token);
  await mockQuota(page, { token });
  await page.route('**/api/exercises/practice', async (route) => {
    const attemptId = generatedAttemptIds[generationRequests];
    generationRequests += 1;
    await fulfillJson(
      route,
      apiSuccess({
        attemptId,
        question: `Speaking prompt ${attemptId}`,
        questionTranslation: `Translation ${attemptId}`,
        audio: 'AAAA',
      }),
    );
  });
  await page.route('**/api/exercises/recording**', async (route) => {
    const attemptId = multipartField(route.request(), 'attemptId');
    evaluatedAttemptIds.push(attemptId);
    await fulfillJson(
      route,
      apiSuccess({
        transcript: `Answer for ${attemptId}`,
        score: 5,
        feedback: `Evaluation for ${attemptId}`,
        corrections: [],
      }),
    );
  });

  await page.goto('/app/speaking');
  await page.getByRole('button', { name: /Generate prompt/ }).click();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();
  await expect(page.getByText('Evaluation for 1204')).toBeVisible();

  await page.getByRole('button', { name: 'Generate new speaking prompt' }).click();
  await expect.poll(() => generationRequests).toBe(2);
  await expect(page.getByRole('button', { name: 'Start recording' })).toBeEnabled();
  await page.getByRole('button', { name: 'Start recording' }).click();
  await page.getByRole('button', { name: 'Stop recording' }).click();
  await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
  await page.getByRole('button', { name: 'Submit recording' }).click();
  await expect(page.getByText('Evaluation for 1205')).toBeVisible();

  expect(generationRequests).toBe(2);
  expect(evaluatedAttemptIds).toEqual(['1204', '1205']);
});

for (const mode of ['speaking', 'image-description'] as const) {
  for (const premium of [false, true]) {
    test(`${mode}: review, discard and resend keep the attempt with ${premium ? 'nullable premium' : 'exhausted generation'} quota`, async ({ page }) => {
      await mockRecording(page);
      await setupPracticePage(page, 'review-jwt');
      await mockPracticeConfig(page, { data: practiceConfig({
        levels: [{ code: 'CUSTOM_LEVEL', label: 'Custom level' }],
        topics: [{ code: 'CUSTOM_TOPIC', label: 'Custom topic', levelCode: 'CUSTOM_LEVEL' }],
        exerciseTypes: [{ code: 'CUSTOM_FORMAT', label: 'Custom format' }],
      }) });
      let generations = 0;
      const requests: Request[] = [];
      const feature = mode === 'speaking' ? 'SPEAKING' : 'IMAGE_DESCRIPTION';
      const generationPath = mode === 'speaking' ? 'practice' : 'generate-image';
      const recordingPath = mode === 'speaking' ? 'recording' : 'image-description/recording';
      await page.route('**/api/users/me/ai-quota', route => fulfillJson(route, apiSuccess(
        premium ? quota({ tier: 'PREMIUM' }) : quota(generations ? { exhausted: feature } : {}),
      )));
      await page.route(`**/api/exercises/${generationPath}`, async route => {
        generations += 1;
        expect(route.request().postDataJSON()).toEqual({
          level: 'CUSTOM_LEVEL', topic: 'CUSTOM_TOPIC', type: 'CUSTOM_FORMAT',
        });
        await fulfillJson(route, apiSuccess({
          attemptId: 9876,
          question: 'A question',
          questionTranslation: 'English question',
          hint: 'A Luxembourgish hint',
          hintTranslation: 'An English hint',
          image: 'iVBORw0KGgo=',
          imageDescription: 'The original image description',
        }));
      });
      await page.route(`**/api/exercises/${recordingPath}`, async route => {
        requests.push(route.request());
        if (requests.length === 1) {
          await fulfillJson(route, apiFailure('Evaluation temporarily unavailable.'), 502);
        } else {
          await fulfillJson(route, apiSuccess({
            transcript: 'Retained answer', score: 85, feedback: 'Resend succeeded', corrections: [],
          }));
        }
      });
      await page.goto(`/app/${mode}`);
      const generate = page.getByRole('button', { name: mode === 'speaking' ? /Generate prompt/ : /Generate image/ });
      await generate.click();
      await expect(page.getByRole('button', { name: 'Start recording' })).toBeEnabled();
      if (!premium) await expect(generate).toBeDisabled();
      if (mode === 'speaking') await expect(page.getByText('An English hint', { exact: true })).toBeVisible();
      await page.getByRole('button', { name: 'Start recording' }).click();
      await page.getByRole('button', { name: 'Stop recording' }).click();
      await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Resend recording' })).toHaveCount(0);
      expect(requests).toHaveLength(0);
      await page.getByRole('button', { name: 'Record again', exact: true }).click();
      await expect(page.getByRole('button', { name: 'Stop recording' })).toBeEnabled();
      expect(requests).toHaveLength(0);
      expect(generations).toBe(1);
      await page.getByRole('button', { name: 'Stop recording' }).click();
      await expect(page.getByText('Recording ready', { exact: true })).toBeVisible();
      expect(requests).toHaveLength(0);
      await page.getByRole('button', { name: 'Submit recording' }).click();
      await expect(page.getByRole('button', { name: 'Resend recording' })).toBeVisible();
      await expect(page.getByRole('button', { name: 'Record again', exact: true })).toHaveCount(0);
      await expect(page.getByRole('button', { name: 'Submit recording' })).toHaveCount(0);
      await page.getByRole('button', { name: 'Resend recording' }).click();
      await expect(page.getByText('Resend succeeded')).toBeVisible();
      expect(requests).toHaveLength(2);
      for (const request of requests) {
        expect(multipartField(request, 'attemptId')).toBe('9876');
        expect(multipartField(request, 'durationSeconds')).toMatch(/^\d+$/);
        expect(request.postDataBuffer()?.toString()).toContain('recording-2');
        expect(request.postDataBuffer()?.toString()).not.toContain('recording-1');
        expect(request.headers()['content-type']).toContain('multipart/form-data');
        if (mode === 'image-description') {
          expect(multipartField(request, 'imageDescription')).toBe('The original image description');
        }
      }
      expect(generations).toBe(1);
    });
  }
}

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
