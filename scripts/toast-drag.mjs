// Production toast gesture verification. Toaster intentionally has no CSS
// side-effect import, so this harness opts into the public stylesheet explicitly
// and drives real pointer events against the playground's real <Toaster />.
import { createServer } from "vite";
import puppeteer from "puppeteer";
import { resolve } from "node:path";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server;
let browser;
let passed = true;
const results = [];
const errors = [];
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

try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error)}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Failed to load resource|favicon\.ico|status of 404/i.test(text)) return;
    errors.push(text);
  });
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await page.addStyleTag({ path: resolve("src/velvet/Toaster.css") });
  await page.click('.Nav-tab[data-view="toasts"]');
  await page.waitForSelector(".Toastpg");

  // === 1) release cannot strand a gesture or keep following the pointer ===
  await fireToast(page, "drag-release");
  let box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  for (let dx = 16; dx <= 96; dx += 16) await page.mouse.move(box.cx - dx, box.cy, { steps: 2 });
  const during = await transformOf(page);
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
  await page.mouse.move(box.cx - 100, box.cy, { steps: 5 });
  await page.mouse.up();
  await sleep(24);
  const springOffset = await transformOf(page);
  box = await boxOf(page);
  await page.mouse.move(box.cx, box.cy);
  await page.mouse.down();
  await page.mouse.move(box.cx - 34, box.cy, { steps: 3 });
  const regrabOffset = await transformOf(page);
  const regrabDragging = await page.$eval(".Toast", (element) => element.dataset.state === "dragging");
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

  // === 6) allowed swipe dismisses once and reports its reason =============
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
  await page.waitForSelector("#mixed-axis-root .Toaster");
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
