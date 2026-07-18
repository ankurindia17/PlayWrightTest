import { defineConfig, devices } from '@playwright/test';
import { ConfigManager } from './src/utils/ConfigManager';
import path from 'path';

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
// import dotenv from 'dotenv';
// import path from 'path';
// dotenv.config({ path: path.resolve(__dirname, '.env') });

/**
 * See https://playwright.dev/docs/test-configuration.
 */

const authStateFile = path.join(__dirname, 'auth', 'user.json');
const chromiumAuthStateFile = path.join(__dirname, 'auth', 'chromium-standard_user.json');
const requestedWorkers = process.env.PW_WORKERS ? Number(process.env.PW_WORKERS) : undefined;

export default defineConfig({
  testDir: './tests',
  globalSetup: require.resolve('./tests/ui/auth/global-setup.ts'),
  /* Run tests in files in parallel */
  fullyParallel: true,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: requestedWorkers ?? (process.env.CI ? 4 : undefined),
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: [
    ['html', { outputFolder: 'reports/playwright-report', open: 'never' }],
    ['json', { outputFile: 'reports/results.json' }] ],
  //reporter: 'html',
  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('')`. */
    baseURL: ConfigManager.baseUrl,
    storageState: authStateFile,
    viewport: { width: 1280, height: 720 },
    ignoreHTTPSErrors: true,
    launchOptions: {
      slowMo: 1000,
    },
    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: 'on-first-retry',
    actionTimeout: ConfigManager.timeout,
    navigationTimeout: ConfigManager.timeout,
  },

  /* Configure projects for major browsers */
  projects: [
    // 1. Core Setup Project: This runs your global-setup.ts file as a test first
    {
      name: 'setup',
      testDir: './tests', // Ensures it looks inside your root tests folder
      testMatch: /ui\/auth\/global-setup\.ts/, // Matches the specific subfolder path
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome', // Uses your local Chrome app to bypass the network download issue
      }
    },
    {
      name: 'chromium',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        storageState: chromiumAuthStateFile,
      },
      dependencies: ['setup'],
    }
  ],
    

   

  /* Run your local dev server before starting the tests */
  // webServer: {
  //   command: 'npm run start',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: !process.env.CI,
  // },
});
