// Behavioral SheetStack assertion: opening a second (nested) sheet drives the
// lower sheet's content with Silk's public stack transform.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser, pass = true;
const ACTUAL_VIEW = '[data-velvet="view"]:not([data-velvet-preview])';
const ACTUAL_STACK = `${ACTUAL_VIEW} [data-velvet="content"].Stack-content`;
const check = (name, ok, info = "") => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${info}`);
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

const startStackedExitTrace = (page, contentClass = "Stack-content") =>
  page.evaluate(({ viewSelector, contentClass }) => {
    window.__stackedExitTrace = [];
    window.__traceStackedExit = true;
    const loop = () => {
      if (!window.__traceStackedExit) return;
      const views = [...document.querySelectorAll(viewSelector)];
      const parent = views[0];
      const front = views.at(-1);
      const parentContent = parent?.querySelector(
        `[data-velvet="content"].${contentClass}`,
      );
      const frontContent = front?.querySelector(
        `[data-velvet="content"].${contentClass}`,
      );
      const frontStyle = front ? getComputedStyle(front) : null;
      const childVisible = Boolean(
        views.length > 1 &&
          front &&
          !front.inert &&
          frontStyle?.visibility !== "hidden" &&
          Number(frontStyle?.opacity ?? 1) > 0.001,
      );
      const frontBackdrop =
        views.length > 1
          ? front?.querySelector('[data-velvet="backdrop"]')
          : null;
      const parentMatrix = parentContent
        ? new DOMMatrixReadOnly(getComputedStyle(parentContent).transform)
        : null;
      window.__stackedExitTrace.push({
        count: views.length,
        frontTop: views.length > 1 ? frontContent?.getBoundingClientRect().top ?? null : null,
        childVisible,
        childVisibility: frontStyle?.visibility ?? null,
        childOpacity: Number.parseFloat(frontStyle?.opacity ?? "1"),
        childBackdropOpacity: Number.parseFloat(
          frontBackdrop ? getComputedStyle(frontBackdrop).opacity || "0" : "0",
        ),
        parentScale: parentMatrix ? Math.hypot(parentMatrix.a, parentMatrix.b) : null,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, { viewSelector: ACTUAL_VIEW, contentClass });

const stopStackedExitTrace = (page) =>
  page.evaluate(() => {
    window.__traceStackedExit = false;
    return window.__stackedExitTrace || [];
  });

const motionStats = (values, expectedDirection, epsilon) => {
  let direction = 0;
  let turns = 0;
  let wrongWay = 0;
  let maxJump = 0;
  for (let index = 1; index < values.length; index++) {
    const delta = values[index] - values[index - 1];
    maxJump = Math.max(maxJump, Math.abs(delta));
    if (Math.abs(delta) < epsilon) continue;
    const nextDirection = Math.sign(delta);
    if (direction && nextDirection !== direction) turns++;
    if (nextDirection !== expectedDirection) wrongWay = Math.max(wrongWay, Math.abs(delta));
    direction = nextDirection;
  }
  return { samples: values.length, turns, wrongWay, maxJump };
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const client = await page.createCDPSession();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  console.log("\n--- STACKING ASSERTIONS ---");
  await page.click('[data-shot="stacked"] .Card-preview');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() === 1 && window.__velvet.idle(), { timeout: 8000 });

  // Open the nested sheet (the "Open another" primary button inside the first sheet).
  await page.click(`${ACTUAL_STACK} .Btn--primary`);
  await page.waitForFunction(() => window.__velvet.count() === 2 && window.__velvet.idle(), { timeout: 8000 });
  await sleep(60);

  const geometry = await page.evaluate((selector) => {
    const [lower, front] = document.querySelectorAll(selector);
    const lowerRect = lower?.getBoundingClientRect();
    const frontRect = front?.getBoundingClientRect();
    const transform = lower?.style.transform || "";
    const matrix = lower ? new DOMMatrixReadOnly(getComputedStyle(lower).transform) : null;
    return {
      count: document.querySelectorAll(selector).length,
      scale: matrix ? Math.hypot(matrix.a, matrix.b) : 1,
      brightness: lower ? getComputedStyle(lower).filter : "none",
      origin: lower ? getComputedStyle(lower).transformOrigin : "",
      lowerTop: lowerRect?.top ?? null,
      frontTop: frontRect?.top ?? null,
      lowerWidth: lowerRect?.width ?? null,
      frontWidth: frontRect?.width ?? null,
    };
  }, ACTUAL_STACK);

  check(
    "lower sheet uses the exact public stack scale without synthetic dimming",
    geometry.count === 2 && Math.abs(geometry.scale - 0.933) < 0.002 &&
      geometry.brightness === "none" && geometry.origin.endsWith(" 0px"),
    JSON.stringify(geometry),
  );
  check(
    "lower sheet leaves a visible upper lip behind the front sheet",
    geometry.lowerTop != null && geometry.frontTop - geometry.lowerTop >= 9 &&
      geometry.frontTop - geometry.lowerTop <= 11 &&
      Math.abs(geometry.lowerWidth / geometry.frontWidth - 0.933) < 0.002,
    JSON.stringify(geometry),
  );

  await startStackedExitTrace(page);
  await swipe(client, { y: 420, distance: 1200, speed: 8000 });
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  await sleep(160);
  const stackedExitTrace = await stopStackedExitTrace(page);
  const childMotion = motionStats(
    stackedExitTrace
      .filter((sample) => sample.count > 1)
      .map((sample) => sample.frontTop)
      .filter((value) => typeof value === "number"),
    1,
    1,
  );
  const parentMotion = motionStats(
    stackedExitTrace
      .map((sample) => sample.parentScale)
      .filter((value) => typeof value === "number"),
    1,
    0.001,
  );
  const orphanedStackFrames = stackedExitTrace.filter(
    (sample) =>
      !sample.childVisible &&
      typeof sample.parentScale === "number" &&
      Math.abs(sample.parentScale - 1) > 0.005,
  );
  const finalChildFrame = stackedExitTrace.filter((sample) => sample.count > 1).at(-1);
  check(
    "swiping the child closed is visually monotonic for both stacked sheets",
    childMotion.samples >= 3 && childMotion.turns === 0 && childMotion.wrongWay === 0 &&
      parentMotion.samples >= 3 && parentMotion.turns === 0 && parentMotion.wrongWay === 0,
    JSON.stringify({ childMotion, parentMotion, trace: stackedExitTrace }),
  );
  check(
    "the lower sheet is fully restored before the child is hidden",
    orphanedStackFrames.length === 0 &&
      finalChildFrame &&
      Math.abs(finalChildFrame.parentScale - 1) <= 0.005 &&
      finalChildFrame.childBackdropOpacity <= 0.005,
    JSON.stringify({ orphanedStackFrames, finalChildFrame, trace: stackedExitTrace }),
  );
  const afterChildClose = await page.evaluate((selector) => {
    const lower = document.querySelector(selector);
    const transform = lower?.style.transform || "";
    const matrix = lower ? new DOMMatrixReadOnly(getComputedStyle(lower).transform) : null;
    return {
      count: document.querySelectorAll(selector).length,
      scale: matrix ? Math.hypot(matrix.a, matrix.b) : 1,
      transform,
    };
  }, ACTUAL_STACK);
  check(
    "closing the child restores the real parent sheet without closing it",
    afterChildClose.count === 1 && Math.abs(afterChildClose.scale - 1) < 0.002,
    JSON.stringify(afterChildClose),
  );

  // Begin a high-velocity dismissal just before the nested entrance releases
  // programmatic ownership. The gesture must remain fully suppressed; letting
  // only its momentum tail onto the newly-restored scroller produces the
  // visible down-then-up rebound reported in the real gallery.
  await page.click(`${ACTUAL_STACK} .Btn--primary`);
  await page.waitForFunction(
    (viewSelector) => {
      const views = [...document.querySelectorAll(viewSelector)];
      const front = views.at(-1)?.querySelector('[data-velvet="content"].Stack-content');
      return views.length === 2 && !window.__velvet?.idle() &&
        front?.getBoundingClientRect().top <= 230;
    },
    { timeout: 8000 },
    ACTUAL_VIEW,
  );
  await startStackedExitTrace(page);
  await swipe(client, { y: 420, distance: 1200, speed: 8000 });
  await page.waitForFunction(
    () => window.__velvet?.count() > 0 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  await sleep(120);
  const entranceOwnedCount = await page.evaluate(() => window.__velvet?.count());
  const entranceOwnedTrace = await stopStackedExitTrace(page);
  const entranceOwnedTops = entranceOwnedTrace
    .filter((sample) => sample.count > 1)
    .map((sample) => sample.frontTop)
    .filter((value) => typeof value === "number");
  const entranceOwnedExcursion = entranceOwnedTops.length
    ? Math.max(...entranceOwnedTops) - entranceOwnedTops[0]
    : Infinity;
  const entranceOwnedMotion = motionStats(entranceOwnedTops, 1, 1);
  check(
    "a swipe begun during the nested entrance cannot leak a down/up momentum tail",
    entranceOwnedTops.length >= 3 &&
      entranceOwnedCount === 2 && entranceOwnedExcursion <= 2,
    JSON.stringify({ entranceOwnedCount, entranceOwnedExcursion, entranceOwnedMotion, tops: entranceOwnedTops }),
  );

  // The same gesture works normally once the entrance has released ownership.
  if (entranceOwnedCount === 2) {
    await swipe(client, { y: 420, distance: 1200, speed: 8000 });
    await page.waitForFunction(
      () => window.__velvet?.count() === 1 && window.__velvet.idle(),
      { timeout: 8000 },
    );
  }

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  await page.$eval('[data-shot="depth"] .Card-trigger [data-velvet-trigger]', (element) =>
    element.click()
  );
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  await page.click(`${ACTUAL_VIEW} .Depth-cta`);
  await page.waitForFunction(
    () => window.__velvet?.count() === 2 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  const depthGeometry = await page.evaluate(() => {
    const contents = document.querySelectorAll(
      '[data-velvet="view"]:not([data-velvet-preview]) [data-velvet="content"].Depth-content'
    );
    const transform = contents[0]?.style.transform || "";
    const matrix = contents[0]
      ? new DOMMatrixReadOnly(getComputedStyle(contents[0]).transform)
      : null;
    return {
      count: contents.length,
      scale: matrix ? Math.hypot(matrix.a, matrix.b) : 1,
      transform,
    };
  });
  check(
    "depth demo uses the same real two-sheet stack mechanism",
    depthGeometry.count === 2 && Math.abs(depthGeometry.scale - 0.933) < 0.002,
    JSON.stringify(depthGeometry),
  );

  await page.$$eval(`${ACTUAL_VIEW} [data-velvet-trigger]`, (buttons) => {
    const button = buttons.find((candidate) => candidate.textContent.includes("Send invites"));
    button?.click();
  });
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
  );
  check(
    "depth child closes back to the live parent sheet",
    (await page.$$(ACTUAL_VIEW)).length === 1,
  );

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  await page.setViewport({ width: 540, height: 707, deviceScaleFactor: 1 });
  await page.reload({ waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  for (const testCase of [
    { name: "stacked", shot: "stacked", contentClass: "Stack-content", trigger: ".Stack-cta" },
    { name: "depth", shot: "depth", contentClass: "Depth-content", trigger: ".Depth-cta" },
  ]) {
    await page.$eval(`[data-shot="${testCase.shot}"] .Card-preview`, (element) =>
      element.click()
    );
    await page.waitForFunction(
      () => window.__velvet?.count() === 1 && window.__velvet.idle(),
      { timeout: 8000 },
    );
    await page.$eval(`${ACTUAL_VIEW} ${testCase.trigger}`, (element) => element.click());
    await page.waitForFunction(
      () => window.__velvet?.count() === 2 && window.__velvet.idle(),
      { timeout: 8000 },
    );
    await startStackedExitTrace(page, testCase.contentClass);
    await swipe(client, { x: 270, y: 350, distance: 1000, speed: 9000 });
    await page.waitForFunction(
      () => window.__velvet?.count() === 1 && window.__velvet.idle(),
      { timeout: 8000 },
    );
    await sleep(80);
    const trace = await stopStackedExitTrace(page);
    const finalChildFrame = trace.filter((sample) => sample.count > 1).at(-1);
    check(
      `${testCase.name} rapid mobile dismissal flushes its final stack frame`,
      Boolean(
        finalChildFrame &&
          Math.abs(finalChildFrame.parentScale - 1) <= 0.005 &&
          finalChildFrame.childBackdropOpacity <= 0.005,
      ),
      JSON.stringify({ finalChildFrame, trace }),
    );
    await page.keyboard.press("Escape");
    await page.waitForFunction(() => window.__velvet?.count() === 0, { timeout: 8000 });
  }

  console.log(pass ? "\nALL PASS\n" : "\nFAILED\n");
} catch (e) {
  console.error("harness error:", e);
  pass = false;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(pass ? 0 : 1);
}
