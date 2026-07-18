import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Method Description: Loads environment variables from a .env file into process.env.
// Provides a centralized configuration manager to access environment-specific settings and secrets.
// Variable Description: envFilePath - The path to the .env file in the current working directory.

const envFilePath = path.resolve(process.cwd(), '.env');

function loadEnvFile(): void {
  if (!fs.existsSync(envFilePath)) {
    return;
  }

  const fileBuffer = fs.readFileSync(envFilePath);
  let fileContent = '';

  if (fileBuffer.subarray(0, 3).equals(Buffer.from([0xef, 0xbb, 0xbf]))) {
    fileContent = fileBuffer.toString('utf8');
  } else if (fileBuffer.subarray(0, 2).equals(Buffer.from([0xff, 0xfe])) || fileBuffer.subarray(0, 2).equals(Buffer.from([0xfe, 0xff]))) {
    fileContent = fileBuffer.toString('utf16le');
  } else {
    fileContent = fileBuffer.toString('utf8');
  }

  const normalizedContent = fileContent.replace(/\r\n/g, '\n').replace(/\uFEFF/g, '');
  const parsedEnv = dotenv.parse(normalizedContent);

  Object.entries(parsedEnv).forEach(([key, value]) => {
    if (!process.env[key]) {
      process.env[key] = value;
    }
  });
}

loadEnvFile();

export class ConfigManager {
  private static readonly defaultEnvironment = 'QA';

  /**
   * Helper to get the current target environment prefix (e.g., "QA_" or "STAGING_")
   */
  private static getEnvPrefix(): string {
    const environment = this.getEnvironmentName();
    return environment ? `${environment.toUpperCase()}_` : '';
  }

  private static getEnvironmentName(): string {
    return (process.env.ENV || process.env.PLAYWRIGHT_ENV || process.env.NODE_ENV || this.defaultEnvironment)
      .toString()
      .trim();
  }

  /**
   * Dynamically reads the value from process.env using the current environment prefix,
   * while falling back to the unprefixed key if needed.
   */
  private static get(key: string, fallback?: string): string {
    const candidates = [`${this.getEnvPrefix()}${key}`, key];

    for (const candidate of candidates) {
      const value = process.env[candidate]?.trim();
      if (value) {
        return value;
      }
    }

    if (fallback !== undefined) {
      return fallback;
    }

    throw new Error(`Configuration property "${key}" is missing in your .env file.`);
  }

  public static get environment(): string {
    return this.getEnvironmentName().toLowerCase();
  }

  public static get baseUrl(): string {
    return this.get('BASE_URL', 'https://www.saucedemo.com');
  }

  public static get apiUrl(): string {
    return this.get('API_URL', '');
  }

  public static get timeout(): number {
    return this.getNumber('TIMEOUT', 30000);
  }

  public static getNumber(key: string, fallback?: number): number {
    const rawValue = this.get(key, fallback?.toString());
    const parsedValue = Number.parseInt(rawValue, 10);

    if (Number.isNaN(parsedValue)) {
      throw new Error(`Configuration property "${key}" must be numeric.`);
    }

    return parsedValue;
  }

  public static getBoolean(key: string, fallback?: boolean): boolean {
    const rawValue = this.get(key, fallback?.toString());
    const normalizedValue = rawValue.toLowerCase();

    if (['true', '1', 'yes', 'y'].includes(normalizedValue)) {
      return true;
    }

    if (['false', '0', 'no', 'n'].includes(normalizedValue)) {
      return false;
    }

    throw new Error(`Configuration property "${key}" must be a boolean value.`);
  }

  /**
   * Use this method for global secrets that do NOT change per environment
   * (e.g., a shared CI token or local debug flag)
   */
  public static getSecret(key: string): string {
    const value = process.env[key]?.trim();
    if (!value) {
      throw new Error(`Global secret/environment variable "${key}" is missing.`);
    }
    return value;
  }
}

/*
How this works behind the scenes
When you run npm run test:staging, cross-env sets process.env.ENV to "staging".
ConfigManager then resolves the environment prefix as "STAGING_" and looks for values such as:
- STAGING_BASE_URL
- STAGING_TIMEOUT

If those are not present, it falls back to the unprefixed keys such as:
- BASE_URL
- TIMEOUT

This makes the manager work for both environment-specific and shared settings.
*/

/* Example package.json scripts:
  "scripts": {
    "test:qa": "cross-env ENV=qa npx playwright test",
    "test:staging": "cross-env ENV=staging npx playwright test"
  }
*/

/* Example .env values:
  BASE_URL=https://default.example.com
  TIMEOUT=30000

  QA_BASE_URL=https://qa.example.com
  QA_TIMEOUT=45000

  STAGING_BASE_URL=https://staging.example.com
  STAGING_TIMEOUT=60000
*/

/*
import { test, expect } from '@playwright/test';
import { ConfigManager } from '../utils/ConfigManager';

test('Verify user can log in', async ({ page }) => {
  // Playwright baseURL is already configured from ConfigManager.baseUrl in playwright.config.ts
  await page.goto('/');

  // Fetch secrets securely injected from terminal or CI pipeline
  const password = ConfigManager.getSecret('APP_PASSWORD');

  await page.getByLabel('Username').fill('test_user');
  await page.getByLabel('Password').fill(password);
  await page.getByRole('button', { name: 'Log in' }).click();

  await expect(page).toHaveURL(/dashboard/);
});
*/