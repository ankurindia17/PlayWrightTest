import { LoginPageSauceDemo } from '../pages/login.page';
import { test, expect } from '@playwright/test';

import { readExcel } from '../../../src/utils/ExcelReader';

export type LoginData = {
  username: string;
  password: string;
  run: string;
};

const loginData = readExcel<LoginData>('./test-data/LoginData.xlsx', 'Sheet1');

test.describe('Login Tests for excel reader', () => {

    for (const data of loginData) {

        test(`Login test for - ${data.username}`, async ({ page }) => {

            test.skip(data.run !== 'yes', 'Run Flag=NO');

            const loginPage = new LoginPageSauceDemo(page);

            await test.step('Go to login page', async () => {
                await loginPage.navigate();
            });

            await test.step('Perform Login', async () => {
                await loginPage.login(data.username, data.password);
            });

            await test.step('Verify Login', async () => {
                await loginPage.verifyLoginSuccess();
            });
        });
    }

});