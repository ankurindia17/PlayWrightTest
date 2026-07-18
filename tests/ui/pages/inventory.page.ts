import { Locator, Page } from '@playwright/test';
import { expect } from '../fixtures/auth-page-fixture';

export class InventoryPageSauceDemo {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly menuButton: Locator;
  readonly cartButton: Locator;
  readonly cartBadge: Locator;
  readonly filterSelect: Locator;
  readonly closeMenuButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.getByText('Products');
    this.menuButton = page.getByRole('button', { name: /open menu/i });
    this.closeMenuButton = page.getByRole('button', { name: /close menu/i });
    //this.cartButton = page.getByRole('link', { name: /shopping cart/i });
    this.cartButton = page.locator('a[data-test="shopping-cart-link"]');
    this.cartBadge = page.locator('.shopping_cart_badge');
    this.filterSelect = page.getByRole('combobox');
  }

  async goto() {
    await this.page.goto('https://www.saucedemo.com/inventory.html');
  }

  async verifyInventoryPage() {
    //await expect(this.page).toHaveTitle('This Is Definitely Not The Right Title');
    await this.pageTitle.waitFor({ state: 'visible' });
  }

  getProductCard(productName: string) {
    return this.page
      .locator('.inventory_item')
      .filter({ has: this.page.getByText(productName, ) });
  }

  getProductTitle(productName: string) {
  return this.getProductCard(productName).locator('.inventory_item_name', { hasText: productName });
  }

  getProductPrice(productName: string) {
    return this.getProductCard(productName).locator('.inventory_item_price');
  }

  getProductDescription(productName: string) {
    return this.getProductCard(productName).locator('.inventory_item_desc');
  }

  getAddToCartButton(productName: string) {
    return this.getProductCard(productName).getByRole('button', { name: /add to cart/i });
  }

  getRemoveButton(productName: string) {
    return this.getProductCard(productName).getByRole('button', { name: /remove/i });
  }

  async addToCart(productName: string) {
    await this.getAddToCartButton(productName).click();
  }

  async removeFromCart(productName: string) {
    await this.getRemoveButton(productName).click();
  }

  async isProductInCart(productName: string) {
    const removeButton = this.getRemoveButton(productName);
    return await removeButton.isVisible();
  }

  async openMenu() {
    await this.menuButton.click();
  }

  async closeMenu() {
    await this.closeMenuButton.click();
  } 

  async selectSortOption(option: string) {
    await this.filterSelect.selectOption({ label: option });
  }

  async getCartCount() {
    if (await this.cartBadge.count() === 0) return 0;
    return Number(await this.cartBadge.textContent());
  }

  async goToCart() {
    await this.cartButton.click();
  }
}