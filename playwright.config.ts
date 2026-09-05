import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',

  // Tests can run in parallel.
  fullyParallel: true,

  // Prevent accidental test.only on CI.
  forbidOnly: !!process.env.CI,

  // Retry failed tests only on CI.
  retries: process.env.CI ? 2 : 0,

  workers: process.env.CI ? 1 : undefined,

  reporter: [['list'], ['html']],

  use: {
    // Angular application.
    baseURL: 'http://localhost:4200',

    // Save trace when a test fails and is retried.
    trace: 'on-first-retry',

    // Screenshot only when a test fails.
    screenshot: 'only-on-failure',

    // Keep video only when a test fails.
    video: 'retain-on-failure',
  },

  projects: [
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
      },
    },
  ],

  // Start Angular automatically when Playwright runs.
  webServer: {
    command: 'npm start',
    url: 'http://localhost:4200',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
