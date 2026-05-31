// Unified long-sheet scroll: the sheet's own surface scrolls content past "open"
// (one viewport) without snapping back, and pulling into the travel region dismisses.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser, pass = true;
const check = (n, ok, info = "") => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${n}  ${info}`);
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4318, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  const idle = () => page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0 && window.__velvet.idle(), { timeout: 8000 });

  console.log("\n--- LONG SHEET (unified scroll) ---");
  await page.click('[data-shot="long-sheet"] [data-velvet-trigger]');
  await idle();
  const open = await page.evaluate(() => window.__velvet.progress());
  check("opens fully", open > 0.95, `progress=${open.toFixed(2)}`);

  // Scroll content past "open" (beyond one viewport). The sheet must stay open.
  const top1 = await page.evaluate(() => {
    const el = document.querySelector('[data-velvet="scroll"]');
    el.scrollTop = 5000; // clamps to max; well past one viewport for a long panel
    el.dispatchEvent(new Event("scroll"));
    return { top: el.scrollTop, client: el.clientHeight };
  });
  await sleep(300);
  const after = await page.evaluate(() => ({
    top: document.querySelector('[data-velvet="scroll"]').scrollTop,
    progress: window.__velvet.progress(),
  }));
  check(
    "content scrolls past open and stays open",
    top1.top > top1.client && after.top > top1.client && after.progress > 0.95,
    `top=${after.top} client=${top1.client} progress=${after.progress.toFixed(2)}`
  );

  // A small pull-down from open snaps straight back to open — native mandatory
  // snap decides instantly, no mid-travel stranding, no waiting.
  await page.evaluate(() => {
    const el = document.querySelector('[data-velvet="scroll"]');
    el.scrollTop = el.clientHeight - 40; // pulled down 40px from open
    el.dispatchEvent(new Event("scroll"));
    el.dispatchEvent(new Event("scrollend"));
  });
  await sleep(350);
  const back = await page.evaluate(() => ({
    count: window.__velvet.count(),
    progress: window.__velvet.count() ? window.__velvet.progress() : 0,
  }));
  check("small pull snaps back to open", back.count === 1 && back.progress > 0.9, `count=${back.count} progress=${back.progress.toFixed(2)}`);

  // Pull back into the travel region (below open) → dismiss.
  await page.evaluate(() => {
    const el = document.querySelector('[data-velvet="scroll"]');
    el.scrollTop = 24;
    el.dispatchEvent(new Event("scroll"));
  });
  await sleep(550);
  const count = await page.evaluate(() => window.__velvet.count());
  check("pull into travel region dismisses", count === 0, `count=${count}`);

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
