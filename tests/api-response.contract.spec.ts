import { test, expect } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  expectNoRouteErrors,
  routeApi,
} from './fixtures/api.fixture';
import {
  authTokenStorageKey,
  expectStoredToken,
  mockCurrentUser,
  responseUser,
  testUser,
} from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockQuota } from './fixtures/quota.fixture';

async function mockGoogleSignIn(
  page: import('@playwright/test').Page,
  credential = 'google-id-token',
): Promise<void> {
  await page.addInitScript(() => {
    window.SPROOCHEN_GOOGLE_CLIENT_ID = 'test-google-client-id';
  });

  await page.route('https://accounts.google.com/gsi/client', async (route) => {
    await route.fulfill({
      contentType: 'application/javascript',
      body: `
        window.google = {
          accounts: {
            id: {
              initialize(config) {
                window.__googleCredentialCallback = config.callback;
              },
              renderButton(parent) {
                const button = document.createElement('button');
                button.type = 'button';
                button.textContent = 'Sign in with Google';
                button.addEventListener('click', () => {
                  window.__googleCredentialCallback({ credential: ${JSON.stringify(credential)} });
                });
                parent.appendChild(button);
              }
            }
          }
        };
      `,
    });
  });
}

test('failed login envelope shows API message and stores no token', async ({ page }) => {
  const user = testUser();

  const loginCalls = await routeApi(page, '**/api/users/login', {
    method: 'POST',
    response: apiFailure('Invalid email or password.'),
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Invalid email or password.');
  await expectStoredToken(page, null);
  expectNoRouteErrors(loginCalls);
});

test('google login posts ID token and opens dashboard', async ({ page }) => {
  const user = testUser();
  let googlePayload: Record<string, unknown> | undefined;

  await mockGoogleSignIn(page);
  const googleLoginCalls = await routeApi(page, '**/api/users/google-login', {
    method: 'POST',
    response: apiSuccess(responseUser(user), 'Google login successful'),
    onRequest: (request) => {
      googlePayload = request.postDataJSON() as Record<string, unknown>;
    },
  });
  const progressCalls = await mockDashboardProgress(page, user, {
    requireAuth: false,
  });
  const quotaStatus = await mockQuota(page, { requireAuth: false });

  await page.goto('/login');
  await page.getByRole('button', { name: 'Sign in with Google' }).click();

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  expect(googlePayload).toEqual({ idToken: 'google-id-token' });
  expectNoRouteErrors(googleLoginCalls);
  expectNoRouteErrors(progressCalls.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('unverified login redirects to OTP with typed email', async ({ page }) => {
  const user = testUser();

  const loginCalls = await routeApi(page, '**/api/users/login', {
    method: 'POST',
    status: 403,
    response: apiFailure('Email not verified. Please verify your email.'),
  });
  const sendOtpCalls = await routeApi(page, '**/api/users/sendOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Verification code sent'),
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);

  const otpNavigation = page.waitForURL(
    (url) =>
      url.pathname === '/otp' && url.searchParams.get('email') === user.email,
  );
  await page.getByRole('button', { name: 'Sign in' }).click();
  await otpNavigation;

  await expect(page.getByRole('alert')).toHaveText(
    'Please verify your email. Use Resend code if you need a new code.',
  );
  await expect(page.getByRole('status')).toHaveText('Verification code sent');
  await expect(page.getByLabel('Email')).toHaveValue(user.email);
  await expectStoredToken(page, null);
  expectNoRouteErrors(loginCalls);
  expectNoRouteErrors(sendOtpCalls);
});

test('raw text HTTP error is surfaced to the login form', async ({ page }) => {
  const user = testUser();

  await page.route('**/api/users/login', async (route) => {
    await route.fulfill({
      status: 500,
      contentType: 'text/plain',
      body: 'Backend unavailable',
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Backend unavailable');
  await expectStoredToken(page, null);
});

test('HTML login error falls back to a learner-safe message', async ({ page }) => {
  const user = testUser();

  await page.route('**/api/users/login', async (route) => {
    await route.fulfill({
      status: 404,
      contentType: 'text/html',
      body: '<!DOCTYPE html><html><body><pre>Cannot POST /api/users/login</pre></body></html>',
    });
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText('Could not sign in.');
  await expectStoredToken(page, null);
});

test('successful cookie login does not require JWT response body', async ({ page }) => {
  const user = testUser();

  const loginCalls = await routeApi(page, '**/api/users/login', {
    method: 'POST',
    response: apiSuccess(responseUser(user), 'Signed in'),
  });
  const progressCalls = await mockDashboardProgress(page, user, {
    requireAuth: false,
  });
  const quotaStatus = await mockQuota(page, { requireAuth: false });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  await expectStoredToken(page, null);
  expectNoRouteErrors(loginCalls);
  expectNoRouteErrors(progressCalls.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('missing dashboard data is shown as a page-level error', async ({ page }) => {
  const user = testUser();

  const currentUser = await mockCurrentUser(page, user, { requireAuth: false });
  const quotaStatus = await mockQuota(page, { requireAuth: false });

  const progressCalls = await routeApi(page, '**/api/progress/me', {
    method: 'GET',
    response: apiSuccess(null, 'Progress loaded'),
  });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('alert')).toHaveText(
    'We could not load your progress. Please try again.',
  );
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(progressCalls);
});

test('auth interceptor ignores legacy stored bearer token', async ({ page }) => {
  const user = testUser();
  const jwt = 'prefixed-token';
  const authHeaders: string[] = [];

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: authTokenStorageKey, value: `Bearer ${jwt}` },
  );

  const meCalls = await mockCurrentUser(page, user, { requireAuth: false });
  const quotaStatus = await mockQuota(page, { requireAuth: false });
  const progressCalls = await routeApi(page, '**/api/progress/me', {
    method: 'GET',
    response: apiSuccess(
      {
        userId: user.id,
        username: user.username,
        email: user.email,
        skillProgress: [],
      },
      'Progress loaded',
    ),
    onRequest: (request) => {
      authHeaders.push(request.headers().authorization ?? '');
    },
  });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  expect(meCalls.authHeaders).not.toContain(`Bearer ${jwt}`);
  expect(authHeaders).not.toContain(`Bearer ${jwt}`);
  expectNoRouteErrors(meCalls.calls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(progressCalls);
});
