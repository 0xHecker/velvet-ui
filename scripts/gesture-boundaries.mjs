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
      const view = document.querySelector(
        selector.replace(' [data-velvet="scroll"]', ''),
      );
      const contentArea = document.querySelector(
        `${selector.replace(' [data-velvet="scroll"]', '')} [data-velvet="content-area"]`,
      );
      const viewRect = view?.getBoundingClientRect();
      const contentRect = contentArea?.getBoundingClientRect();
      const viewStyles = view ? getComputedStyle(view) : null;
      window.__gestureTrace.push({
        progress: window.__velvet?.count() ? window.__velvet.progress() : null,
        top: scroll?.scrollTop ?? null,
        visualTop: viewRect && contentRect ? contentRect.top - viewRect.top : null,
        visible:
          Boolean(view) &&
          viewStyles?.visibility !== "hidden" &&
          viewStyles?.display !== "none" &&
          Number.parseFloat(viewStyles?.opacity || "1") > 0,
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

const visualMotionStats = (trace, epsilon = 2) => {
  const values = trace
    .filter((sample) => sample.visible !== false)
    .map((sample) => sample.visualTop)
    .filter((value) => typeof value === "number");
  let maxJump = 0;
  let direction = 0;
  let turns = 0;
  for (let index = 1; index < values.length; index++) {
    const delta = values[index] - values[index - 1];
    maxJump = Math.max(maxJump, Math.abs(delta));
    if (Math.abs(delta) < epsilon) continue;
    const nextDirection = Math.sign(delta);
    if (direction && nextDirection !== direction) turns++;
    direction = nextDirection;
  }
  return { maxJump, turns, samples: values.length };
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

// Desktop trackpads emit wheel-backed scroll gestures rather than touch
// events. Keep this separate from `swipe` so both browser-native paths are
// exercised against the real hidden snap scroller.
const wheelSwipe = async (page, { x = 640, y = 420, distance }) => {
  await page.mouse.move(x, y);
  await page.mouse.wheel({ deltaY: -distance });
};

const runQuickViewDismissalRace = async (page, client) => {
  // The 720px browser surface produces the same half-layout-pixel clamp as
  // the in-app browser path that originally stranded Quick View.
  await page.setViewport({ width: 1280, height: 720, hasTouch: true });
  const openQuickView = async () => {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".Gallery");
    await open(page, "detached");
  };

  await openQuickView();
  await page.$eval(ACTUAL_SCROLL, (scroll) => scroll.scrollTo({ top: 0, left: 0 }));
  await sleep(500);
  const singleEventDismissed = await state(page);
  check(
    "quick-view: a single closed-boundary scroll event cannot be eaten by stale suppression",
    singleEventDismissed.count === 0,
    JSON.stringify(singleEventDismissed),
  );

  await openQuickView();
  await wheelSwipe(page, { y: 520, distance: 1200 });
  await sleep(500);
  const wheelDismissed = await state(page);
  check(
    "quick-view: a desktop swipe to the closed snap commits dismissal",
    wheelDismissed.count === 0,
    JSON.stringify(wheelDismissed),
  );

  await openQuickView();
  await startTrace(page);
  await swipe(client, { y: 650, distance: 1200, speed: 8000 });
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 3000 });
  const settledFastTrace = await stopTrace(page);
  const settledFastMotion = visualMotionStats(settledFastTrace, 1);
  check(
    "quick-view: a high-velocity settled dismissal remains visually monotonic",
    settledFastMotion.turns === 0 &&
      settledFastMotion.samples >= 3 &&
      settledFastMotion.maxJump < 180,
    JSON.stringify(settledFastMotion),
  );

  await openQuickView();
  await wheelSwipe(page, { y: 520, distance: 1200 });
  await page.waitForFunction(
    () => {
      const view = document.querySelector('[data-velvet="view"]:not([data-velvet-preview])');
      return window.__velvet?.count() === 0 || view?.inert || getComputedStyle(view).display === "none";
    },
    { timeout: 2000 },
  );
  // The interaction layer must release synchronously at the closed boundary,
  // even while the wheel-tail guard is still preventing background scroll.
  await page.click('.Nav-tab[data-view="toasts"]');
  const immediateClickWorked = await page.$eval(
    '.Nav-tab[data-view="toasts"]',
    (element) => element.getAttribute("aria-selected") === "true",
  );
  // Reverse immediately. A committed dismissal must not remain as a live snap
  // track that can rise from dead or reclaim the page after the next click.
  await wheelSwipe(page, { y: 520, distance: -1200 });
  await sleep(180);
  const afterReverse = await state(page);
  check(
    "quick-view: an immediate reverse swipe cannot resurrect or leave a click ghost",
    afterReverse.count === 0 && immediateClickWorked,
    `${JSON.stringify(afterReverse)} nextClick=${immediateClickWorked}`,
  );

  await openQuickView();
  const closingTouch = swipe(client, { y: 650, distance: 1200, speed: 4800 });
  await page.waitForFunction(
    () => window.__velvet?.count() === 0 || (window.__velvet?.progress() ?? 1) < 0.08,
    { timeout: 3000 },
  );
  const reversingTouch = swipe(client, { y: 650, distance: -600, speed: 3000 });
  await Promise.all([closingTouch, reversingTouch]);
  await sleep(900);
  const afterTouchReverse = await state(page);
  await page.click('.Nav-tab[data-view="toasts"]');
  const toastTabSelected = await page.$eval(
    '.Nav-tab[data-view="toasts"]',
    (element) => element.getAttribute("aria-selected") === "true",
  );
  check(
    "quick-view: overlapping touch swipes cannot resurrect or block a real next click",
    afterTouchReverse.count === 0 && toastTabSelected,
    `${JSON.stringify(afterTouchReverse)} nextClick=${toastTabSelected}`,
  );

  await openQuickView();
  await wheelSwipe(page, { y: 520, distance: 1200 });
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 2000 });
  await page.$eval(
    '[data-shot="detached"] .Card-trigger [data-velvet-trigger]',
    (element) => element.click(),
  );
  await page.waitForFunction(() => window.__velvet?.count() === 1, { timeout: 2000 });
  // The old wheel-tail guard may outlive the dismissed DOM, but it must never
  // retain a delayed state mutation capable of closing a fresh presentation.
  await sleep(180);
  const reopenedBeforeTailExpired = await state(page);
  check(
    "quick-view: a stale native-dismiss timer cannot close a rapid reopen",
    reopenedBeforeTailExpired.count === 1 && reopenedBeforeTailExpired.progress > 0,
    JSON.stringify(reopenedBeforeTailExpired),
  );
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 5000 });
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 5000 });
  await page.setViewport({ width: 1280, height: 860, hasTouch: true });
};

