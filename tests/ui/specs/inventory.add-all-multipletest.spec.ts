import { test, expect } from '../fixtures/auth-page-fixture';
import { InventoryPageSauceDemo } from '../pages/inventory.page';
import { CartPageSauceDemo } from '../pages/cart.page';
import { CheckoutPageSauceDemo } from '../pages/checkout.page';
import { CheckoutStepTwoPageSauceDemo } from '../pages/checkout-step-two.page';
import { CheckoutCompletePageSauceDemo } from '../pages/checkout-complete.page';
import { readCSV } from '../../../src/utils/CsvReader';

// npm test -- src/tests/inventory.add-all-multipletest.spec.ts --headed --workers=1 --project=chromium

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

const inventoryData = readCSV<InventoryData>('./test-data/inventoryData.csv');
const userData = readCSV<UserData>('./test-data/userData.csv')[0];

const expectedNames = inventoryData.map((item) => item.productName);
const expectedPrices = inventoryData.map((item) => item.expectedPrice);
const expectedDescriptions = inventoryData.map((item) => item.expectedDescription);

test.describe.configure({ mode: 'parallel' });

const addAllProductsToCart = async (inventoryPage: InventoryPageSauceDemo) => {
  for (const data of inventoryData) {
    await expect(inventoryPage.getProductTitle(data.productName)).toHaveText(data.productName);
    await inventoryPage.addToCart(data.productName);
    await expect(inventoryPage.getRemoveButton(data.productName)).toBeVisible();
  }
};

const goToCheckoutOverview = async (inventoryPage: InventoryPageSauceDemo, cartPage: CartPageSauceDemo, checkoutPage: CheckoutPageSauceDemo) => {
  await inventoryPage.goToCart();
  await cartPage.verifyCartPage();
  await cartPage.goToCheckout();
  await checkoutPage.verifyCheckoutStepOnePage();
  await checkoutPage.enterFirstName(userData.firstName);
  await checkoutPage.enterLastName(userData.lastName);
  await checkoutPage.enterPostalCode(userData.postalCode);
  await checkoutPage.clickContinue();
};

// Need to update test.describe to use test.describe.parallel for parallel execution of tests
// Need to update test.describe to use test.describe.serial for sequential execution of tests
// And if test.describe it will run all tests in parallel, but if test.describe.serial it will run all tests in sequence 
// as we have set test.describe.configure({ mode: 'parallel' }); at the top of the file, 
// so we need to change it to test.describe.serial for sequential execution of tests.

test.describe('Sauce Demo inventory add-all multiple-stage workflow', () => {
  test('inventory add-to-cart', async ({ page }) => {
    const inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();

    await addAllProductsToCart(inventoryPage);
    await expect(inventoryPage.page.locator('.shopping_cart_badge')).toHaveText(String(inventoryData.length));
  });

  test('cart verification', async ({ page }) => {
    const inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();

    await addAllProductsToCart(inventoryPage);

    const cartPage = new CartPageSauceDemo(inventoryPage.page);
    await inventoryPage.goToCart();
    await cartPage.verifyCartPage();
    await cartPage.verifyCartItems(expectedNames);
    await cartPage.verifyCartItemPrices(expectedPrices);
    await cartPage.verifyCartItemDescriptions(expectedDescriptions);
  });

  test('checkout info', async ({ page }) => {
    const inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();

    await addAllProductsToCart(inventoryPage);

    const cartPage = new CartPageSauceDemo(inventoryPage.page);
    const checkoutPage = new CheckoutPageSauceDemo(inventoryPage.page);
    await goToCheckoutOverview(inventoryPage, cartPage, checkoutPage);
  });

  test('overview verification', async ({ page }) => {
    const inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();

    await addAllProductsToCart(inventoryPage);

    const cartPage = new CartPageSauceDemo(inventoryPage.page);
    const checkoutPage = new CheckoutPageSauceDemo(inventoryPage.page);
    await goToCheckoutOverview(inventoryPage, cartPage, checkoutPage);

    const checkoutStepTwoPage = new CheckoutStepTwoPageSauceDemo(inventoryPage.page);
    await checkoutStepTwoPage.verifyCheckoutOverviewPage();
    await checkoutStepTwoPage.verifyCheckoutItemNames(expectedNames);
    await checkoutStepTwoPage.verifyCheckoutItemPrices(expectedPrices);
    await checkoutStepTwoPage.verifyCheckoutItemDescriptions(expectedDescriptions);
  });

  test('finish and complete checkout', async ({ page }) => {
    const inventoryPage = new InventoryPageSauceDemo(page);
    await inventoryPage.goto();
    await inventoryPage.verifyInventoryPage();

    await addAllProductsToCart(inventoryPage);

    const cartPage = new CartPageSauceDemo(inventoryPage.page);
    const checkoutPage = new CheckoutPageSauceDemo(inventoryPage.page);
    await goToCheckoutOverview(inventoryPage, cartPage, checkoutPage);

    const checkoutStepTwoPage = new CheckoutStepTwoPageSauceDemo(inventoryPage.page);
    await checkoutStepTwoPage.verifyCheckoutOverviewPage();
    await checkoutStepTwoPage.verifyCheckoutItemNames(expectedNames);
    await checkoutStepTwoPage.verifyCheckoutItemPrices(expectedPrices);
    await checkoutStepTwoPage.verifyCheckoutItemDescriptions(expectedDescriptions);
    await checkoutStepTwoPage.clickFinish();

    const checkoutCompletePage = new CheckoutCompletePageSauceDemo(inventoryPage.page);
    await checkoutCompletePage.verifyCheckoutCompletePage();
    await checkoutCompletePage.clickBackHome();
  });
});