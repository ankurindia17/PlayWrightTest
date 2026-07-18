import { LoginPageSauceDemo } from '../pages/login.page';
import { test as authTest, expect as authExpect } from './authFixture';

export const test = authTest.extend({
  authPage: async ({ page }, use) => {
    const loginPage = new LoginPageSauceDemo(page);
    await page.goto('https://www.saucedemo.com/inventory.html');
    await loginPage.verifyLoginSuccess();
    await use(loginPage);
  },
});

export const expect = authExpect;