const runQuickViewFastSwipeProbe = async (page, client) => {
  await page.setViewport({ width: 1280, height: 720, hasTouch: true });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await startTrace(page);
  await page.$eval(
    '[data-shot="detached"] .Card-trigger [data-velvet-trigger]',
    (element) => element.click(),
  );
  await page.waitForSelector(ACTUAL_VIEW, { timeout: 3000 });
  const fastSwipeDelay = Number(process.env.VELVET_FAST_SWIPE_DELAY_MS ?? 0);
  if (fastSwipeDelay > 0) await sleep(fastSwipeDelay);
  const swipeStartState = await page.evaluate((selector) => {
    const scroll = document.querySelector(selector);
    return {
      idle: window.__velvet?.idle(),
      progress: window.__velvet?.progress(),
      overflow: scroll ? getComputedStyle(scroll).overflow : null,
    };
  }, ACTUAL_SCROLL);
  const swipeStartedAt = await page.evaluate(() => window.__gestureTrace?.length ?? 0);
  await swipe(client, { y: 650, distance: 1200, speed: 4800 });
  await sleep(1400);
  const trace = (await stopTrace(page)).slice(swipeStartedAt);
  const finalState = await state(page);
  const motion = visualMotionStats(trace, 1);
  const visual = trace
    .filter((sample) => sample.visible !== false)
    .map((sample) => sample.visualTop)
    .filter((value) => typeof value === "number")
    .map((value) => Math.round(value * 10) / 10);
  check(
    "quick-view: native input cannot fight WAAPI across the entrance handoff",
    ((finalState.count === 1 && finalState.idle && finalState.progress > 0.99) ||
      (finalState.count === 0 && finalState.idle)) &&
      motion.turns === 0 &&
      motion.maxJump < 180,
    `start=${JSON.stringify(swipeStartState)} state=${JSON.stringify(finalState)} motion=${JSON.stringify(motion)} visual=${JSON.stringify(visual)}`,
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 5000 });
  await page.setViewport({ width: 1280, height: 860, hasTouch: true });
};

