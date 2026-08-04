// Production toast gesture verification. Toaster intentionally has no CSS
// side-effect import, so this harness opts into the public stylesheet explicitly
// and drives real pointer events against the playground's real <Toaster />.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";
import { resolve } from "node:path";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server;
let browser;
let passed = true;
const results = [];
const errors = [];
const warnings = [];
const check = (name, condition, detail = "") => {
  passed = passed && Boolean(condition);
  results.push(`${condition ? "PASS" : "FAIL"}  ${name}  ${detail}`);
};

const transformOf = (page) =>
  page.$eval(".Toast", (element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return { x: Math.round(matrix.m41), y: Math.round(matrix.m42) };
  });
const boxOf = (page) =>
  page.$eval(".Toast", (element) => {
    const rect = element.getBoundingClientRect();
    return { cx: Math.round(rect.x + rect.width / 2), cy: Math.round(rect.y + rect.height / 2) };
  });
const toastCount = (page) => page.$$eval(".Toast", (elements) => elements.length);
const waitForDismissal = (page, id, timeout = 2500) =>
  page.waitForFunction(
    (toastId) => !document.querySelector(`[data-toast-id="${toastId}"]`),
    { timeout },
    id
  ).then(() => true).catch(() => false);
const waitForRest = (page, timeout = 1800) =>
  page.waitForFunction(() => {
    const element = document.querySelector(".Toast");
    if (!element || element.hasAttribute("data-dragging")) return false;
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return Math.abs(matrix.m41) <= 1 && Math.abs(matrix.m42) <= 1;
  }, { timeout }).then(() => true).catch(() => false);

