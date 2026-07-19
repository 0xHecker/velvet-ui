// Regression harness for native touch gesture ownership and scroll handoff.
// It intentionally uses CDP's compositor-level touch scroll gesture instead of
// mouse dragging so the browser's native momentum and scroll-snap paths run.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const watchdog = setTimeout(() => process.exit(1), 120000);
watchdog.unref();

const ACTUAL_VIEW = '[data-velvet="view"]:not([data-velvet-preview])';
const ACTUAL_SCROLL = `${ACTUAL_VIEW} [data-velvet="scroll"]`;

let server;
let browser;
let pass = true;

const check = (name, ok, info = "") => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  ${info}` : ""}`);
};

const open = async (page, id) => {
  await page.$eval(`[data-shot="${id}"] .Card-trigger [data-velvet-trigger]`, (element) =>
    element.click()
  );
  await page.waitForSelector(ACTUAL_VIEW, { timeout: 5000 });
  await page.waitForFunction(
    () => window.__velvet?.count() > 0 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  // Avoid the transient idle frame between mount and the double-rAF entrance.
  await sleep(700);
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 8000 });
};

const state = (page) =>
  page.evaluate((selector) => {
    const scroll = document.querySelector(selector);
    const inner = document.querySelector(
      `${selector.replace(' [data-velvet="scroll"]', '')} [data-velvet-scroll="view"]`,
    );
    return {
      count: window.__velvet?.count() || 0,
      progress: window.__velvet?.count() ? window.__velvet.progress() : 0,
      idle: window.__velvet?.idle() ?? true,
      top: scroll?.scrollTop ?? null,
      max: scroll ? scroll.scrollHeight - scroll.clientHeight : null,
      client: scroll?.clientHeight ?? null,
      innerTop: inner?.scrollTop ?? null,
      innerMax: inner ? inner.scrollHeight - inner.clientHeight : null,
    };
  }, ACTUAL_SCROLL);

