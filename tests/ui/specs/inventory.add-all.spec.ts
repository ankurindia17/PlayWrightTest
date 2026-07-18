import { test, expect } from '../fixtures/auth-page-fixture';
import { InventoryPageSauceDemo } from '../pages/inventory.page';
import { CartPageSauceDemo } from '../pages/cart.page';
import { CheckoutPageSauceDemo } from '../pages/checkout.page';
import { CheckoutStepTwoPageSauceDemo } from '../pages/checkout-step-two.page';
import { CheckoutCompletePageSauceDemo } from '../pages/checkout-complete.page';
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

// npm test -- tests/inventory.add-all.spec.ts --headed --workers=1 --project=chromium
// npm test -- tests/ui/specs/inventory.add-all.spec.ts --headed --workers=1 --project=chromium --browser=chromium
// npx playwright test tests/ui/specs/inventory.add-all.spec.ts --list

const inventoryData = readCSV<InventoryData>('./test-data/inventoryData.csv');
const userData = readCSV<UserData>('./test-data/userData.csv')[0];

test.describe.configure({ mode: 'parallel' });

test.describe('Sauce Demo Inventory add all products once', () => {
  let inventoryPage: InventoryPageSauceDemo;
  let cartPage: CartPageSauceDemo;
  let checkoutPage: CheckoutPageSauceDemo;
  let checkoutStepTwoPage: CheckoutStepTwoPageSauceDemo;
  let checkoutCompletePage: CheckoutCompletePageSauceDemo;

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

    await cartPage.goToCheckout();

    checkoutPage = new CheckoutPageSauceDemo(inventoryPage.page);
    await checkoutPage.verifyCheckoutStepOnePage();
    await checkoutPage.enterFirstName(userData.firstName);
    await checkoutPage.enterLastName(userData.lastName);
    await checkoutPage.enterPostalCode(userData.postalCode);
    await checkoutPage.clickContinue();

    checkoutStepTwoPage = new CheckoutStepTwoPageSauceDemo(inventoryPage.page);
    await checkoutStepTwoPage.verifyCheckoutOverviewPage();
    await checkoutStepTwoPage.verifyCheckoutItemNames(inventoryData.map((item) => item.productName));
    await checkoutStepTwoPage.verifyCheckoutItemPrices(inventoryData.map((item) => item.expectedPrice));
    await checkoutStepTwoPage.verifyCheckoutItemDescriptions(inventoryData.map((item) => item.expectedDescription));
    await checkoutStepTwoPage.clickFinish();

    checkoutCompletePage = new CheckoutCompletePageSauceDemo(inventoryPage.page);
    await checkoutCompletePage.verifyCheckoutCompletePage();
    await checkoutCompletePage.clickBackHome();
  });
});