import { test, expect } from '@playwright/test';
import {
  apiFailure,
  apiSuccess,
  expectNoRouteErrors,
  routeApi,
} from './fixtures/api.fixture';
import { testUser } from './fixtures/auth.fixture';

async function fillSignupForm(
  page: import('@playwright/test').Page,
  user = testUser(),
): Promise<void> {
  await page.getByLabel('First name').fill(user.firstName);
  await page.getByLabel('Last name').fill(user.lastName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill(user.password);
}

test('signup validation blocks incomplete form submission', async ({ page }) => {
  let registrationCalls = 0;

  await page.route('**/api/users/addUser', async (route) => {
    registrationCalls += 1;
    await route.abort();
  });

  await page.goto('/signup');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Please enter your first name.')).toBeVisible();
  await expect(page.getByText('Please enter your last name.')).toBeVisible();
  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Use at least 8 characters.')).toBeVisible();
  expect(registrationCalls).toBe(0);
});

test('signup validation catches password mismatch and invalid postal code', async ({
  page,
}) => {
  let registrationCalls = 0;
  const user = testUser();

  await page.route('**/api/users/addUser', async (route) => {
    registrationCalls += 1;
    await route.abort();
  });

  await page.goto('/signup');
  await page.getByLabel('First name').fill(user.firstName);
  await page.getByLabel('Last name').fill(user.lastName);
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('Postal code').fill('abc');
  await page.getByLabel('Password', { exact: true }).fill(user.password);
  await page.getByLabel('Confirm password').fill('different-password');
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByText('Use a 4-digit postal code.')).toBeVisible();
  await expect(page.getByText('Passwords do not match.')).toBeVisible();
  expect(registrationCalls).toBe(0);
});

test('signup API failure displays the backend message without redirecting', async ({
  page,
}) => {
  const user = testUser();

  const registrationCalls = await routeApi(page, '**/api/users/addUser', {
    method: 'POST',
    response: apiFailure('An account with this email already exists.'),
  });

  await page.goto('/signup');
  await fillSignupForm(page, user);
  await page.getByRole('button', { name: 'Create account' }).click();

  await expect(page.getByRole('alert')).toHaveText(
    'An account with this email already exists.',
  );
  await expect(page).toHaveURL(/\/signup$/);
  await expect(page.getByRole('button', { name: 'Create account' })).toBeEnabled();
  expectNoRouteErrors(registrationCalls);
});

test('OTP validation blocks invalid code submission', async ({ page }) => {
  let verifyCalls = 0;
  const user = testUser();

  await page.route('**/api/users/verifyOtp', async (route) => {
    verifyCalls += 1;
    await route.abort();
  });

  await page.goto('/otp');
  await page.getByLabel('Email').fill(user.email);
  await page.getByLabel('One-time password').fill('12ab');
  await page.getByRole('button', { name: 'Verify account' }).click();

  await expect(page.getByText('Enter the 6-digit code.')).toBeVisible();
  expect(verifyCalls).toBe(0);
});

test('OTP verification failure stays on OTP page', async ({ page }) => {
  const user = testUser();

  const sendOtpCalls = await routeApi(page, '**/api/users/sendOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Verification code sent'),
  });
  const verifyOtpCalls = await routeApi(page, '**/api/users/verifyOtp', {
    method: 'POST',
    response: apiFailure('Invalid verification code.'),
  });

  await page.goto(`/otp?email=${encodeURIComponent(user.email)}`);
  await page.getByLabel('One-time password').fill('123456');
  await page.getByRole('button', { name: 'Verify account' }).click();

  await expect(page.getByRole('alert')).toHaveText('Invalid verification code.');
  await expect(page).toHaveURL(
    (url) => url.pathname === '/otp' && url.searchParams.get('email') === user.email,
  );
  await expect(page.getByRole('button', { name: 'Verify account' })).toBeEnabled();
  expectNoRouteErrors(sendOtpCalls);
  expectNoRouteErrors(verifyOtpCalls);
});

test('resend OTP sends the current email and shows status', async ({ page }) => {
  const user = testUser();
  let resendPayload: Record<string, unknown> | undefined;

  const resendCalls = await routeApi(page, '**/api/users/resendOtp', {
    method: 'POST',
    response: apiSuccess(null, 'Verification code resent'),
    onRequest: (request) => {
      resendPayload = request.postDataJSON() as Record<string, unknown>;
    },
  });

  await page.goto('/otp');
  await page.getByLabel('Email').fill(user.email);
  await page.getByRole('button', { name: 'Resend code' }).click();

  expect(resendPayload).toEqual({ email: user.email });
  await expect(page.getByRole('status')).toHaveText('Verification code resent');
  expectNoRouteErrors(resendCalls);
});

test('login validation blocks invalid credentials before request', async ({ page }) => {
  let loginCalls = 0;

  await page.route('**/api/users/login', async (route) => {
    loginCalls += 1;
    await route.abort();
  });

  await page.goto('/login');
  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Password').fill('');
  await page.getByRole('button', { name: 'Sign in' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Password is required.')).toBeVisible();
  expect(loginCalls).toBe(0);
});
