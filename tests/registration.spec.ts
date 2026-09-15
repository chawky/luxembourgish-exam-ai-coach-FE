import { test, expect } from '@playwright/test';
import { apiSuccess, expectNoRouteErrors, routeApi } from './fixtures/api.fixture';
import { expectStoredToken, responseUser, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';
import { mockQuota } from './fixtures/quota.fixture';

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function mockGoogleSignIn(
  page: import('@playwright/test').Page,
  credential = 'google-signup-id-token',
): Promise<void> {
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
                button.textContent = 'Sign up with Google';
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

test('registers with required account details and redirects to OTP', async ({ page }) => {
  const user = {
    ...testUser(),
    email: `playwright.${Date.now()}@example.com`,
  };
  let registrationPayload: Record<string, unknown> | undefined;

  const registrationCalls = await routeApi(page, '**/api/users/addUser', {
    method: 'POST',
    response: apiSuccess(null, 'Account created'),
    onRequest: async (request) => {
      registrationPayload = request.postDataJSON() as Record<string, unknown>;
      await delay(150);
    },
  });

  await page.goto('/signup');

  await expect(page).toHaveURL(/\/signup$/);
  await expect(
    page.getByRole('heading', { name: 'Create your account' }),
  ).toBeVisible();

  await page.getByLabel('First name').fill(user.firstName);
  await page.getByLabel('Last name').fill(user.lastName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);

  const signupNavigation = page.waitForURL(
    (url) =>
      url.pathname === '/otp' && url.searchParams.get('email') === user.email,
  );
  const createAccountButton = page.locator('form button[type="submit"]');

  await createAccountButton.click();
  await expect(createAccountButton).toHaveText('Creating account...');
  await signupNavigation;

  expect(registrationPayload).toMatchObject({
    username: 'Playwright Tester',
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    password: user.password,
  });
  expect(registrationPayload).not.toHaveProperty('confirm');
  expectNoRouteErrors(registrationCalls);
});

test('signs up with Google and opens dashboard', async ({ page }) => {
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
  const dashboardProgress = await mockDashboardProgress(page, user);
  const quotaStatus = await mockQuota(page);

  await page.goto('/signup');
  await page.getByRole('button', { name: 'Sign up with Google' }).click();

  await expect(page).toHaveURL(/\/app\/dashboard$/);
  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  expect(googlePayload).toEqual({ idToken: 'google-signup-id-token' });
  expectNoRouteErrors(googleLoginCalls);
  expectNoRouteErrors(dashboardProgress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});

test('verifies OTP, logs in, and opens dashboard', async ({ page }) => {
  const user = {
    ...testUser(),
    email: `verified.${Date.now()}@example.com`,
  };
  const otp = '123456';
  let sendOtpPayload: Record<string, unknown> | undefined;
  let resendOtpPayload: Record<string, unknown> | undefined;
  let verifyOtpPayload: Record<string, unknown> | undefined;
  let loginPayload: Record<string, unknown> | undefined;

  const sendOtpCalls = await routeApi(page, '**/api/users/sendOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Verification code sent'),
    onRequest: (request) => {
      sendOtpPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });

  const resendOtpCalls = await routeApi(page, '**/api/users/resendOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Verification code resent'),
    onRequest: async (request) => {
      resendOtpPayload = request.postDataJSON() as Record<string, unknown>;
      await delay(150);
    },
  });

  const verifyOtpCalls = await routeApi(page, '**/api/users/verifyOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Account verified'),
    onRequest: async (request) => {
      verifyOtpPayload = request.postDataJSON() as Record<string, unknown>;
      await delay(150);
    },
  });

  const loginCalls = await routeApi(page, '**/api/users/login', {
    method: 'POST',
    response: apiSuccess(responseUser(user), 'Signed in'),
    onRequest: async (request) => {
      loginPayload = request.postDataJSON() as Record<string, unknown>;
      await delay(150);
    },
  });

  const dashboardProgress = await mockDashboardProgress(page, user);
  const quotaStatus = await mockQuota(page);

  await page.goto(`/otp?email=${encodeURIComponent(user.email)}`);

  await expect(page.getByRole('heading', { name: 'Verify your email' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Verification code sent');
  await expect(page.getByLabel('Email')).toHaveValue(user.email);
  expect(sendOtpPayload).toEqual({ email: user.email });

  const resendButton = page.getByRole('button', { name: 'Resend code' });
  await resendButton.click();
  await expect(page.getByRole('button', { name: 'Sending code...' })).toBeVisible();
  await expect(page.getByRole('status')).toHaveText('Verification code resent');
  expect(resendOtpPayload).toEqual({ email: user.email });

  await page.getByLabel('One-time password').fill(otp);

  const otpNavigation = page.waitForURL(/\/login$/);
  await page.getByRole('button', { name: 'Verify account' }).click();
  await expect(page.getByRole('button', { name: 'Verifying...' })).toBeVisible();
  await otpNavigation;

  expect(verifyOtpPayload).toEqual({
    email: user.email,
    otp: Number(otp),
  });

  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password').fill(user.password);

  const loginNavigation = page.waitForURL(/\/app\/dashboard$/);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Signing in...' })).toBeVisible();
  await loginNavigation;

  await expect(page.getByRole('heading', { name: 'Moien, Playwright' })).toBeVisible();
  await expect(page.getByText('2 days')).toBeVisible();
  await expect(
    page.locator('.stat').filter({ hasText: 'Total activities' }).getByText('7', {
      exact: true,
    }),
  ).toBeVisible();
  await expect(page.getByText('Continue practising')).toBeVisible();

  expect(loginPayload).toEqual({
    email: user.email,
    password: user.password,
  });
  await expectStoredToken(page, null);
  expectNoRouteErrors(sendOtpCalls);
  expectNoRouteErrors(resendOtpCalls);
  expectNoRouteErrors(verifyOtpCalls);
  expectNoRouteErrors(loginCalls);
  expectNoRouteErrors(dashboardProgress.calls);
  expectNoRouteErrors(quotaStatus.calls);
});
