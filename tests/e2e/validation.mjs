// Validation and negative suite (TC-V01 … TC-V15).
//
// Supplies invalid input at every guarded boundary and asserts that the
// application refuses the operation and reports the specific reason. Also covers
// two stateful properties that are easy to regress: cart persistence across a
// restart, and the route guard refusing a direct URL into another role's group.
//
//   npm run test:validation     (expects `npm run web` already serving :8081)

import puppeteer from 'puppeteer-core';
import {
  BASE_URL, VIEWPORT, sleep, press, type, bodyText,
  coldStart, signOut, signIn, recorder,
} from './helpers.mjs';

const TOAST_LIFETIME = 2600;

const browser = await puppeteer.launch({
  channel: 'chrome',
  headless: 'new',
  defaultViewport: { ...VIEWPORT, deviceScaleFactor: 1 },
  args: ['--no-sandbox', '--hide-scrollbars'],
});
const page = await browser.newPage();
page.on('dialog', (d) => d.accept());
page.setDefaultTimeout(15000);

const t = recorder();
const says = async (needle) => (await bodyText(page)).toLowerCase().includes(needle.toLowerCase());
const settle = () => sleep(TOAST_LIFETIME);

console.log(`\n=== VALIDATION / NEGATIVE SUITE against ${BASE_URL} ===\n`);

try {
  await coldStart(page);

  // ---------------- credential validation ----------------
  await type(page, 'you@example.com', 'notanemail');
  await type(page, 'Enter your password', 'test1234');
  await press(page, 'Sign In', { index: -1, wait: 700 });
  t.check('TC-V01', 'Malformed email rejected at sign-in', await says('valid email address'));
  await settle();

  await type(page, 'you@example.com', 'aarav@example.com');
  await type(page, 'Enter your password', 'abc');
  await press(page, 'Sign In', { index: -1, wait: 700 });
  t.check('TC-V02', 'Password shorter than 6 characters rejected', await says('at least 6 characters'));
  await settle();

  await press(page, 'Sign Up', { index: 0, wait: 900 });
  await type(page, 'you@example.com', 'aarav@example.com');
  await type(page, 'Create a password', 'test1234');
  await press(page, 'Create Account', { index: -1, wait: 700 });
  t.check('TC-V03', 'Sign-up without a name rejected', await says('enter your name'));
  await settle();

  await type(page, 'Enter your full name', 'Aarav Sharma');
  await type(page, '9876543210', '12345');
  await press(page, 'Create Account', { index: -1, wait: 700 });
  t.check('TC-V04', 'Invalid Indian mobile number rejected', await says('10-digit mobile'));
  await settle();
  await press(page, 'Sign In', { index: 0, wait: 700 });

  // ---------------- role selection ----------------
  await signIn(page, 'aarav@example.com');
  await press(page, 'Continue', { wait: 800 });
  t.check('TC-V05', 'Continue without a role selection rejected', await says('select a role'));
  await settle();

  await press(page, 'Buy fresh produce directly from farmers', { wait: 600 });
  await press(page, 'Continue', { wait: 4000 });
  t.check('TC-V06', 'Customer role lands on the customer catalogue', await says('Fresh Produce'));

  // ---------------- route guard ----------------
  await page.goto(`${BASE_URL}/(farmer)/dashboard`, { waitUntil: 'networkidle2' });
  await sleep(4000);
  t.check('TC-V07', 'Direct URL into another role group is redirected', await says('Fresh Produce'));

  // ---------------- minimum order value ----------------
  await press(page, 'Fresh Coriander', { wait: 2800 });   // ₹15 per piece
  await press(page, 'Add · ₹', { exact: false, index: -1, wait: 2500 });
  await press(page, 'Cart', { wait: 2000 });
  await press(page, 'Proceed to Payment', { exact: false, index: -1, wait: 900 });
  t.check('TC-V08', 'Checkout blocked below the ₹100 minimum order value', await says('more to checkout'));
  await settle();

  await press(page, 'Home', { wait: 2000 });
  await press(page, 'Alphonso Mangoes', { wait: 2800 });
  await press(page, 'Add · ₹', { exact: false, index: -1, wait: 2500 });
  await press(page, 'Cart', { wait: 2000 });
  await press(page, 'Proceed to Payment', { exact: false, index: -1, wait: 2200 });
  t.check('TC-V09', 'Checkout permitted once the minimum is met', await says('Delivery Address'));

  // ---------------- address validation ----------------
  await press(page, 'Place Order', { exact: false, index: -1, wait: 900 });
  t.check('TC-V10', 'Order rejected with an incomplete address', await says('all address fields'));
  await settle();

  await type(page, 'House no, street, area', '42 Green Park Road');
  await type(page, 'City', 'Mumbai');
  await type(page, 'State', 'Maharashtra');
  await type(page, '6 digits', '0400');
  await press(page, 'Place Order', { exact: false, index: -1, wait: 900 });
  t.check('TC-V11', 'Order rejected with a malformed pincode', await says('valid 6-digit pincode'));
  await settle();

  // ---------------- state restoration ----------------
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await sleep(4500);
  await press(page, 'Cart', { wait: 2500 });
  t.check('TC-V12', 'Cart survives an application restart', await says('Alphonso Mangoes'));
  t.check('TC-V13', 'Free-delivery threshold applied above ₹500', await says('FREE'));

  // ---------------- farmer required fields ----------------
  await signOut(page);
  await signIn(page, 'ramesh@example.com');
  await press(page, 'Sell your produce directly to customers', { wait: 600 });
  await press(page, 'Continue', { wait: 4000 });
  t.check('TC-V14', 'Farmer role lands on the farmer dashboard', await says('how your farm is doing'));

  await press(page, 'Products', { wait: 2500 });
  await press(page, 'Add', { index: 0, wait: 1500 });
  await press(page, 'Add Product', { index: -1, wait: 900 });
  t.check('TC-V15', 'Product creation rejected with mandatory fields empty',
    await says('fill all required fields'));
  await settle();
} catch (error) {
  console.error('\nSUITE ABORTED:', error.message);
  t.check('SUITE', 'Suite ran to completion', false);
} finally {
  const failed = t.summary();
  await browser.close();
  process.exit(failed === 0 ? 0 : 1);
}
