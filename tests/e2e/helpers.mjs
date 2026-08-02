// Shared browser-driving helpers for the end-to-end suites.
//
// react-native-web routes presses through its own responder system, which does
// not reliably observe coordinate-based input synthesised over the DevTools
// Protocol. Presses are therefore dispatched as a full pointer + mouse event
// chain on the nearest pressable ancestor of the located text node, and text is
// written through React's observed value setter rather than by typing keys.

export const BASE_URL = process.env.E2E_URL || 'http://localhost:8081';
export const VIEWPORT = { width: 430, height: 932, deviceScaleFactor: 2 };

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const PRESS = (text, exact, index) => {
  const matches = [];
  for (const el of document.querySelectorAll('*')) {
    const t = (el.textContent || '').trim();
    const ok = exact ? t === text : t.includes(text);
    if (!ok) continue;
    let deeper = false;
    for (const c of el.children) {
      const ct = (c.textContent || '').trim();
      if (exact ? ct === text : ct.includes(text)) { deeper = true; break; }
    }
    if (deeper) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 1 || r.height < 1) continue;
    matches.push(el);
  }
  const el = index < 0 ? matches[matches.length + index] : matches[index];
  if (!el) return false;
  el.scrollIntoView({ block: 'center' });
  let target = el;
  while (target && !(target.className || '').toString().includes('r-touch')) target = target.parentElement;
  target = target || el;
  const r = target.getBoundingClientRect();
  const o = {
    bubbles: true, cancelable: true, view: window, button: 0,
    clientX: r.x + r.width / 2, clientY: r.y + r.height / 2,
    pointerId: 1, pointerType: 'mouse', isPrimary: true,
  };
  target.dispatchEvent(new PointerEvent('pointerdown', { ...o, buttons: 1 }));
  target.dispatchEvent(new MouseEvent('mousedown', { ...o, buttons: 1 }));
  target.dispatchEvent(new PointerEvent('pointerup', { ...o, buttons: 0 }));
  target.dispatchEvent(new MouseEvent('mouseup', { ...o, buttons: 0 }));
  target.dispatchEvent(new MouseEvent('click', { ...o, buttons: 0 }));
  return true;
};

const SET = (sel, value, index) => {
  const el = document.querySelectorAll(sel)[index || 0];
  if (!el) return false;
  el.scrollIntoView({ block: 'center' });
  el.focus();
  const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement : HTMLInputElement;
  Object.getOwnPropertyDescriptor(proto.prototype, 'value').set.call(el, value);
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
};

/** Press the control whose visible label matches `text`. */
export async function press(page, text, opts = {}) {
  const { exact = true, index = 0, required = true, wait = 600 } = opts;
  const ok = await page.evaluate(PRESS, text, exact, index);
  if (!ok) {
    if (required) throw new Error(`press: no control labelled "${text}" [index ${index}]`);
    return false;
  }
  if (wait > 0) await sleep(wait);
  return true;
}

/** Write `value` into the input identified by its placeholder. */
export async function type(page, placeholder, value, index = 0) {
  const sel = `input[placeholder="${placeholder}"], textarea[placeholder="${placeholder}"]`;
  await page.waitForSelector(sel, { timeout: 10000 });
  const ok = await page.evaluate(SET, sel, value, index);
  if (!ok) throw new Error(`type: no input with placeholder "${placeholder}" [index ${index}]`);
  await sleep(180);
}

export const bodyText = (page) => page.evaluate(() => document.body.innerText);

/** Cold start with an empty device store. */
export async function coldStart(page) {
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await sleep(1500);
  await page.evaluate(() => localStorage.clear());
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await sleep(4500);
}

/** Drop the session but keep catalogue and order state, then reload. */
export async function signOut(page) {
  await page.evaluate(() => {
    Object.keys(localStorage)
      .filter((k) => /user|role|cart/i.test(k))
      .forEach((k) => localStorage.removeItem(k));
  });
  await page.goto(BASE_URL, { waitUntil: 'networkidle2' });
  await sleep(3500);
}

export async function signIn(page, email, password = 'test1234') {
  await type(page, 'you@example.com', email);
  await type(page, 'Enter your password', password);
  await press(page, 'Sign In', { index: -1, wait: 3000 });
}

/** Minimal assertion recorder shared by both suites. */
export function recorder() {
  const results = [];
  return {
    results,
    check(id, description, condition) {
      const passed = Boolean(condition);
      results.push({ id, description, passed });
      console.log(`  ${id}  ${passed ? 'PASS' : 'FAIL'}  ${description}`);
      return passed;
    },
    summary() {
      const passed = results.filter((r) => r.passed).length;
      const failed = results.length - passed;
      console.log(`\n=== ${passed} passed, ${failed} failed, ${results.length} total ===\n`);
      return failed;
    },
  };
}