const startTrace = (page) =>
  page.evaluate((selector) => {
    window.__gestureTrace = [];
    window.__traceGestures = true;
    const loop = () => {
      if (!window.__traceGestures) return;
      const scroll = document.querySelector(selector);
      window.__gestureTrace.push({
        progress: window.__velvet?.count() ? window.__velvet.progress() : null,
        top: scroll?.scrollTop ?? null,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, ACTUAL_SCROLL);

const stopTrace = (page) =>
  page.evaluate(() => {
    window.__traceGestures = false;
    return window.__gestureTrace || [];
  });

const maxReverse = (trace, direction) => {
  let extreme = direction === "up" ? -Infinity : Infinity;
  let reversal = 0;
  for (const sample of trace) {
    const value = sample.progress;
    if (typeof value !== "number") continue;
    if (direction === "up") {
      extreme = Math.max(extreme, value);
      reversal = Math.max(reversal, extreme - value);
    } else {
      extreme = Math.min(extreme, value);
      reversal = Math.max(reversal, value - extreme);
    }
  }
  return reversal;
};

const meaningfulTurns = (trace, epsilon = 0.008) => {
  let previous;
  let direction = 0;
  let turns = 0;
  for (const sample of trace) {
    const value = sample.progress;
    if (typeof value !== "number") continue;
    if (previous == null) {
      previous = value;
      continue;
    }
    const delta = value - previous;
    previous = value;
    if (Math.abs(delta) < epsilon) continue;
    const nextDirection = Math.sign(delta);
    if (direction && nextDirection !== direction) turns++;
    direction = nextDirection;
  }
  return turns;
};

const swipe = (client, { x = 640, y = 420, distance, speed = 5000 }) =>
  client.send("Input.synthesizeScrollGesture", {
    x,
    y,
    xDistance: 0,
    yDistance: distance,
    speed,
    gestureSourceType: "touch",
    repeatCount: 0,
  });

const runLongBoundary = async (page, client, id) => {
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await open(page, id);
  await page.evaluate((selector) => {
    const view = document.querySelector(selector);
    const inner = view.querySelector('[data-velvet-scroll="view"]');
    inner.scrollTop = inner.scrollHeight;
  }, ACTUAL_VIEW);
  await sleep(320);

  const before = await state(page);
  await startTrace(page);
  let first = before;
  for (let attempt = 0; attempt < 6 && first.count === 1 && first.innerTop > 0; attempt++) {
    await swipe(client, { distance: 1500, speed: 6000 });
    await sleep(750);
    first = await state(page);
    check(
      `${id}: content-scroll gesture ${attempt + 1} does not dismiss the sheet`,
      first.count === 1,
      JSON.stringify(first),
    );
  }
  const boundaryTrace = await stopTrace(page);
  check(
    `${id}: first downward swipe stops at the open boundary`,
    first.count === 1 && first.progress > 0.95 && first.innerTop < 2,
    JSON.stringify(first),
  );
  if (first.count !== 1) {
    const compact = boundaryTrace
      .filter((_, index) => index % 3 === 0)
      .map((sample) => `${sample.top}:${sample.progress == null ? "x" : sample.progress.toFixed(2)}`)
      .join(" ");
    console.log(`TRACE ${id} before=${JSON.stringify(before)} ${compact}`);
  }

  if (first.count === 1) {
    await swipe(client, { distance: 1000, speed: 4500 });
    await sleep(900);
  }
  const second = await state(page);
  check(`${id}: a second downward swipe dismisses`, second.count === 0, JSON.stringify(second));
};

const runPersistent = async (page, client) => {
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await open(page, "persistent");

  const overlappingSwipe = swipe(client, { y: 810, distance: -560, speed: 2600 });
  await page.waitForFunction(() => window.__velvet && !window.__velvet.idle(), {
    timeout: 2000,
  });
  await page.$eval(`${ACTUAL_VIEW} [data-velvet="handle"]`, (element) => element.click());
  await overlappingSwipe;
  await page.waitForFunction(
    () => {
      const velvet = window.__velvet;
      const progress = velvet?.progress();
      return velvet?.idle() && progress > 0.04 && progress < 0.35;
    },
    { timeout: 8000 },
  ).catch(() => {});
  await sleep(80);
  const overlapSettled = await state(page);
  check(
    "persistent: handle pressed during native swipe queues behind its settled detent",
    overlapSettled.count === 1 && overlapSettled.progress > 0.04 &&
      overlapSettled.progress < 0.35 && overlapSettled.idle,
    JSON.stringify(overlapSettled),
  );

  await startTrace(page);
  await swipe(client, { y: 810, distance: -560, speed: 2600 });
  await sleep(1200);
  const upTrace = await stopTrace(page);
  const expanded = await state(page);
  const upReverse = maxReverse(upTrace, "up");
  check(
    "persistent: upward swipe expands to the full detent",
    expanded.count === 1 && expanded.progress > 0.95 && expanded.idle,
    `${JSON.stringify(expanded)} reverse=${upReverse.toFixed(3)}`,
  );
  check("persistent: upward release has no visible reversal", upReverse < 0.08, `reverse=${upReverse.toFixed(3)}`);

  if (expanded.count === 1 && expanded.progress < 0.95) {
    const expand = `${ACTUAL_VIEW} [aria-label="Expand player"]`;
    if (await page.$(expand)) {
      await page.click(expand);
      await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 8000 }).catch(() => {});
    }
  }

  await startTrace(page);
  await swipe(client, { y: 300, distance: 560, speed: 2600 });
  await sleep(1200);
  const downTrace = await stopTrace(page);
  const collapsed = await state(page);
  const downReverse = maxReverse(downTrace, "down");
  const downTurns = meaningfulTurns(downTrace);
  check(
    "persistent: downward swipe collapses but never dismisses",
    collapsed.count === 1 && collapsed.progress > 0.04 && collapsed.progress < 0.35 && collapsed.idle,
    `${JSON.stringify(collapsed)} reverse=${downReverse.toFixed(3)}`,
  );
  check(
    "persistent: downward release has one clean native-snap settle",
    downTurns <= 1 && downReverse < 0.2,
    `turns=${downTurns} rebound=${downReverse.toFixed(3)}`,
  );

  await page.click(`${ACTUAL_VIEW} [data-velvet="handle"]`);
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 8000 });
  await sleep(80);
  const handleExpanded = await state(page);
  check(
    "persistent: handle expands with one programmatic spring",
    handleExpanded.count === 1 && handleExpanded.progress > 0.99,
    JSON.stringify(handleExpanded),
  );

  await page.click(`${ACTUAL_VIEW} [data-velvet="handle"]`);
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 8000 });
  await sleep(80);
  const handleCollapsed = await state(page);
  check(
    "persistent: handle collapses cleanly to its first detent",
    handleCollapsed.count === 1 && handleCollapsed.progress > 0.04 &&
      handleCollapsed.progress < 0.35,
    JSON.stringify(handleCollapsed),
  );

  await page.click(`${ACTUAL_VIEW} [aria-label="Close player"]`);
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  const programmaticClosed = await state(page);
  check(
    "persistent: explicit close fully unmounts the interaction layer",
    programmaticClosed.count === 0,
    JSON.stringify(programmaticClosed),
  );

  await page.$eval('[data-shot="persistent"] .Card-trigger [data-velvet-trigger]', (element) =>
    element.click()
  );
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  await sleep(300);
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 2000 });
  const persistentReopened = await state(page);
  check(
    "persistent: opens again without stale motion state",
    persistentReopened.count === 1 && persistentReopened.progress > 0.04 &&
      persistentReopened.progress < 0.35 && persistentReopened.idle,
    JSON.stringify(persistentReopened),
  );

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  const escapeClosed = await state(page);
  check(
    "persistent: Escape dismisses even though swipe dismissal is disabled",
    escapeClosed.count === 0,
    JSON.stringify(escapeClosed),
  );
};

