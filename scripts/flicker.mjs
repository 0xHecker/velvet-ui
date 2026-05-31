// Flicker diagnostic: reopen a sheet N times, then on the final close record the
// backdrop's opacity every frame and COUNT direction reversals (flickers).
//   node scripts/flicker.mjs <shot> <dismissSelector>
import { createServer } from "vite";
import puppeteer from "puppeteer";

const shot = process.argv[2] || "bottom-sheet";
const dismissSel = process.argv[3] || ".BottomSheet-actions .Btn";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser;
try {
  server = await createServer({ logLevel: "warn", server: { port: 4321, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  const trigger = `[data-shot="${shot}"] [data-velvet-trigger]`;
  const idle = () => page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0 && window.__velvet.idle(), { timeout: 8000 });
  const gone = () => page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 8000 });

  // Warm-up reopen cycles.
  for (let i = 0; i < 4; i++) {
    await page.click(trigger);
    await idle();
    await page.click(dismissSel);
    await gone();
    await sleep(120);
  }

  // Final cycle: open, then record backdrop opacity each frame across the close.
  await page.click(trigger);
  await idle();
  await page.evaluate(() => {
    window.__samples = [];
    const bd = document.querySelector('[data-velvet="backdrop"]');
    const rec = () => {
      if (!window.__recStop) {
        const o = bd ? parseFloat(getComputedStyle(bd).opacity) : -1;
        window.__samples.push(Number.isFinite(o) ? o : 0);
        requestAnimationFrame(rec);
      }
    };
    requestAnimationFrame(rec);
  });
  await page.click(dismissSel);
  await sleep(700);
  const data = await page.evaluate(() => {
    window.__recStop = true;
    return window.__samples;
  });

  // Count reversals (a rise after a fall, or vice-versa) above a noise threshold.
  let flickers = 0;
  let dir = 0;
  for (let i = 1; i < data.length; i++) {
    const d = data[i] - data[i - 1];
    if (Math.abs(d) < 0.02) continue;
    const s = d > 0 ? 1 : -1;
    if (dir && s !== dir) flickers++;
    dir = s;
  }
  const seq = data.map((v) => v.toFixed(2)).join(" ");
  console.log(`shot=${shot} samples=${data.length} flickers=${flickers}`);
  console.log("opacity:", seq);
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
