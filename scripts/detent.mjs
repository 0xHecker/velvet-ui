// Behavioral detent assertions (real springs, no freeze). Verifies:
//   * opens and rests at the intermediate detent (~58lvh of an 88lvh sheet)
//   * a "step up" Trigger advances it to the full detent (~progress 1)
//   * scrolling to closed + scroll-end dismisses it
// Same hang-proof harness as drag.mjs: in-process Vite, selector waits, watchdog.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => {
  console.error("watchdog: forcing exit");
  process.exit(1);
}, 90000);
watchdog.unref();

let server, browser, pass = true;
const check = (name, ok, info = "") => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}  ${info}`);
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4317, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  const idle = () => page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0 && window.__velvet.idle(), { timeout: 8000 });
  const progress = () => page.evaluate(() => window.__velvet.progress());

  console.log("\n--- DETENT ASSERTIONS ---");

  // Open → rests at the intermediate detent (~0.66).
  await page.click('[data-shot="detent"] [data-velvet-trigger]');
  await idle();
  const p1 = await progress();
  check("opens to intermediate detent", p1 > 0.55 && p1 < 0.78, `progress=${p1.toFixed(2)}`);

  // Step up → full detent (~1).
  await page.click(".DetentSheet-expand");
  await idle();
  const p2 = await progress();
  check("step up reaches full detent", p2 > 0.92, `progress=${p2.toFixed(2)}`);

  // Real drag from full: grab the handle (near the viewport top) and pull down →
  // dismiss. Regression guard: a text-selection drag used to fire pointercancel
  // here, so the sheet wouldn't budge from full.
  const g = await page.$eval('[data-velvet="content"]', (el) => {
    const r = el.getBoundingClientRect();
    return { cx: Math.round(r.x + r.width / 2), top: Math.round(r.y) };
  });
  await page.mouse.move(g.cx, g.top + 14);
  await page.mouse.down();
  for (let i = 1; i <= 20; i++) await page.mouse.move(g.cx, g.top + 14 + i * 16, { steps: 1 });
  await page.mouse.up();
  await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 5000 }).catch(() => {});
  const count = await page.evaluate(() => window.__velvet.count());
  check("drag down from full dismisses", count === 0, `count=${count}`);

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