const runPersistentRapidClose = async (page) => {
  await page.setViewport({ width: 540, height: 707, hasTouch: true });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await startTrace(page);
  await page.$eval(
    '[data-shot="persistent"] .Card-trigger [data-velvet-trigger]',
    (element) => element.click(),
  );
  await page.waitForSelector(`${ACTUAL_VIEW} [aria-label="Close player"]`);
  const beforeRapidClose = await state(page);
  // Reproduce the user-visible race: dismiss as soon as the real close control
  // mounts, while the entrance spring still owns its first frames.
  const rapidCloseDelay = Number(process.env.VELVET_RAPID_CLOSE_MS ?? 16);
  if (rapidCloseDelay > 0) await sleep(rapidCloseDelay);
  const closeDisabledDuringEntrance = await page.$eval(
    `${ACTUAL_VIEW} [aria-label="Close player"]`,
    (element) => element.disabled,
  );
  const closeStartedAt = await page.evaluate(() => window.__gestureTrace?.length ?? 0);
  await page.$eval(`${ACTUAL_VIEW} [aria-label="Close player"]`, (element) =>
    element.click()
  );
  await sleep(1200);
  const rapidCloseTrace = (await stopTrace(page)).slice(closeStartedAt);
  const rapidClose = await state(page);
  const rapidCloseMotion = visualMotionStats(rapidCloseTrace, 1);
  const rapidVisual = rapidCloseTrace
    .filter((sample) => sample.visible !== false)
    .map((sample) => sample.visualTop)
    .filter(Number.isFinite)
    .map((value) => Math.round(value * 10) / 10);
  check(
    "persistent: close is disabled while the entrance spring owns the sheet",
    closeDisabledDuringEntrance &&
      rapidClose.count === 1 &&
      rapidClose.idle &&
      rapidClose.progress > 0 &&
      rapidCloseMotion.turns <= 1 &&
      rapidCloseMotion.maxJump < 120,
    `disabled=${closeDisabledDuringEntrance} before=${JSON.stringify(beforeRapidClose)} after=${JSON.stringify(rapidClose)} motion=${JSON.stringify(rapidCloseMotion)} visual=${JSON.stringify(rapidVisual)}`,
  );

  await startTrace(page);
  const closeEnabledAfterEntrance = await page.$eval(
    `${ACTUAL_VIEW} [aria-label="Close player"]`,
    (element) => !element.disabled,
  );
  await page.$eval(`${ACTUAL_VIEW} [aria-label="Close player"]`, (element) =>
    element.click()
  );
  await sleep(1500);
  const settledCloseTrace = await stopTrace(page);
  const settledClose = await state(page);
  const settledCloseMotion = visualMotionStats(settledCloseTrace, 1);
  const settledCloseVisual = settledCloseTrace
    .filter((sample) => sample.visible !== false)
    .map((sample) => sample.visualTop)
    .filter(Number.isFinite)
    .map((value) => Math.round(value * 10) / 10);
  check(
    "persistent: the same close dismisses monotonically after entrance settles",
    closeEnabledAfterEntrance &&
      settledClose.count === 0 &&
      settledClose.idle &&
      settledCloseMotion.turns === 0 &&
      settledCloseMotion.maxJump < 40,
    `enabled=${closeEnabledAfterEntrance} after=${JSON.stringify(settledClose)} motion=${JSON.stringify(settledCloseMotion)} visual=${JSON.stringify(settledCloseVisual)}`,
  );

  await open(page, "bottom-sheet");
  await startTrace(page);
  await page.$eval(`${ACTUAL_VIEW} [data-velvet="backdrop"]`, (element) =>
    element.click()
  );
  await sleep(1500);
  const backdropCloseTrace = await stopTrace(page);
  const backdropClose = await state(page);
  const backdropCloseMotion = visualMotionStats(backdropCloseTrace, 1);
  check(
    "backdrop: clicking outside accepts one monotonic exit and stays closed",
    backdropClose.count === 0 &&
      backdropClose.idle &&
      backdropCloseMotion.turns === 0 &&
      backdropCloseMotion.maxJump < 120,
    `after=${JSON.stringify(backdropClose)} motion=${JSON.stringify(backdropCloseMotion)}`,
  );
};

