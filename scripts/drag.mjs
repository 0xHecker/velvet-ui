// Gesture verification for the native-scroll Sheet. Drives real pointer + wheel
// events and asserts behavior via window.__velvet.progress() (1 = open, 0 = closed).
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser;
const results = [];
const assert = (name, cond, detail) => results.push(`${cond ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`);
const progress = (page) => page.evaluate(() => window.__velvet.progress());
const count = (page) => page.evaluate(() => window.__velvet.count());

const present = async (page) => {
  await page.click('[data-shot="bottom-sheet"] .Card-preview');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 });
  await page.waitForFunction(() => window.__velvet.idle() && window.__velvet.progress() > 0.99, { timeout: 3000 }).catch(() => {});
  await sleep(60);
};
const dismiss = async (page) => {
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 3000 }).catch(() => {});
  await sleep(60);
};
const panelGrab = (page) =>
  page.$eval('[data-velvet="content"]', (el) => {
    const r = el.getBoundingClientRect();
    return { cx: Math.round(r.x + r.width / 2), top: Math.round(r.y) };
  });
try {
  server = await createServer({ logLevel: "warn", server: { port: 4316, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  // --- native scroll travel: a scroll-position change (what wheel/trackpad/
  // touch produce natively) must travel the sheet and dismiss at the closed
  // detent via the onScroll path. (Headless synthetic wheels fight mandatory
  // snap, so we drive the scroller the way a real gesture leaves it.) ---
  await present(page);
  await page.mouse.move(640, 430);
  for (let i = 0; i < 6; i++) await page.mouse.wheel({ deltaY: -120 }); // exercise the real wheel path
  await page.evaluate(() => {
    const el = document.querySelector('[data-velvet="scroll"]');
    if (!el) return;
    el.scrollTop = 0; // a bottom sheet swiped/scrolled to the closed detent
    el.dispatchEvent(new Event("scroll"));
  });
  await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 3000 }).catch(() => {});
  assert("native scroll to closed dismisses", (await count(page)) === 0, `count=${await count(page)}`);

  // --- pointercancel must fully end the drag (the stuck-overlay bug) ---
  await present(page);
  const c = await panelGrab(page);
  await page.mouse.move(c.cx, c.top + 16);
  await page.mouse.down();
  await page.mouse.move(c.cx, c.top + 56, { steps: 3 });
  await page.evaluate(() => window.dispatchEvent(new PointerEvent("pointercancel")));
  await page.waitForFunction(() => window.__velvet.progress() > 0.9, { timeout: 2000 }).catch(() => {});
  await page.mouse.move(c.cx, c.top - 140, { steps: 5 }); // stale button — must NOT drag
  await sleep(60);
  const afterCancel = await progress(page);
  assert("pointercancel ends drag (no stuck swiping)", afterCancel > 0.9 && (await count(page)) === 1, `progress=${afterCancel?.toFixed?.(2)} count=${await count(page)}`);
  await page.mouse.up();
  await dismiss(page);

  // --- entrance-owned close input cannot reverse the active spring; the
  // same close works normally once the entrance reaches its detent. ---
  await page.$eval(
    '[data-shot="bottom-sheet"] .Card-trigger [data-velvet-trigger]',
    (element) => element.click(),
  );
  await sleep(40);
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => window.__velvet.count() === 1 && window.__velvet.idle(),
    { timeout: 5000 },
  ).catch(() => {});
  const stableAfterEarlyClose =
    (await count(page)) === 1 && (await progress(page)) > 0.99;
  assert(
    "entrance-owned close cannot reverse the active spring",
    stableAfterEarlyClose,
    `progress=${(await progress(page))?.toFixed?.(2)} count=${await count(page)}`,
  );
  await dismiss(page);
  const clickable = await page.evaluate(() => {
    const el = document.querySelector('[data-shot="bottom-sheet"] .Card-preview');
    const r = el.getBoundingClientRect();
    const hit = document.elementFromPoint(r.x + r.width / 2, r.y + r.height / 2);
    return el === hit || el.contains(hit);
  });
  assert("page interactive after settled close", clickable && (await count(page)) === 0, `clickable=${clickable} count=${await count(page)}`);

  console.log("\n--- GESTURE ASSERTIONS ---");
  results.forEach((r) => console.log(r));
  console.log(results.every((r) => r.startsWith("PASS")) ? "\nALL PASS" : "\nSOME FAILED");
} catch (e) {
  console.error("harness error:", e);
  results.push("FAIL  harness");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(results.every((result) => result.startsWith("PASS")) ? 0 : 1);
}
