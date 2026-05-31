// Behavioral SheetStack assertion: opening a second (nested) sheet drives the
// lower sheet's content to scale/dim back via stackingAnimation.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser, pass = true;
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
  await page.click('[data-shot="stacked"] [data-velvet-trigger]');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() === 1 && window.__velvet.idle(), { timeout: 8000 });

  // Open the nested sheet (the "Open another" primary button inside the first sheet).
  await page.click(".Stack-content .Btn--primary");
  await page.waitForFunction(() => window.__velvet.count() === 2 && window.__velvet.idle(), { timeout: 8000 });
  await sleep(60);

  // The lower (first) sheet's content should now be scaled back (< 1).
  const scale = await page.evaluate(() => {
    const lower = document.querySelectorAll('[data-velvet="content"].Stack-content')[0];
    const t = lower && lower.style.transform;
    const m = /scale\(([0-9.]+)\)/.exec(t || "");
    return m ? parseFloat(m[1]) : 1;
  });
  check("lower sheet scales back when stacked", scale > 0.8 && scale < 0.99, `scale=${scale}`);

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
