import { Locator, Page, expect } from '@playwright/test';

export class CheckoutCompletePageSauceDemo {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly thankYouMessage: Locator;
  readonly backHomeButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('span.title[data-test="title"]');
    this.thankYouMessage = page.getByText(/thank you for your order/i);
    this.backHomeButton = page.getByRole('button', { name: /back home/i });
  }

  async verifyCheckoutCompletePage() {
    await expect(this.page).toHaveURL(/\/checkout-complete\.html$/);
    await expect(this.pageTitle).toHaveText('Checkout: Complete!');
    await expect(this.thankYouMessage).toBeVisible();
  }

  async clickBackHome() {
    await this.backHomeButton.click();
  }
}