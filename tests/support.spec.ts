import { test, expect, type Page, type Request } from '@playwright/test';
import { apiFailure, apiSuccess } from './fixtures/api.fixture';
import { mockCurrentUser, responseUser, testUser } from './fixtures/auth.fixture';

const SUPPORT_ROUTE = /\/api\/support(?:\?.*)?$/;

async function mockLoggedOut(page: Page): Promise<void> {
  await page.route('**/api/users/me', async (route) => {
    await route.fulfill({
      status: 401,
      contentType: 'application/json',
      body: JSON.stringify(apiFailure('Please sign in.')),
    });
  });
}

async function routeSupport(
  page: Page,
  options: {
    status?: number;
    response?: unknown;
    onRequest?: (request: Request) => void | Promise<void>;
  } = {},
): Promise<Request[]> {
  const calls: Request[] = [];

  await page.route(SUPPORT_ROUTE, async (route) => {
    const request = route.request();
    calls.push(request);
    await options.onRequest?.(request);
    await route.fulfill({
      status: options.status ?? 200,
      contentType: 'application/json',
      body: JSON.stringify(
        options.response ??
          apiSuccess(null, 'Support request sent successfully.'),
      ),
    });
  });

  return calls;
}

function multipartBody(request: Request): string {
  return request.postDataBuffer()?.toString('latin1') ?? '';
}

test('support form validates required fields and invalid email', async ({ page }) => {
  await mockLoggedOut(page);
  const supportCalls = await routeSupport(page);

  await page.goto('/support');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  await expect(page.getByText('Subject is required and must be 160 characters or fewer.')).toBeVisible();
  await expect(page.getByText('Message is required and must be 4000 characters or fewer.')).toBeVisible();

  await page.getByLabel('Email').fill('not-an-email');
  await page.getByLabel('Subject').fill('Payment problem');
  await page.getByLabel('Message').fill('My subscription status looks wrong.');
  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByText('Enter a valid email address.')).toBeVisible();
  expect(supportCalls).toHaveLength(0);
});

test('support form validates attachments and allows removal', async ({ page }) => {
  await mockLoggedOut(page);
  await routeSupport(page);

  await page.goto('/support');
  const fileInput = page.locator('#supportAttachments');

  await fileInput.setInputFiles({
    name: 'notes.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not allowed'),
  });
  await expect(page.getByText('notes.txt is not a supported file type. Use PNG, JPG, WebP or PDF.')).toBeVisible();

  await fileInput.setInputFiles({
    name: 'large.pdf',
    mimeType: 'application/pdf',
    buffer: Buffer.alloc(5 * 1024 * 1024 + 1),
  });
  await expect(page.getByText('large.pdf exceeds the 5 MB limit.')).toBeVisible();

  await fileInput.setInputFiles([
    { name: 'one.png', mimeType: 'image/png', buffer: Buffer.from('1') },
    { name: 'two.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('2') },
    { name: 'three.webp', mimeType: 'image/webp', buffer: Buffer.from('3') },
    { name: 'four.pdf', mimeType: 'application/pdf', buffer: Buffer.from('4') },
  ]);

  await expect(page.getByText('You can attach up to 3 files.')).toBeVisible();
  await expect(page.getByText('one.png')).toBeVisible();
  await expect(page.getByText('two.jpg')).toBeVisible();
  await expect(page.getByText('three.webp')).toBeVisible();
  await expect(page.getByText('four.pdf')).toBeHidden();

  await page.getByRole('button', { name: 'Remove' }).first().click();
  await expect(page.getByText('one.png')).toBeHidden();
});

test('support form submits multipart FormData with attachments and shows success', async ({ page }) => {
  await mockLoggedOut(page);
  let contentType = '';
  let body = '';

  const supportCalls = await routeSupport(page, {
    onRequest: (request) => {
      contentType = request.headers()['content-type'] ?? '';
      body = multipartBody(request);
    },
  });

  await page.goto('/support');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Subject').fill('Subscription problem');
  await page.getByLabel('Message').fill('My subscription page is showing the wrong status.');
  await page.locator('#supportAttachments').setInputFiles({
    name: 'screenshot.png',
    mimeType: 'image/png',
    buffer: Buffer.from('fake image'),
  });

  await page.getByRole('button', { name: 'Send message' }).click();

  await expect(page.getByRole('status')).toHaveText(
    "Your message has been sent. We'll get back to you as soon as possible.",
  );
  expect(supportCalls).toHaveLength(1);
  expect(contentType).toContain('multipart/form-data; boundary=');
  const requestUrl = new URL(supportCalls[0].url());
  expect(Array.from(requestUrl.searchParams.entries())).toEqual([]);
  expect(body).toContain('name="email"');
  expect(body).toContain('user@example.com');
  expect(body).toContain('name="subject"');
  expect(body).toContain('Subscription problem');
  expect(body).toContain('name="message"');
  expect(body).toContain('My subscription page is showing the wrong status.');
  expect(body).toContain('name="attachments"; filename="screenshot.png"');
  await expect(page.getByLabel('Email')).toHaveValue('user@example.com');
  await expect(page.getByLabel('Subject')).toHaveValue('');
  await expect(page.getByLabel('Message')).toHaveValue('');
  await expect(page.getByText('screenshot.png')).toBeHidden();
});

test('support form shows API and rate-limit errors safely', async ({ page }) => {
  await mockLoggedOut(page);
  await routeSupport(page, {
    status: 500,
    response: apiFailure('Could not send support request right now.'),
  });

  await page.goto('/support');
  await page.getByLabel('Email').fill('user@example.com');
  await page.getByLabel('Subject').fill('Technical issue');
  await page.getByLabel('Message').fill('The page is not loading.');
  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('alert')).toHaveText('Could not send support request right now.');

  await page.unroute(SUPPORT_ROUTE);
  await routeSupport(page, {
    status: 429,
    response: {},
  });

  await page.getByRole('button', { name: 'Send message' }).click();
  await expect(page.getByRole('alert')).toHaveText('Too many requests. Please wait a moment and try again.');
});

test('support form prefills authenticated user email', async ({ page }) => {
  const user = testUser({ email: 'learner@example.com' });
  await mockCurrentUser(page, user, { requireAuth: false });
  await routeSupport(page, {
    response: apiSuccess(responseUser(user), 'User loaded'),
  });

  await page.goto('/support');

  await expect(page.getByLabel('Email')).toHaveValue('learner@example.com');
});

test('public nav section links work from support page', async ({ page }) => {
  await mockLoggedOut(page);

  await page.goto('/support');
  await page.getByRole('link', { name: 'Features' }).click();

  await expect(page).toHaveURL(/\/#features$/);
  await expect(page.getByRole('heading', { name: 'Practice tools for Luxembourgish learners' })).toBeVisible();
});
