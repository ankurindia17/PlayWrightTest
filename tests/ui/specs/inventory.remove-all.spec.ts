import { test, expect } from '../fixtures/auth-page-fixture';
import { InventoryPageSauceDemo } from '../pages/inventory.page';
import { CartPageSauceDemo } from '../pages/cart.page';

import { readCSV } from '../../../src/utils/CsvReader';

export type InventoryData = {
  productName: string;
  expectedDescription: string;
  expectedPrice: string;
};

export type UserData = {
  firstName: string;
  lastName: string;
  postalCode: string;
};

// npm test -- src/tests/inventory.remove-all.spec.ts --headed --workers=1 --project=chromium

const inventoryData = readCSV<InventoryData>('./test-data/inventoryData.csv');

test.describe('Sauce Demo Inventory remove all products', () => {
  let inventoryPage: InventoryPageSauceDemo;
  let cartPage: CartPageSauceDemo;

  test.beforeEach(async ({ page }) => {
    inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();
  });

  test('should add all inventory products from CSV, verify cart, checkout, and finish', async () => {
    for (const [index, data] of inventoryData.entries()) {
      await expect(inventoryPage.getProductTitle(data.productName)).toHaveText(data.productName);
      await inventoryPage.addToCart(data.productName);
      await expect(inventoryPage.getRemoveButton(data.productName)).toBeVisible();

      const expectedCount = index + 1;
      expect(await inventoryPage.getCartCount()).toBe(expectedCount);
    }

    await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(String(inventoryData.length));

    await inventoryPage.goToCart();
    cartPage = new CartPageSauceDemo(inventoryPage.page);
    await cartPage.verifyCartPage();
    await cartPage.verifyCartItems(inventoryData.map((item) => item.productName));
    await cartPage.verifyCartItemPrices(inventoryData.map((item) => item.expectedPrice));
    await cartPage.verifyCartItemDescriptions(inventoryData.map((item) => item.expectedDescription));

    await cartPage.verifyCartPage();
    await cartPage.removeAllProducts(inventoryData.map((item) => item.productName));
    await cartPage.verifyCartIsEmpty();
  });
});