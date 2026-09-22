import { test, expect, type Page, type Route } from '@playwright/test';
import { apiFailure, apiSuccess, fulfillJson, expectNoRouteErrors, routeApi } from './fixtures/api.fixture';
import { seedAuthenticatedSession, testUser } from './fixtures/auth.fixture';
import { mockDashboardProgress } from './fixtures/dashboard.fixture';

interface AdminAiUsageDashboardSummary {
  models: Array<{
    provider: string;
    model: string;
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  }>;
  totals: {
    requests: number;
    inputTokens: number;
    outputTokens: number;
    totalTokens: number;
    estimatedCostUsd: number;
  };
}

test('admin AI usage summary loads totals and model rows', async ({ page }) => {
  const summary: AdminAiUsageDashboardSummary = {
    models: [
      {
        provider: 'kimi',
        model: 'moonshotai/kimi-k3',
        requests: 42,
        inputTokens: 12000,
        outputTokens: 3000,
        totalTokens: 15000,
        estimatedCostUsd: 0.123456,
      },
      {
        provider: 'openrouter',
        model: 'shared-model',
        requests: 80,
        inputTokens: 1000,
        outputTokens: 500,
        totalTokens: 1500,
        estimatedCostUsd: 0,
      },
      {
        provider: 'kimi',
        model: 'shared-model',
        requests: 2,
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        estimatedCostUsd: 0.000001,
      },
      {
        provider: 'elevenlabs',
        model: 'eleven_multilingual_v2',
        requests: 20,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0.0321,
      },
    ],
    totals: {
      requests: 144,
      inputTokens: 13010,
      outputTokens: 3505,
      totalTokens: 16515,
      estimatedCostUsd: 1.234567,
    },
  };

  await setupAdminAiUsagePage(page, [summary]);

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'AI Usage' }).click();

  await expect(page.getByText('Total AI Cost')).toBeVisible();
  await expect(page.getByText('$1.234567')).toBeVisible();
  await expect(page.getByText('16,515')).toBeVisible();
  await expect(page.getByText('144')).toBeVisible();

  await expect(page.getByRole('row', { name: /Kimi moonshotai\/kimi-k3 42 12,000 3,000 15,000 \$0.123456/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /OpenRouter shared-model 80 1,000 500 1,500 \$0.000000/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /Kimi shared-model 2 10 5 15 \$0.000001/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /ElevenLabs eleven_multilingual_v2 20 0 0 0 \$0.032100/ })).toBeVisible();
});

test('admin AI usage refresh reloads backend totals', async ({ page }) => {
  await setupAdminAiUsagePage(page, [
    {
      models: [],
      totals: {
        requests: 1,
        inputTokens: 10,
        outputTokens: 5,
        totalTokens: 15,
        estimatedCostUsd: 0.000001,
      },
    },
    {
      models: [],
      totals: {
        requests: 2,
        inputTokens: 20,
        outputTokens: 10,
        totalTokens: 30,
        estimatedCostUsd: 0.000002,
      },
    },
  ]);

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'AI Usage' }).click();

  await expect(page.getByText('$0.000001')).toBeVisible();
  await page.getByRole('button', { name: 'Refresh summary' }).click();
  await expect(page.getByText('$0.000002')).toBeVisible();
  await expect(page.getByText('30')).toBeVisible();
  await expect(
    page.locator('.stat-card').filter({ hasText: 'Total Requests' }).getByText('2', {
      exact: true,
    }),
  ).toBeVisible();
});

test('admin AI usage summary handles empty and error states', async ({ page }) => {
  await setupAdminAiUsagePage(page, [
    {
      models: [],
      totals: {
        requests: 0,
        inputTokens: 0,
        outputTokens: 0,
        totalTokens: 0,
        estimatedCostUsd: 0,
      },
    },
  ]);

  await page.goto('/app/admin');
  await page.getByRole('button', { name: 'AI Usage' }).click();

  await expect(page.getByText('No AI usage recorded yet.')).toBeVisible();
  await expect(page.getByText('$0.000000')).toBeVisible();

  await page.unroute('**/api/admin/ai-usage/summary');
  await page.route('**/api/admin/ai-usage/summary', async (route) => {
    await fulfillJson(route, apiFailure('Could not load AI usage summary.'), 500);
  });

  await page.getByRole('button', { name: 'Refresh summary' }).click();

  await expect(page.getByRole('alert')).toHaveText('Could not load AI usage summary.');
  await expect(page.getByText('No AI usage recorded yet.')).toBeVisible();
});

async function setupAdminAiUsagePage(
  page: Page,
  summaries: AdminAiUsageDashboardSummary[],
): Promise<void> {
  const admin = testUser({ roles: ['ADMIN'] });
  const currentUser = await seedAuthenticatedSession(page, admin);
  const progress = await mockDashboardProgress(page, admin);
  let summaryIndex = 0;

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
  await routeApi(page, '**/api/admin/support-emails', {
    method: 'GET',
    response: apiSuccess([]),
  });
  await page.route('**/api/admin/ai-usage/summary', async (route: Route) => {
    const summary = summaries[Math.min(summaryIndex, summaries.length - 1)];
    summaryIndex += 1;
    await fulfillJson(route, apiSuccess(summary));
  });

  expectNoRouteErrors(currentUser.calls);
  expectNoRouteErrors(progress.calls);
}