const runDualTracks = async (page, client) => {
  const openModal = async () => {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".Gallery");
    await open(page, "modal");
    return state(page);
  };

  const centered = await openModal();
  check(
    "dual track: modal opens at the centered snap point",
    centered.count === 1 && centered.progress > 0.99 &&
      Math.abs(centered.top - centered.max / 2) < 3,
    JSON.stringify(centered),
  );
  await swipe(client, { distance: -1200, speed: 5200 });
  await sleep(1100);
  const upward = await state(page);
  check("dual track: upward swipe dismisses upward", upward.count === 0, JSON.stringify(upward));

  await openModal();
  await swipe(client, { distance: 1200, speed: 5200 });
  await sleep(1100);
  const downward = await state(page);
  check("dual track: downward swipe dismisses downward", downward.count === 0, JSON.stringify(downward));
};

const runDismissalUnlock = async (page, client) => {
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await open(page, "bottom-sheet");
  const backdropOpacity = await page.$eval(
    `${ACTUAL_VIEW} [data-velvet="backdrop"]`,
    (element) => Number.parseFloat(getComputedStyle(element).opacity),
  );
  check(
    "programmatic entrance animates and retains the real backdrop",
    backdropOpacity > 0.35,
    `opacity=${backdropOpacity}`,
  );
  await swipe(client, { distance: 1200, speed: 4800 });
  await sleep(900);
  const dismissed = await state(page);
  check(
    "closed snap unmounts the sheet instead of leaving a click-blocking ghost",
    dismissed.count === 0,
    JSON.stringify(dismissed),
  );

  await swipe(client, { distance: -500, speed: 2400 });
  await sleep(450);
  const afterReverse = await state(page);
  check(
    "reverse swipe cannot resurrect a dismissed sheet",
    afterReverse.count === 0,
    JSON.stringify(afterReverse),
  );

  await page.$eval('[data-shot="modal"] .Card-trigger [data-velvet-trigger]', (element) =>
    element.click()
  );
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  const reopened = await state(page);
  check(
    "the next card remains clickable without reloading",
    reopened.count === 1 && reopened.progress > 0.99,
    JSON.stringify(reopened),
  );
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4328, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, hasTouch: true });
  await page.goto(base, { waitUntil: "load" });
  const client = await page.createCDPSession();
  const only = process.env.VELVET_GESTURE_CASE;

  console.log("\n--- NATIVE GESTURE BOUNDARIES ---");
  if (!only || only === "dual") await runDualTracks(page, client);
  if (!only || only === "dismissal") await runDismissalUnlock(page, client);
  if (!only || only === "long-sheet") await runLongBoundary(page, client, "long-sheet");
  if (!only || only === "parallax") await runLongBoundary(page, client, "parallax");
  if (!only || only === "persistent") await runPersistent(page, client);
  console.log(pass ? "\nALL PASS\n" : "\nFAILED\n");
} catch (error) {
  console.error("harness error:", error);
  pass = false;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(pass ? 0 : 1);
}
