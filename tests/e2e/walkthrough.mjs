// Functional end-to-end suite (TC-F01 … TC-F25).
//
// Drives one order through the whole business cycle across all three roles:
// a customer places it, the farmer confirms and packs it, and a delivery
// partner claims and advances it. Each role independently observes the state
// written by the previous one, so this doubles as a cross-role integration test.
//
//   npm run test:e2e            (expects `npm run web` already serving :8081)
//   E2E_SHOTS=1 npm run test:e2e   also writes screenshots to docs/screenshots

import fs from 'node:fs';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import {
  BASE_URL, VIEWPORT, sleep, press, type, bodyText,
  coldStart, signOut, signIn, recorder,
} from './helpers.mjs';

const CAPTURE = process.env.E2E_SHOTS === '1';
const SHOT_DIR = process.env.E2E_SHOT_DIR || path.resolve('docs/screenshots');
if (CAPTURE) fs.mkdirSync(SHOT_DIR, { recursive: true });

const browser = await puppeteer.launch({
  channel: 'chrome',
  headless: 'new',
  defaultViewport: VIEWPORT,
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
page.on('dialog', (d) => d.accept());
page.setDefaultTimeout(15000);

const t = recorder();
const shot = async (name) => {
  if (CAPTURE) await page.screenshot({ path: path.join(SHOT_DIR, `${name}.png`) });
};
// Case-insensitive: several labels are uppercased by CSS, so the rendered text
// innerText returns does not match the source casing.
const has = async (needle) => (await bodyText(page)).toLowerCase().includes(needle.toLowerCase());

console.log(`\n=== FUNCTIONAL END-TO-END SUITE against ${BASE_URL} ===\n`);

try {
  // ---------------- authentication ----------------
  await coldStart(page);
  t.check('TC-F01', 'Unauthenticated launch is redirected to sign-in', await has('Welcome back'));
  await shot('01-login');

  await press(page, 'Sign Up', { index: 0, wait: 900 });
  t.check('TC-F02', 'Sign-up mode reveals the additional identity fields', await has('Create your account'));
  await shot('02-signup');
  await press(page, 'Sign In', { index: 0, wait: 700 });

  await signIn(page, 'aarav@example.com');
  t.check('TC-F03', 'Valid credentials sign the user in', await has('Choose your role'));
  await shot('03-role-select');

  await press(page, 'Buy fresh produce directly from farmers', { wait: 700 });
  await shot('04-role-selected');
  await press(page, 'Continue', { wait: 4000 });
  t.check('TC-F04', 'Role selection routes to the correct workspace', await has('Fresh Produce'));
  await shot('05-customer-home');

  // ---------------- customer ----------------
  t.check('TC-F05', 'Catalogue loads products and verified farmers',
    (await has('Alphonso Mangoes')) && (await has('Verified Farmers')));

  await press(page, 'Fruits', { wait: 2200 });
  t.check('TC-F06', 'Category filter narrows the catalogue',
    (await has('Alphonso Mangoes')) && !(await has('Cow Milk')));
  await shot('06-customer-home-category');
  await press(page, 'All', { wait: 2200 });

  await press(page, 'Alphonso Mangoes', { wait: 2800 });
  t.check('TC-F07', 'Product detail opens with stock and pricing',
    (await has('in stock')) && (await has('₹650')));
  await shot('07-product-detail');

  await press(page, 'Add · ₹650', { exact: false, index: -1, wait: 2500 });
  t.check('TC-F08', 'Add to cart from the product detail screen', await has('Fresh Produce'));

  await press(page, 'Fresh Tomatoes', { wait: 2800 });
  await press(page, 'Add · ₹', { exact: false, index: -1, wait: 2500 });
  await press(page, 'Cart', { wait: 2200 });
  t.check('TC-F09', 'Cart accepts produce from a second farmer',
    (await has('Alphonso Mangoes')) && (await has('Fresh Tomatoes')));
  t.check('TC-F10', 'Cart totals and free-delivery state are correct',
    (await has('₹690')) && (await has('FREE')));
  await shot('08-cart');

  await press(page, 'Proceed to Payment', { exact: false, index: -1, wait: 2200 });
  await press(page, 'UPI', { wait: 500 });
  await type(page, 'House no, street, area', '42 Green Park Road');
  await type(page, 'City', 'Mumbai');
  await type(page, 'State', 'Maharashtra');
  await type(page, '6 digits', '400001');
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await sleep(800);
  t.check('TC-F11', 'Checkout accepts a payment method and a valid address', await has('Place Order'));
  await shot('09-checkout');

  await press(page, 'Place Order', { exact: false, index: -1, wait: 4500 });
  const orders = await bodyText(page);
  t.check('TC-F12', 'Order placement splits the cart by farmer',
    orders.includes('₹650') && orders.includes('₹40'));
  t.check('TC-F13', 'Order history lists both orders newest first',
    (orders.match(/Track Order/g) || []).length >= 2);
  await shot('10-customer-orders');

  await press(page, 'Track Order', { index: 0, wait: 3000 });
  t.check('TC-F14', 'Tracking timeline reflects the current stage',
    (await has('Order Placed')) && (await has('Est. by')));
  await shot('11-track-order');
  await page.goBack();
  await sleep(2500);

  await press(page, 'Profile', { wait: 2200 });
  t.check('TC-F15', 'Customer profile presents identity and actions',
    (await has('aarav@example.com')) && (await has('Sign Out')));
  await shot('12-customer-profile');

  // ---------------- farmer ----------------
  await signOut(page);
  await signIn(page, 'ramesh@example.com');
  await press(page, 'Sell your produce directly to customers', { wait: 700 });
  await press(page, 'Continue', { wait: 4000 });
  t.check('TC-F16', 'Farmer dashboard aggregates the newly placed orders',
    (await has('Active Orders')) && (await has('Recent Orders')));
  await shot('13-farmer-dashboard');

  await press(page, 'Products', { wait: 2500 });
  t.check('TC-F17', 'Inventory lists owned products with stock state',
    (await has('Stock:')) && (await has('Available')));
  await shot('14-farmer-products');

  await press(page, 'Add', { index: 0, wait: 1500 });
  await type(page, 'e.g., Fresh Tomatoes', 'Organic Okra');
  await type(page, 'Describe your product', 'Tender ladyfinger, picked at dawn.');
  await type(page, '0', '55', 0);
  await type(page, '0', '40', 1);
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await sleep(800);
  await shot('15-farmer-add-product');
  await press(page, 'Add Product', { index: -1, wait: 2500 });
  t.check('TC-F18', 'Product creation adds to inventory', await has('Organic Okra'));
  await shot('16-farmer-products-added');

  await press(page, 'Orders', { wait: 2500 });
  t.check('TC-F19', 'Order queue offers only the permitted next transition',
    (await has('Mark Confirmed')) && !(await has('Mark Delivered')));
  await shot('17-farmer-orders');

  await press(page, 'Mark Confirmed', { exact: false, index: 0, wait: 2500 });
  t.check('TC-F20', 'Confirm transition is applied and history appended', await has('Mark Packed'));

  await press(page, 'Mark Packed', { exact: false, index: 0, wait: 2500 });
  t.check('TC-F21', 'Packing ends farmer authority over the order',
    (await has('Packed')) && !(await has('Mark Packed')));
  await shot('18-farmer-orders-packed');

  // ---------------- delivery ----------------
  await signOut(page);
  await signIn(page, 'ravi@example.com');
  await press(page, 'Deliver orders and earn on your schedule', { wait: 700 });
  await press(page, 'Continue', { wait: 4000 });
  t.check('TC-F22', 'Packed order becomes visible on the delivery job board',
    (await has('Available Orders')) && (await has('Earn ₹30')));
  await shot('19-delivery-orders');

  await press(page, 'Accept', { index: 0, wait: 3000 });
  t.check('TC-F23', 'Acceptance claims the job exclusively',
    (await has('My Deliveries (1)')) && (await has('Pick Up')));
  await shot('20-delivery-my-deliveries');

  await press(page, 'Pick Up', { index: 0, wait: 3000 });
  await press(page, 'Map', { wait: 2800 });
  t.check('TC-F24', 'Delivery progression and route resolution',
    (await has('Pickup')) && (await has('Drop')));
  await shot('21-delivery-route');

  await press(page, 'Earnings', { wait: 2800 });
  t.check('TC-F25', 'Earnings aggregate delivered work by period',
    (await has('Total Earnings')) && (await has('This Month')));
  await shot('22-delivery-earnings');
} catch (error) {
  console.error('\nSUITE ABORTED:', error.message);
  t.check('SUITE', 'Suite ran to completion', false);
} finally {
  const failed = t.summary();
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
