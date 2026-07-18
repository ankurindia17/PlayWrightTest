import { Locator, Page, expect } from '@playwright/test';

export class CheckoutPageSauceDemo {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly firstNameField: Locator;
  readonly lastNameField: Locator;
  readonly postalCodeField: Locator;
  readonly continueButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('span.title[data-test="title"]');
    this.firstNameField = page.locator('input[data-test="firstName"]');
    this.lastNameField = page.locator('input[data-test="lastName"]');
    this.postalCodeField = page.locator('input[data-test="postalCode"]');
    this.continueButton = page.getByRole('button', { name: /continue/i });
  }

  async verifyCheckoutStepOnePage() {
    await expect(this.page).toHaveURL(/\/checkout-step-one\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Your Information');
  }

  async enterFirstName(value: string) {
    await this.firstNameField.fill(value);
  }

  async enterLastName(value: string) {
    await this.lastNameField.fill(value);
  }

  async enterPostalCode(value: string) {
    await this.postalCodeField.fill(value);
  }

  async clickContinue() {
    await this.continueButton.click();
  }
}