const runPersistentProgrammaticOwnership = async (page, client) => {
  const viewport = { width: 540, height: 707, hasTouch: true };
  await page.setViewport(viewport);
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await open(page, "persistent");

  await startTrace(page);
  await page.click(`${ACTUAL_VIEW} [aria-label="Expand player"]`);
  await swipe(client, {
    x: viewport.width / 2,
    y: viewport.height - 57,
    distance: 560,
    speed: 4800,
  });
  await page.waitForFunction(
    () => window.__velvet?.idle() && (window.__velvet?.progress() ?? 0) > 0.99,
    { timeout: 8000 },
  );
  const expandTrace = await stopTrace(page);
  const expandState = await state(page);
  const expandMotion = visualMotionStats(expandTrace, 1);
  check(
    "persistent: native input cannot fight a programmatic expansion",
    expandState.count === 1 &&
      expandState.progress > 0.99 &&
      expandMotion.turns === 0,
    `${JSON.stringify(expandState)} motion=${JSON.stringify(expandMotion)}`,
  );

  await startTrace(page);
  await page.click(`${ACTUAL_VIEW} [data-velvet="handle"]`);
  await swipe(client, {
    x: viewport.width / 2,
    y: viewport.height - 57,
    distance: -560,
    speed: 4800,
  });
  await page.waitForFunction(
    () => {
      const progress = window.__velvet?.progress() ?? 1;
      return window.__velvet?.idle() && progress > 0.04 && progress < 0.35;
    },
    { timeout: 8000 },
  );
  const collapseTrace = await stopTrace(page);
  const collapseState = await state(page);
  const collapseMotion = visualMotionStats(collapseTrace, 1);
  check(
    "persistent: native input cannot fight a programmatic collapse",
    collapseState.count === 1 &&
      collapseState.progress > 0.04 &&
      collapseState.progress < 0.35 &&
      collapseMotion.turns === 0,
    `${JSON.stringify(collapseState)} motion=${JSON.stringify(collapseMotion)}`,
  );

  await page.click(`${ACTUAL_VIEW} [aria-label="Close player"]`);
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
};

