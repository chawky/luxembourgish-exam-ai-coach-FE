import { type Page, type Request } from '@playwright/test';
import { apiSuccess, routeApi } from './api.fixture';

export function practiceConfig(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    levels: [
      {
        code: 'A1',
        label: 'A1',
        description: 'Beginner',
      },
      {
        code: 'A2',
        label: 'A2',
        description: 'Elementary',
      },
      {
        code: 'B1',
        label: 'B1',
        description: 'Intermediate',
      },
    ],
    topics: [
      {
        code: 'DAILY_ROUTINE',
        label: 'Daily Routine',
        levelCode: 'A1',
      },
      {
        code: 'SHOPPING',
        label: 'Shopping',
        levelCode: 'A1',
      },
      {
        code: 'WORK',
        label: 'Work',
        levelCode: 'A2',
      },
      {
        code: 'CULTURE',
        label: 'Culture',
        levelCode: 'B1',
      },
    ],
    exerciseTypes: [
      {
        code: 'TRANSLATION',
        label: 'Translation',
      },
      {
        code: 'MULTIPLE_CHOICE',
        label: 'Multiple Choice',
      },
      {
        code: 'FILL_IN_THE_BLANK',
        label: 'Fill In The Blank',
      },
      {
        code: 'SHORT_ANSWER',
        label: 'Short Answer',
      },
    ],
    ...overrides,
  };
}

export async function mockPracticeConfig(
  page: Page,
  options: {
    data?: Record<string, unknown>;
    onRequest?: (request: Request) => void | Promise<void>;
  } = {},
) {
  return routeApi(page, '**/api/exercise-config', {
    method: 'GET',
    response: apiSuccess(options.data ?? practiceConfig(), 'Practice options loaded'),
    onRequest: options.onRequest,
  });
}
