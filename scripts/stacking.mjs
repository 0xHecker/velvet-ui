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

try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
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

  await page.$$eval(`${ACTUAL_STACK} [data-velvet-trigger]`, (buttons) => {
    const button = buttons.find((candidate) => candidate.textContent.includes("Add to bag"));
    button?.click();
  });
  await page.waitForFunction(
    () => window.__velvet?.count() === 1 && window.__velvet.idle(),
    { timeout: 8000 },
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