const runPersistentDismissDuringSwipe = async (page, client) => {
  const viewport = { width: 540, height: 707, hasTouch: true };
  await page.setViewport(viewport);

  for (const source of ["close control", "Escape"]) {
    await page.reload({ waitUntil: "load" });
    await page.waitForSelector(".Gallery");
    await open(page, "persistent");
    const initial = await state(page);
    await startTrace(page);
    const nativeSwipe = swipe(client, {
      x: viewport.width / 2,
      y: viewport.height - 57,
      distance: -500,
      speed: 2600,
    });
    await page.waitForFunction(
      (start) => (window.__velvet?.progress() ?? start) > start + 0.035,
      { timeout: 2000 },
      initial.progress,
    );
    const closeMark = await page.evaluate(() => window.__gestureTrace?.length ?? 0);
    if (source === "Escape") {
      await page.keyboard.press("Escape");
    } else {
      await page.$eval(`${ACTUAL_VIEW} [aria-label="Close player"]`, (element) =>
        element.click()
      );
    }
    await nativeSwipe;
    await page.waitForFunction(
      () => window.__velvet?.idle() && (window.__velvet?.progress() ?? 0) > 0.95,
      { timeout: 8000 },
    );
    const trace = (await stopTrace(page)).slice(closeMark);
    const rejectedState = await state(page);
    const nativeMotion = visualMotionStats(trace);
    check(
      `persistent: ${source} is rejected while native travel is between detents`,
      rejectedState.count === 1 && rejectedState.progress > 0.95 && rejectedState.idle,
      JSON.stringify(rejectedState),
    );
    check(
      `persistent: ${source} does not interrupt native momentum`,
      nativeMotion.turns === 0 &&
        nativeMotion.samples >= 3 &&
        nativeMotion.maxJump < viewport.height * 0.16,
      JSON.stringify(nativeMotion),
    );
  }

  await startTrace(page);
  await page.click(`${ACTUAL_VIEW} [aria-label="Close player"]`);
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  const stableCloseTrace = await stopTrace(page);
  const stableCloseState = await state(page);
  const stableCloseMotion = visualMotionStats(stableCloseTrace);
  check(
    "persistent: close from a settled detent fully unmounts without a motion glitch",
    stableCloseState.count === 0 && stableCloseState.idle &&
      stableCloseMotion.turns === 0 && stableCloseMotion.maxJump < viewport.height * 0.3,
    `${JSON.stringify(stableCloseState)} motion=${JSON.stringify(stableCloseMotion)}`,
  );
};

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

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  await page.$eval(
    '[data-shot="bottom-sheet"] .Card-trigger [data-velvet-trigger]',
    (element) => element.click(),
  );
  await sleep(40);
  await page.keyboard.press("Escape");
  await sleep(900);
  const earlyEscape = await state(page);
  check(
    "an entrance-owned Escape cannot reverse or glitch the active spring",
    earlyEscape.count === 1 && earlyEscape.idle && earlyEscape.progress > 0.99,
    JSON.stringify(earlyEscape),
  );

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  const settledEscape = await state(page);
  const pageInteractive = await page.$eval('[data-shot="bottom-sheet"] .Card-preview', (element) => {
    const rect = element.getBoundingClientRect();
    const hit = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    return hit === element || element.contains(hit);
  });
  check(
    "Escape dismisses after entrance settles with no interaction ghost",
    settledEscape.count === 0 && pageInteractive,
    `${JSON.stringify(settledEscape)} clickable=${pageInteractive}`,
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
  page.on("pageerror", (error) => {
    pass = false;
    console.error("PAGE ERROR", error.stack || String(error));
  });
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, hasTouch: true });
  await page.goto(base, { waitUntil: "load" });
  const client = await page.createCDPSession();
  const only = process.env.VELVET_GESTURE_CASE;

  console.log("\n--- NATIVE GESTURE BOUNDARIES ---");
  if (!only || only === "dual") await runDualTracks(page, client);
  if (!only || only === "dismissal") await runDismissalUnlock(page, client);
  if (!only || only === "quick-view") await runQuickViewDismissalRace(page, client);
  if (!only || only === "quick-fast") await runQuickViewFastSwipeProbe(page, client);
  if (!only || only === "long-sheet") await runLongBoundary(page, client, "long-sheet");
  if (!only || only === "parallax") await runLongBoundary(page, client, "parallax");
  if (!only || only === "persistent") await runPersistent(page, client);
  if (!only || only === "persistent-rapid") await runPersistentRapidClose(page);
  if (!only || only === "persistent-programmatic") {
    await runPersistentProgrammaticOwnership(page, client);
  }
  if (!only || only === "persistent-dismiss-swipe") {
    await runPersistentDismissDuringSwipe(page, client);
  }
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
