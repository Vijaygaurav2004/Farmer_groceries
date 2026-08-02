# End-to-end test suites

Two automated suites drive the running application through a real Chrome
instance over the DevTools Protocol. Together they cover 40 test cases.

| Suite | Cases | What it proves |
|---|---|---|
| `e2e/walkthrough.mjs` | 25 (TC-F01 – TC-F25) | One order travels the whole business cycle: a customer places it, the farmer confirms and packs it, a delivery partner claims and advances it. Each role observes state written by the previous one, so this is a genuine cross-role integration test. |
| `e2e/validation.mjs` | 15 (TC-V01 – TC-V15) | Every guarded boundary refuses invalid input with a specific message; the cart survives a restart; the route guard refuses a direct URL into another role's section. |

## Running them

The suites test the running app, so start the web target first and leave it up:

```bash
npm run web            # serves http://localhost:8081
```

Then, in a second terminal:

```bash
npm run test:e2e         # functional walkthrough
npm run test:validation  # validation and negative cases
npm test                 # both, in sequence
```

Both exit `0` when every case passes and `1` otherwise, so they can be wired
into CI unchanged. Point them at a different host with `E2E_URL`:

```bash
E2E_URL=http://192.168.1.20:8081 npm run test:e2e
```

## Capturing screenshots

The walkthrough can write a screenshot at each checkpoint — this is how the
images in `docs/screenshots/` are produced:

```bash
E2E_SHOTS=1 npm run test:e2e
E2E_SHOTS=1 E2E_SHOT_DIR=/tmp/shots npm run test:e2e   # elsewhere
```

## A note on driving react-native-web

`helpers.mjs` does two things that look unusual and are deliberate.

Presses are dispatched as a full `pointerdown → mousedown → pointerup → mouseup
→ click` chain on the nearest pressable ancestor of the located text node,
rather than as a coordinate click. react-native-web routes presses through its
own responder system, which does not reliably observe input synthesised over the
DevTools Protocol on every screen.

Text is written through `HTMLInputElement.prototype.value`'s setter followed by
an `input` event, rather than by typing keys. React observes that setter, and
controlled `TextInput`s on some screens do not take focus from a synthesised
click, which would otherwise discard the keystrokes.

## Coverage gaps

These suites are integration tests against the web target. There is no unit
test runner in the project yet, so pure helpers (`calculateDistance`,
`formatCurrency`, `canCancelOrder`) are covered only through the interfaces that
call them, and platform-specific native behaviour — haptics, native modals — is
not exercised.
