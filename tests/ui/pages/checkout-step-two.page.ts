import { Locator, Page, expect } from '@playwright/test';

export class CheckoutStepTwoPageSauceDemo {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly finishButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('span.title[data-test="title"]');
    this.cartItems = page.locator('.cart_item');
    this.finishButton = page.getByRole('button', { name: /finish/i });
  }

  async verifyCheckoutOverviewPage() {
    await expect(this.page).toHaveURL(/\/checkout-step-two\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Overview');
  }

  async getCheckoutItemNames(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  async getCheckoutItemPrices(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_price').allTextContents();
  }

  async getCheckoutItemDescriptions(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_desc').allTextContents();
  }

  async verifyCheckoutItemNames(expectedNames: string[]) {
    const actualNames = await this.getCheckoutItemNames();
    expect(actualNames).toEqual(expectedNames);
  }

  async verifyCheckoutItemPrices(expectedPrices: string[]) {
    const actualPrices = await this.getCheckoutItemPrices();
    expect(actualPrices).toEqual(expectedPrices);
  }

  async verifyCheckoutItemDescriptions(expectedDescriptions: string[]) {
    const actualDescriptions = await this.getCheckoutItemDescriptions();
    expect(actualDescriptions.length).toBeGreaterThanOrEqual(expectedDescriptions.length);

    expectedDescriptions.forEach((expectedDescription, index) => {
      const actualDescription = actualDescriptions[index] || '';
      expect(actualDescription).toContain(expectedDescription);
    });
  }

  async clickFinish() {
    await this.finishButton.click();
  }
}