import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './user_journeys',
  testMatch: '**/*.journey.ts',
  fullyParallel: true,
  retries: 1,
  workers: process.env.WORKERS ? parseInt(process.env.WORKERS) : 2,
  repeatEach: process.env.FILE_REPEATS ? parseInt(process.env.FILE_REPEATS) : 1,
  reporter: [['html', { open: 'never' }], ['list']],

  use: {
    baseURL: process.env.BASE_URL ?? 'http://localhost:8080',
    headless: true,
    trace: 'on-first-retry',
    // Give pages enough time to load — the demo app can be slow under load
    navigationTimeout: 30_000,
    actionTimeout: 15_000,
  },

  expect: {
    // Default is 5s which is too short for this demo app under load
    timeout: 10_000,
  },

  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