const fireToast = async (page, id, options = {}) => {
  await page.evaluate(async ({ toastId, toastOptions }) => {
    const { toast } = await import("/src/velvet/toast.js");
    toast("Swipe gesture", { id: toastId, duration: Infinity, ...toastOptions });
  }, { toastId: id, toastOptions: options });
  await page.waitForSelector(`[data-toast-id="${id}"][data-state="open"]`, { timeout: 4000 });
  await sleep(420);
};
const clearToasts = async (page) => {
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss();
  });
  await page.waitForFunction(() => !document.querySelector(".Toast"), { timeout: 4000 }).catch(() => {});
  await sleep(80);
};
const dragTouch = async (client, from, to, steps = 6) => {
  const point = (x, y) => ({ x, y, id: 1, radiusX: 8, radiusY: 8, force: 0.5 });
  await client.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [point(from.x, from.y)],
  });
  for (let step = 1; step <= steps; step++) {
    const progress = step / steps;
    await client.send("Input.dispatchTouchEvent", {
      type: "touchMove",
      touchPoints: [point(
        from.x + (to.x - from.x) * progress,
        from.y + (to.y - from.y) * progress
      )],
    });
    await sleep(16);
  }
  await client.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  server.middlewares.use((request, response, next) => {
    if (request.url?.split("?")[0] !== "/__velvet-toast-test") {
      next();
      return;
    }
    response.statusCode = 200;
    response.setHeader("Content-Type", "text/html; charset=utf-8");
    response.end("<!doctype html><html><head><meta name=viewport content='width=device-width,initial-scale=1'></head><body></body></html>");
  });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error)}`));
  page.on("console", (message) => {
    if (message.type() === "warn") warnings.push(message.text());
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Failed to load resource|favicon\.ico|status of 404/i.test(text)) return;
    errors.push(text);
  });
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(new URL("/toasts", server.resolvedUrls.local[0]).href, { waitUntil: "load" });
  await page.addStyleTag({ path: resolve("src/velvet/Toaster.css") });
  await page.waitForSelector(".Toastpg");

  // === 1) release cannot strand a gesture or keep following the pointer ===
  await fireToast(page, "drag-release");
  let box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dx = 13; dx <= 52; dx += 13) await page.mouse.move(box.cx - dx, box.cy, { steps: 2 });
  const during = await transformOf(page);
  await sleep(160);
  await page.mouse.up();
  await page.mouse.move(box.cx + 280, box.cy + 160, { steps: 8 });
  await sleep(60);
  const afterRelease = await transformOf(page);
  const releaseCount = await toastCount(page);
  check(
    "released toast ignores later pointer movement",
    Math.abs(afterRelease.x) < Math.abs(during.x) && releaseCount === 1,
    `during.x=${during.x} after.x=${afterRelease.x} count=${releaseCount}`
  );
  check("released toast springs fully home", await waitForRest(page), JSON.stringify(await transformOf(page)));
  await clearToasts(page);

  // === 2) pointercancel always releases capture and recovers ==============
  await fireToast(page, "drag-cancel");
  box = await boxOf(page);
  await page.evaluate(() => {
    window.__toastPointerId = null;
    document.addEventListener("pointerdown", (event) => { window.__toastPointerId = event.pointerId; }, { once: true });
  });
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx - 92, box.cy, { steps: 6 });
  const cancelOffset = await transformOf(page);
  const cancelled = await page.evaluate(({ x, y }) => {
    const element = document.querySelector(".Toast");
    const pointerId = window.__toastPointerId;
    if (!element || pointerId == null) return false;
    return element.dispatchEvent(new PointerEvent("pointercancel", {
      bubbles: true,
      cancelable: true,
      pointerId,
      pointerType: "mouse",
      clientX: x,
      clientY: y,
      buttons: 0,
    }));
  }, { x: box.cx - 92, y: box.cy });
  await page.mouse.up();
  const cancelRested = await waitForRest(page);
  const cancelState = await page.$eval(".Toast", (element) => ({
    dragging: element.hasAttribute("data-dragging"),
    state: element.dataset.state,
  }));
  check(
    "pointercancel releases drag state and springs home",
    cancelled && Math.abs(cancelOffset.x) > 5 && cancelRested && !cancelState.dragging && cancelState.state === "open",
    `offset=${cancelOffset.x} dispatched=${cancelled} rested=${cancelRested} state=${JSON.stringify(cancelState)}`
  );
  await clearToasts(page);

  // === 3) a new press can re-grab a toast during its return spring =========
  await fireToast(page, "drag-regrab");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx - 54, box.cy, { steps: 5 });
  await sleep(160);
  await page.mouse.up();
  await sleep(24);
  const springOffset = await transformOf(page);
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx - 20, box.cy, { steps: 3 });
  const regrabOffset = await transformOf(page);
  const regrabDragging = await page.$eval(".Toast", (element) => element.dataset.state === "dragging");
  await sleep(160);
  await page.mouse.up();
  const regrabRested = await waitForRest(page);
  check(
    "returning toast can be re-grabbed without jumping or getting stranded",
    Math.abs(springOffset.x) > 3 && regrabDragging && Math.abs(regrabOffset.x) > Math.abs(springOffset.x) && regrabRested,
    `spring.x=${springOffset.x} regrab.x=${regrabOffset.x} dragging=${regrabDragging} rested=${regrabRested}`
  );
  await clearToasts(page);

  // === 4) orthogonal movement stays locked ================================
  await fireToast(page, "drag-axis");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dy = 14; dy <= 84; dy += 14) await page.mouse.move(box.cx, box.cy + dy, { steps: 2 });
  const vertical = await transformOf(page);
  check(
    "vertical movement is locked for a horizontal edge toast",
    Math.abs(vertical.x) <= 2 && Math.abs(vertical.y) <= 2,
    `x=${vertical.x} y=${vertical.y}`
  );
  await page.mouse.up();
  await clearToasts(page);

  // === 5) velocity must be recent and moving toward dismissal =============
  await fireToast(page, "drag-held-velocity");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx + 25, box.cy);
  await sleep(700);
  await page.mouse.up();
  const heldVelocityRested = await waitForRest(page);
  check(
    "stale release velocity cannot dismiss after a hold",
    heldVelocityRested && (await toastCount(page)) === 1,
    `rested=${heldVelocityRested} count=${await toastCount(page)}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-inward-velocity");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx + 60, box.cy);
  await page.mouse.move(box.cx + 30, box.cy);
  await page.mouse.up();
  const inwardVelocityRested = await waitForRest(page);
  check(
    "inward release velocity cannot trigger outward dismissal",
    inwardVelocityRested && (await toastCount(page)) === 1,
    `rested=${inwardVelocityRested} count=${await toastCount(page)}`
  );
  await clearToasts(page);

  // === 6) real-world flick/release sequences stay dismissible =============
  await fireToast(page, "drag-fast-flick");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx + 42, box.cy);
  await page.mouse.up();
  const fastFlickDismissed = await waitForDismissal(page, "drag-fast-flick", 1800);
  check(
    "a short fast flick dismisses without requiring the distance threshold",
    fastFlickDismissed,
    `dismissed=${fastFlickDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-touch-buttons-zero");
  box = await boxOf(page);
  await page.evaluate(({ x, y }) => {
    const element = document.querySelector('[data-toast-id="drag-touch-buttons-zero"]');
    const dispatch = (type, clientX, buttons) => element?.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 41,
      pointerType: "touch",
      isPrimary: true,
      clientX,
      clientY: y,
      buttons,
      pressure: buttons ? 0.5 : 0,
    }));
    dispatch("pointerdown", x, 1);
    dispatch("pointermove", x + 100, 0);
    dispatch("pointerup", x + 100, 0);
  }, { x: box.cx, y: box.cy });
  const touchButtonsDismissed = await waitForDismissal(page, "drag-touch-buttons-zero", 1800);
  check(
    "touch movement remains active when the browser reports buttons=0",
    touchButtonsDismissed,
    `dismissed=${touchButtonsDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-release-coordinate");
  box = await boxOf(page);
  await page.evaluate(async ({ x, y }) => {
    const element = document.querySelector('[data-toast-id="drag-release-coordinate"]');
    const dispatch = (type, clientX, buttons) => element?.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 42,
      pointerType: "pen",
      isPrimary: true,
      clientX,
      clientY: y,
      buttons,
      pressure: buttons ? 0.5 : 0,
    }));
    dispatch("pointerdown", x, 1);
    dispatch("pointermove", x + 20, 1);
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 120));
    dispatch("pointerup", x + 100, 0);
  }, { x: box.cx, y: box.cy });
  const releaseCoordinateDismissed = await waitForDismissal(page, "drag-release-coordinate", 1800);
  check(
    "pointerup contributes its final distance when the last move was coalesced",
    releaseCoordinateDismissed,
    `dismissed=${releaseCoordinateDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-lost-capture");
  box = await boxOf(page);
  await page.evaluate(({ x, y }) => {
    const element = document.querySelector('[data-toast-id="drag-lost-capture"]');
    const pointer = (type, clientX, buttons, target = element) => target?.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId: 43,
      pointerType: "touch",
      isPrimary: true,
      clientX,
      clientY: y,
      buttons,
      pressure: buttons ? 0.5 : 0,
    }));
    pointer("pointerdown", x, 1);
    pointer("pointermove", x + 30, 1);
    pointer("lostpointercapture", x + 30, 1);
    pointer("pointermove", x + 110, 1, window);
    pointer("pointerup", x + 110, 0, window);
  }, { x: box.cx, y: box.cy });
  const captureLossDismissed = await waitForDismissal(page, "drag-lost-capture", 1800);
  check(
    "losing pointer capture falls back to window tracking without cancelling the swipe",
    captureLossDismissed,
    `dismissed=${captureLossDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-reverse-default");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dx = 18; dx <= 108; dx += 18) {
    await page.mouse.move(box.cx - dx, box.cy, { steps: 2 });
  }
  await page.mouse.up();
  const reverseDefaultDismissed = await waitForDismissal(page, "drag-reverse-default", 1800);
  check(
    "default edge toasts dismiss in either direction on their horizontal axis",
    reverseDefaultDismissed,
    `dismissed=${reverseDefaultDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-per-toast-direction", { swipeDirections: ["left"] });
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx + 100, box.cy, { steps: 5 });
  await page.mouse.up();
  const perToastRejectedRested = await waitForRest(page);
  const perToastRejectedCount = await toastCount(page);
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx - 100, box.cy, { steps: 5 });
  await page.mouse.up();
  const perToastAllowedDismissed = await waitForDismissal(page, "drag-per-toast-direction", 1800);
  check(
    "one toast can restrict swipe directions without changing the Toaster",
    perToastRejectedRested && perToastRejectedCount === 1 && perToastAllowedDismissed,
    `rejectedRested=${perToastRejectedRested} count=${perToastRejectedCount} allowedDismissed=${perToastAllowedDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-nondismissible-scroll", { dismissible: false });
  const nondismissibleTouchAction = await page.$eval(
    '[data-toast-id="drag-nondismissible-scroll"]',
    (element) => getComputedStyle(element).touchAction
  );
  check(
    "non-dismissible toasts do not block page touch scrolling",
    nondismissibleTouchAction === "auto",
    `touch-action=${nondismissibleTouchAction}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-primary-pointer");
  box = await boxOf(page);
  await page.evaluate(({ x, y }) => {
    const element = document.querySelector('[data-toast-id="drag-primary-pointer"]');
    const pointer = (type, pointerId, clientX, buttons, isPrimary) => element?.dispatchEvent(new PointerEvent(type, {
      bubbles: true,
      cancelable: true,
      composed: true,
      pointerId,
      pointerType: "touch",
      isPrimary,
      clientX,
      clientY: y,
      buttons,
      pressure: buttons ? 0.5 : 0,
    }));
    pointer("pointerdown", 44, x, 1, true);
    pointer("pointermove", 44, x + 30, 1, true);
    pointer("pointerdown", 45, x + 8, 1, false);
    pointer("pointermove", 44, x + 110, 1, true);
    pointer("pointerup", 44, x + 110, 0, true);
  }, { x: box.cx, y: box.cy });
  const primaryPointerDismissed = await waitForDismissal(page, "drag-primary-pointer", 1800);
  check(
    "a second touch cannot steal an active primary swipe",
    primaryPointerDismissed,
    `dismissed=${primaryPointerDismissed}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-action-surface");
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    window.__toastActionPresses = 0;
    window.__toastActionDismissals = [];
    toast.update("drag-action-surface", {
      action: {
        label: "Undo",
        onClick: () => { window.__toastActionPresses += 1; },
      },
      onDismiss: (_entry, detail) => window.__toastActionDismissals.push(detail.reason),
    });
  });
  await page.waitForSelector('[data-toast-id="drag-action-surface"] [data-slot="action"]');
  const actionBox = await page.$eval(
    '[data-toast-id="drag-action-surface"] [data-slot="action"]',
    (element) => {
      const rect = element.getBoundingClientRect();
      return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
    }
  );
  await page.mouse.move(actionBox.cx, actionBox.cy);
  await page.mouse.down();
  await page.mouse.move(actionBox.cx + 100, actionBox.cy, { steps: 5 });
  await page.mouse.up();
  const actionSurfaceDismissed = await waitForDismissal(page, "drag-action-surface", 1800);
  const actionSurfaceResult = await page.evaluate(() => ({
    presses: window.__toastActionPresses,
    reasons: window.__toastActionDismissals,
  }));
  check(
    "swiping from an action control dismisses without activating the action",
    actionSurfaceDismissed && actionSurfaceResult.presses === 0 && actionSurfaceResult.reasons.join(",") === "swipe",
    `dismissed=${actionSurfaceDismissed} result=${JSON.stringify(actionSurfaceResult)}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-action-tap");
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    window.__toastTapPresses = 0;
    window.__toastTapDismissals = [];
    toast.update("drag-action-tap", {
      action: {
        label: "Undo",
        onClick: () => { window.__toastTapPresses += 1; },
      },
      onDismiss: (_entry, detail) => window.__toastTapDismissals.push(detail.reason),
    });
  });
  await page.click('[data-toast-id="drag-action-tap"] [data-slot="action"]');
  const actionTapDismissed = await waitForDismissal(page, "drag-action-tap", 1800);
  const actionTapResult = await page.evaluate(() => ({
    presses: window.__toastTapPresses,
    reasons: window.__toastTapDismissals,
  }));
  check(
    "tapping an action still activates it exactly once",
    actionTapDismissed && actionTapResult.presses === 1 && actionTapResult.reasons.join(",") === "action",
    `dismissed=${actionTapDismissed} result=${JSON.stringify(actionTapResult)}`
  );
  await clearToasts(page);

  await page.evaluate(async () => {
    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { toast } = await import("/src/velvet/toast.js");
    toast.custom(
      ReactModule.createElement("button", {
        type: "button",
        "data-velvet-toast-swipe-ignore": "",
      }, "Keep this control still"),
      { id: "drag-explicit-ignore", duration: Infinity }
    );
  });
  await page.waitForSelector('[data-toast-id="drag-explicit-ignore"][data-state="open"]');
  await sleep(420);
  const ignoredBox = await page.$eval(
    '[data-toast-id="drag-explicit-ignore"] [data-velvet-toast-swipe-ignore]',
    (element) => {
      const rect = element.getBoundingClientRect();
      return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
    }
  );
  await page.mouse.move(ignoredBox.cx, ignoredBox.cy);
  await page.mouse.down();
  await page.mouse.move(ignoredBox.cx + 110, ignoredBox.cy, { steps: 5 });
  await page.mouse.up();
  await sleep(180);
  const ignoredControlState = await page.$eval(
    '[data-toast-id="drag-explicit-ignore"]',
    (element) => ({ state: element.dataset.state, dragging: element.hasAttribute("data-dragging") })
  );
  check(
    "custom content can explicitly opt a control out of toast swiping",
    ignoredControlState.state === "open" && !ignoredControlState.dragging,
    JSON.stringify(ignoredControlState)
  );
  await clearToasts(page);

  let repeatedFlickDismissals = 0;
  for (let index = 0; index < 8; index++) {
    const id = `drag-repeat-${index}`;
    await fireToast(page, id);
    box = await boxOf(page);
    const direction = index % 2 === 0 ? 1 : -1;
    await page.mouse.move(box.cx, box.cy);
    await page.mouse.down();
    await page.mouse.move(box.cx + direction * 44, box.cy);
    await page.mouse.up();
    if (await waitForDismissal(page, id, 1600)) repeatedFlickDismissals += 1;
    await clearToasts(page);
  }
  check(
    "repeated short flicks remain deterministic in both directions",
    repeatedFlickDismissals === 8,
    `dismissed=${repeatedFlickDismissals}/8`
  );

  // === 7) allowed swipe dismisses once and reports its reason =============
  await page.evaluate(() => { window.__toastSwipeReasons = []; });
  await fireToast(page, "drag-dismiss");
  // Functions do not cross page.evaluate's structured-clone boundary; update
  // the toast in-page with the real callback after creating it.
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.update("drag-dismiss", {
      onDismiss: (_entry, detail) => window.__toastSwipeReasons.push(detail.reason),
    });
  });
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dx = 20; dx <= 160; dx += 20) await page.mouse.move(box.cx + dx, box.cy, { steps: 2 });
  await page.mouse.up();
  const dismissed = await page.waitForFunction(
    () => !document.querySelector('[data-toast-id="drag-dismiss"]'),
    { timeout: 2500 }
  ).then(() => true).catch(() => false);
  const swipeReasons = await page.evaluate(() => window.__toastSwipeReasons);
  check(
    "allowed edge swipe dismisses once with reason=swipe",
    dismissed && swipeReasons.join(",") === "swipe",
    `dismissed=${dismissed} reasons=${swipeReasons.join(",")}`
  );
  await clearToasts(page);

  // Auto direction follows a live document dir change. Logical start/end are
  // resolved from this same direction inside Toaster.
  await page.evaluate(() => { document.documentElement.dir = "rtl"; });
  await page.waitForFunction(() => document.querySelector(".Toaster")?.getAttribute("dir") === "rtl");
  const rtlDirection = await page.$eval(".Toaster", (element) => element.getAttribute("dir"));
  check("auto direction tracks RTL changes", rtlDirection === "rtl", `dir=${rtlDirection}`);
  await page.evaluate(() => { document.documentElement.dir = "ltr"; });

  // A mixed-axis configuration locks to the dominant initial movement instead
  // of silently preferring the horizontal direction.
  await clearToasts(page);
  await page.evaluate(async () => {
    document.getElementById("root")?.remove();
    const host = document.createElement("div");
    host.id = "mixed-axis-root";
    document.body.appendChild(host);
    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js")).default;
    const { Toaster } = await import("/src/velvet/Toaster.jsx");
    createRoot(host).render(
      ReactModule.createElement(Toaster, {
        position: "bottom-right",
        swipeDirections: ["top", "right"],
      })
    );
  });
  // Toaster portals to document.body so viewport positioning is never scoped
  // by the mounting component's layout or transforms.
  await page.waitForSelector("body > .Toaster");
  await sleep(40);
  check(
    "multiple Toasters produce a clear duplicate-render diagnostic",
    warnings.some((message) => message.includes("multiple <Toaster>") && message.includes("duplicate notifications")),
    warnings.slice(-2).join(" | ")
  );
  await fireToast(page, "drag-mixed-axis");
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dy = 20; dy <= 160; dy += 20) {
    await page.mouse.move(box.cx, box.cy - dy, { steps: 2 });
  }
  await page.mouse.up();
  const mixedAxisDismissed = await page.waitForFunction(
    () => !document.querySelector('[data-toast-id="drag-mixed-axis"]'),
    { timeout: 2500 }
  ).then(() => true).catch(() => false);
  check(
    "mixed swipeDirections honors vertical as well as horizontal dismissal",
    mixedAxisDismissed,
    `dismissed=${mixedAxisDismissed}`
  );

  // Exercise Chrome's actual touch input pipeline at a phone viewport. A
  // corner toast reserves horizontal dragging but must let a vertical page
  // pan begin directly over its surface.
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  await page.goto(new URL("/__velvet-toast-test", server.resolvedUrls.local[0]).href, { waitUntil: "load" });
  await page.addStyleTag({ path: resolve("src/velvet/Toaster.css") });
  const touchClient = await page.createCDPSession();
  await touchClient.send("Emulation.setTouchEmulationEnabled", { enabled: true, maxTouchPoints: 5 });
  await page.evaluate(async () => {
    document.body.replaceChildren();
    document.documentElement.style.height = "auto";
    Object.assign(document.body.style, {
      overflow: "auto",
      height: "auto",
      minHeight: "2200px",
      background: "white",
    });
    const host = document.createElement("div");
    host.id = "mobile-corner-root";
    document.body.appendChild(host);
    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js")).default;
    const { Toaster } = await import("/src/velvet/Toaster.jsx");
    window.__mobileToastRoot = createRoot(host);
    window.__mobileToastRoot.render(ReactModule.createElement(Toaster, { position: "bottom-right" }));
    window.scrollTo(0, 0);
  });
  await page.waitForSelector("body > .Toaster--bottom-right");
  await fireToast(page, "drag-mobile-page-scroll");
  box = await boxOf(page);
  await dragTouch(
    touchClient,
    { x: box.cx, y: box.cy },
    { x: box.cx, y: Math.max(40, box.cy - 150) },
    8
  );
  await sleep(240);
  const mobilePageScroll = await page.evaluate(() => ({
    scrollTop: Math.round(window.scrollY),
    exists: Boolean(document.querySelector('[data-toast-id="drag-mobile-page-scroll"]')),
    dragging: document.querySelector('[data-toast-id="drag-mobile-page-scroll"]')?.hasAttribute("data-dragging"),
  }));
  check(
    "vertical touch panning over a corner toast scrolls the page",
    mobilePageScroll.scrollTop > 20 && mobilePageScroll.exists && !mobilePageScroll.dragging,
    JSON.stringify(mobilePageScroll)
  );
  await clearToasts(page);

  // Center placements own the vertical axis instead. Render a fresh isolated
  // Toaster and verify its default up/down gesture with the same touch stream.
  await page.evaluate(async () => {
    window.__mobileToastRoot?.unmount();
    document.getElementById("mobile-corner-root")?.remove();
    document.querySelectorAll('[data-slot="toaster"], [data-slot="live-region"]').forEach((node) => node.remove());
    const host = document.createElement("div");
    host.id = "mobile-center-root";
    document.body.appendChild(host);
    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js")).default;
    const { Toaster } = await import("/src/velvet/Toaster.jsx");
    window.__mobileToastRoot = createRoot(host);
    window.__mobileToastRoot.render(ReactModule.createElement(Toaster, { position: "bottom-center" }));
  });
  await page.waitForSelector("body > .Toaster--bottom-center");
  await fireToast(page, "drag-mobile-center");
  box = await boxOf(page);
  const centerTouchAction = await page.$eval(
    '[data-toast-id="drag-mobile-center"]',
    (element) => getComputedStyle(element).touchAction
  );
  await dragTouch(
    touchClient,
    { x: box.cx, y: box.cy },
    { x: box.cx, y: box.cy - 90 },
    6
  );
  const mobileCenterDismissed = await waitForDismissal(page, "drag-mobile-center", 2200);
  check(
    "center toasts dismiss vertically through an emulated mobile touch stream",
    centerTouchAction === "pan-x" && mobileCenterDismissed,
    `touch-action=${centerTouchAction} dismissed=${mobileCenterDismissed}`
  );

  await fireToast(page, "drag-mobile-action-tap");
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    window.__mobileActionTaps = 0;
    toast.update("drag-mobile-action-tap", {
      action: {
        label: "Open",
        onClick: () => { window.__mobileActionTaps += 1; },
      },
    });
  });
  await page.waitForSelector('[data-toast-id="drag-mobile-action-tap"] [data-slot="action"]');
  const mobileActionTapBox = await page.$eval(
    '[data-toast-id="drag-mobile-action-tap"] [data-slot="action"]',
    (element) => {
      const rect = element.getBoundingClientRect();
      return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
    }
  );
  await touchClient.send("Input.dispatchTouchEvent", {
    type: "touchStart",
    touchPoints: [{ x: mobileActionTapBox.cx, y: mobileActionTapBox.cy, id: 2, force: 0.5 }],
  });
  await sleep(40);
  await touchClient.send("Input.dispatchTouchEvent", { type: "touchEnd", touchPoints: [] });
  const mobileActionTapDismissed = await waitForDismissal(page, "drag-mobile-action-tap", 2200);
  const mobileActionTaps = await page.evaluate(() => window.__mobileActionTaps);
  check(
    "a real mobile touch tap still activates a toast action once",
    mobileActionTapDismissed && mobileActionTaps === 1,
    `dismissed=${mobileActionTapDismissed} presses=${mobileActionTaps}`
  );
  await clearToasts(page);

  await fireToast(page, "drag-mobile-action-swipe");
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    window.__mobileActionSwipes = 0;
    window.__mobileActionReasons = [];
    toast.update("drag-mobile-action-swipe", {
      action: {
        label: "Open",
        onClick: () => { window.__mobileActionSwipes += 1; },
      },
      onDismiss: (_entry, detail) => window.__mobileActionReasons.push(detail.reason),
    });
  });
  await page.waitForSelector('[data-toast-id="drag-mobile-action-swipe"] [data-slot="action"]');
  const mobileActionSwipeBox = await page.$eval(
    '[data-toast-id="drag-mobile-action-swipe"] [data-slot="action"]',
    (element) => {
      const rect = element.getBoundingClientRect();
      return { cx: rect.x + rect.width / 2, cy: rect.y + rect.height / 2 };
    }
  );
  await dragTouch(
    touchClient,
    { x: mobileActionSwipeBox.cx, y: mobileActionSwipeBox.cy },
    { x: mobileActionSwipeBox.cx, y: mobileActionSwipeBox.cy - 90 },
    6
  );
  const mobileActionSwipeDismissed = await waitForDismissal(page, "drag-mobile-action-swipe", 2200);
  const mobileActionSwipeResult = await page.evaluate(() => ({
    presses: window.__mobileActionSwipes,
    reasons: window.__mobileActionReasons,
  }));
  check(
    "a real mobile drag from an action swipes without firing its click",
    mobileActionSwipeDismissed &&
      mobileActionSwipeResult.presses === 0 &&
      mobileActionSwipeResult.reasons.join(",") === "swipe",
    `dismissed=${mobileActionSwipeDismissed} result=${JSON.stringify(mobileActionSwipeResult)}`
  );
  await touchClient.detach();

  check("no page/runtime errors", errors.length === 0, errors.slice(0, 4).join(" | "));
  console.log("\n--- TOAST DRAG ASSERTIONS ---");
  results.forEach((result) => console.log(result));
  console.log(passed ? "\nALL PASS\n" : "\nFAILED\n");
} catch (error) {
  console.error("harness error:", error);
  passed = false;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(passed ? 0 : 1);
}
