import { test, expect, type Page, type Route } from '@playwright/test';
import { apiFailure, apiSuccess, fulfillJson, expectNoRouteErrors, routeApi } from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';

interface SupportEmailListItem {
  id: number;
  fromEmail: string;
  subject: string;
  receivedAt: string;
  read: boolean;
}

interface SupportEmailDetail extends SupportEmailListItem {
  toEmail: string;
  textBody: string;
  htmlBody: string;
  attachments: Array<{
    id: number;
    filename: string;
    contentType: string;
    contentDisposition: string;
    contentId: string;
    sizeBytes: number;
  }>;
}

test('admin sync imports emails and refreshes selected attachment metadata', async ({
  page,
}) => {
  const oldEmail = supportEmail(101, 'Existing support email', []);
  const backfilledEmail = supportEmail(101, 'Existing support email', [
    {
      id: 501,
      filename: 'invoice.pdf',
      contentType: 'application/pdf',
      contentDisposition: 'attachment',
      contentId: 'cid-501',
      sizeBytes: 2048,
    },
  ]);
  const importedEmail = supportEmail(102, 'New imported email', []);
  let synced = false;

  await setupAdminSupportPage(page, {
    list: () => (synced ? [importedEmail, oldEmail] : [oldEmail]),
    detail: (id) => (synced && id === 101 ? backfilledEmail : id === 101 ? oldEmail : importedEmail),
    sync: async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 100));
      synced = true;
      await fulfillJson(
        route,
        apiSuccess(
          {
            imported: 1,
            existing: 1,
            ignored: 0,
            attachmentsAdded: 1,
            failed: 0,
          },
          'Support emails synchronized successfully',
        ),
      );
    },
  });

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'Support' }).click();
  await page.getByRole('button', { name: /Existing support email/ }).click();

  await expect(page.getByText('Attachments')).toHaveCount(0);

  await page.getByRole('button', { name: 'Sync emails' }).click();
  await expect(page.getByRole('button', { name: 'Syncing...' })).toBeDisabled();
  await expect(
    page.getByText('Sync complete — 1 email imported, 1 attachment added.'),
  ).toBeVisible();
  await expect(page.getByRole('button', { name: /New imported email/ })).toBeVisible();
  await expect(page.getByText('invoice.pdf')).toBeVisible();
});

test('admin sync reports zero-change and partial failure results', async ({ page }) => {
  const email = supportEmail(201, 'No changes email', []);
  let syncCount = 0;

  await setupAdminSupportPage(page, {
    list: () => [email],
    detail: () => email,
    sync: async (route) => {
      syncCount += 1;
      await fulfillJson(
        route,
        apiSuccess(
          syncCount === 1
            ? {
                imported: 0,
                existing: 1,
                ignored: 0,
                attachmentsAdded: 0,
                failed: 0,
              }
            : {
                imported: 1,
                existing: 0,
                ignored: 0,
                attachmentsAdded: 0,
                failed: 1,
              },
          'Support emails synchronized successfully',
        ),
      );
    },
  });

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'Support' }).click();
  await page.getByRole('button', { name: 'Sync emails' }).click();

  await expect(
    page.getByText('Sync complete — everything is up to date.'),
  ).toBeVisible();

  await page.getByRole('button', { name: 'Sync emails' }).click();

  await expect(
    page.getByText('Sync complete — 1 email imported. 1 email failed to sync.'),
  ).toBeVisible();
});

test('failed admin sync keeps the existing inbox visible', async ({ page }) => {
  const email = supportEmail(301, 'Still visible email', []);

  await setupAdminSupportPage(page, {
    list: () => [email],
    detail: () => email,
    sync: async (route) => {
      await fulfillJson(
        route,
        apiFailure('Could not sync support emails.'),
        502,
      );
    },
  });

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'Support' }).click();
  await page.getByRole('button', { name: 'Sync emails' }).click();

  await expect(page.getByRole('alert')).toHaveText('Could not sync support emails.');
  await expect(page.getByRole('button', { name: /Still visible email/ })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Sync emails' })).toBeEnabled();
});

async function setupAdminSupportPage(
  page: Page,
  options: {
    list: () => SupportEmailListItem[];
    detail: (id: number) => SupportEmailDetail;
    sync: (route: Route) => Promise<void>;
  },
): Promise<void> {
  const admin = testUser({ roles: ['ADMIN'] });
  const currentUser = await seedAuthenticatedSession(page, admin);
  const progress = await mockDashboardProgress(page, admin);

  await routeApi(page, '**/api/admin/users**', {
    method: 'GET',
    response: apiSuccess({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    }),
  });
  await routeApi(page, '**/api/admin/prompts', {
    method: 'GET',
    response: apiSuccess([]),
  });
  await routeApi(page, '**/api/admin/exercise-config', {
    method: 'GET',
    response: apiSuccess({ levels: [], topics: [], exerciseTypes: [] }),
  });
  await routeApi(page, '**/api/admin/audit-logs**', {
    method: 'GET',
    response: apiSuccess({
      items: [],
      page: 0,
      size: 20,
      totalItems: 0,
      totalPages: 0,
    }),
  });

  await page.route('**/api/admin/support-emails**', async (route) => {
    const request = route.request();
    const path = new URL(request.url()).pathname;

    if (request.method() === 'GET' && path === '/api/admin/support-emails') {
      await fulfillJson(route, apiSuccess(options.list()));
      return;
    }

    if (request.method() === 'POST' && path === '/api/admin/support-emails/sync') {
      await options.sync(route);
      return;
    }

    const detailMatch = path.match(/^\/api\/admin\/support-emails\/(\d+)$/);
    if (request.method() === 'GET' && detailMatch) {
      await fulfillJson(route, apiSuccess(options.detail(Number(detailMatch[1]))));
      return;
    }

    const readMatch = path.match(/^\/api\/admin\/support-emails\/(\d+)\/read$/);
    if (request.method() === 'PATCH' && readMatch) {
      await fulfillJson(route, apiSuccess({ ...options.detail(Number(readMatch[1])), read: true }));
      return;
    }

    throw new Error(`Unexpected support email request: ${request.method()} ${path}`);
  });

  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
}

function supportEmail(
  id: number,
  subject: string,
  attachments: SupportEmailDetail['attachments'],
): SupportEmailDetail {
  return {
    id,
    fromEmail: 'learner@example.com',
    toEmail: 'support@letz-speak.com',
    subject,
    textBody: 'Support message body',
    htmlBody: '<p>Support message body</p>',
    receivedAt: '2026-09-22T10:00:00',
    read: true,
    attachments,
  };
}
