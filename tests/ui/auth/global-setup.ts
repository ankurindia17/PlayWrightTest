import { BrowserType, chromium } from '@playwright/test';
import fs from 'fs';
import path from 'path';
import { LoginPageSauceDemo } from '../pages/login.page';
import { EncryptionUtil } from '../../../src/utils/EncryptionUtil';
import { readCSV } from '../../../src/utils/CsvReader';


const authDir = path.join(process.cwd(), 'auth');

interface LoginData {
  username: string;
  password: string;
  [key: string]: string;
}

const testData = readCSV<LoginData>('./test-data/loginDataSecret.csv');

const users = [
  { username: 'standard_user', file: 'standard_user.json' }
];

const browsers = [
  { name: 'chromium', type: chromium }
];

const encryptedPasswordMap: Record<string, string> = {
  standard_user:''
};

async function generateEncryptedPasswords() {
  for (const data of testData) {
      console.log(`Generating encrypted password for ${data.username}`);
      console.log(`Encrypted password is ${data.password}`);
      encryptedPasswordMap[data.username] = data.password;
    if (!encryptedPasswordMap[data.username]) {
      throw new Error(`No encrypted password configured for "${data.username}"`);
    }
  }
}

async function createAuthState(
  browserType: BrowserType,
  username: string,
  destination: string
) {
  const browser = await browserType.launch({
  channel: 'chrome' 
});
  const context = await browser.newContext();
  const page = await context.newPage();

  const loginPage = new LoginPageSauceDemo(page);
  await loginPage.navigate();


  const encryptedPassword = encryptedPasswordMap[username];
  if (!encryptedPassword) {
    throw new Error(`No encrypted password configured for "${username}"`);
  }

  const password = EncryptionUtil.decryptPassword(encryptedPassword);

  console.log(`Logging in as ${username} with decrypted password: ${password}`);
  await loginPage.login(username, password);
  await loginPage.verifyLoginSuccess();
  await context.storageState({ path: destination });
  await browser.close();
}

async function globalSetup() {
  fs.mkdirSync(authDir, { recursive: true });

  await generateEncryptedPasswords();

  for (const browser of browsers) {
    for (const user of users) {
      const browserUserStateFile = path.join(authDir, `${browser.name}-${user.file}`);
      await createAuthState(browser.type, user.username, browserUserStateFile);

      if (browser.name === 'chromium' && user.username === 'standard_user') {
        const defaultAuthFile = path.join(authDir, 'user.json');
        fs.copyFileSync(browserUserStateFile, defaultAuthFile);
      }
    }
  }
}

export default globalSetup;