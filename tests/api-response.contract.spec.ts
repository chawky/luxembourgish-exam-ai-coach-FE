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
  responseUser,
  seedAuthenticatedSession,
  testUser,
} from './fixtures/auth.fixture';
import { mockQuota } from './fixtures/quota.fixture';

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

test('successful login envelope without JWT is rejected', async ({ page }) => {
  const user = testUser();

  const loginCalls = await routeApi(page, '**/api/users/login', {
    method: 'POST',
    response: apiSuccess(responseUser(user), 'Signed in'),
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'Login response did not include a token.',
  );
  await expectStoredToken(page, null);
  expectNoRouteErrors(loginCalls);
});

test('missing dashboard data is shown as a page-level error', async ({ page }) => {
  const user = testUser();
  const jwt = 'dashboard-contract-jwt';

  const currentUser = await seedAuthenticatedSession(page, user, jwt);
  const quotaStatus = await mockQuota(page, { token: jwt });

  const progressCalls = await routeApi(page, '**/api/progress/me', {
    method: 'GET',
    response: apiSuccess(null, 'Progress loaded'),
  });

  await page.goto('/app/dashboard');

  await expect(page.getByRole('alert')).toHaveText(
    'Dashboard response did not include progress data.',
  );
  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(progressCalls);
});

test('auth interceptor normalizes stored bearer token prefix', async ({ page }) => {
  const user = testUser();
  const jwt = 'prefixed-token';
  const authHeaders: string[] = [];

  await page.addInitScript(
    ({ key, value }) => {
      window.localStorage.setItem(key, value);
    },
    { key: authTokenStorageKey, value: `Bearer ${jwt}` },
  );

  const meCalls = await routeApi(page, '**/api/users/me', {
    method: 'GET',
    response: apiSuccess(responseUser(user), 'User loaded'),
  });
  const quotaStatus = await mockQuota(page, { token: jwt });
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
  expect(authHeaders).toContain(`Bearer ${jwt}`);
  expectNoRouteErrors(meCalls);
  expectNoRouteErrors(quotaStatus.calls);
  expectNoRouteErrors(progressCalls);
});
