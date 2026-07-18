import { Locator, Page, expect } from '@playwright/test';

export class CartPageSauceDemo {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly cartItems: Locator;
  readonly checkoutButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('span.title[data-test="title"]');
    this.cartItems = page.locator('.cart_item');
    this.checkoutButton = page.getByRole('button', { name: /checkout/i });
  }


  async goToCheckout() {
    await this.checkoutButton.click();
  }

  async verifyCartPage() {
    await expect(this.page).toHaveURL(/\/cart\.html$/);
    await expect(this.pageTitle).toHaveText('Your Cart');
  }

  getCartItem(productName: string) {
    return this.cartItems.filter({ has: this.page.getByText(productName) });
  }

  getRemoveButton(productName: string) {
    return this.getCartItem(productName).getByRole('button', { name: /remove/i });
  }

  async removeProduct(productName: string) {
    await this.getRemoveButton(productName).click();
  }

  async removeAllProducts(productNames: string[]) {
    for (const productName of productNames) {
      await this.removeProduct(productName);
    }
  }

  async verifyCartIsEmpty() {
    await expect(this.cartItems).toHaveCount(0);
    await expect(this.page.locator('.shopping_cart_badge')).toHaveCount(0);
  }

  async getCartItemNames(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_name').allTextContents();
  }

  async getCartItemPrices(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_price').allTextContents();
  }

  async getCartItemDescriptions(): Promise<string[]> {
    return this.cartItems.locator('.inventory_item_desc').allTextContents();
  }

  async verifyCartItems(expectedNames: string[]) {
    const actualNames = await this.getCartItemNames();
    expect(actualNames).toEqual(expectedNames);
  }

  async verifyCartItemPrices(expectedPrices: string[]) {
    const actualPrices = await this.getCartItemPrices();
    expect(actualPrices).toEqual(expectedPrices);
  }

  async verifyCartItemDescriptions(expectedDescriptions: string[]) {
    const actualDescriptions = await this.getCartItemDescriptions();
    expect(actualDescriptions.length).toBeGreaterThanOrEqual(expectedDescriptions.length);

    expectedDescriptions.forEach((expectedDescription, index) => {
      const actualDescription = actualDescriptions[index] || '';
      expect(actualDescription).toContain(expectedDescription);
    });
  }

}