// Toast playground check: switch to the Toasts view, spawn toasts (they stack),
// expand on hover, then confirm timed toasts auto-dismiss while a longer-lived
// action toast persists.
import { createServer } from "vite";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { resolve } from "node:path";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wd = setTimeout(() => process.exit(1), 90000); wd.unref();
let server, browser, pass = true;
const check = (n, ok, info = "") => { pass = pass && ok; console.log(`${ok ? "PASS" : "FAIL"}  ${n}  ${info}`); };
const count = (page) => page.evaluate(() => document.querySelectorAll(".Toast").length);
try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });

  // Enter the dedicated toast playground.
  await page.waitForSelector('.Seg-btn[data-view="toasts"]');
  await page.click('.Seg-btn[data-view="toasts"]');
  await page.waitForSelector(".Toastpg");

  const fire = (key) => page.evaluate((k) => {
    const b = document.querySelector(`[data-toast="${k}"]`);
    b && b.click();
  }, key);

  await fire("success"); await sleep(120);
  await fire("error"); await sleep(120);
  await fire("action"); await sleep(250);
  check("toasts stack", (await count(page)) === 3, `count=${await count(page)}`);
  await sharp(await page.screenshot({ type: "png" })).resize({ width: 1120 }).jpeg({ quality: 76 }).toFile(resolve("shots", "toasts.desktop.jpg"));

  // Hover the stack (bottom-right) to expand, capture, then move away to resume timers.
  await page.mouse.move(1150, 760); await sleep(420);
  await sharp(await page.screenshot({ type: "png" })).resize({ width: 1120 }).jpeg({ quality: 76 }).toFile(resolve("shots", "toasts-expanded.desktop.jpg"));
  await page.mouse.move(400, 300);

  // success + error are 4s; the action toast is 8s → only it survives.
  await sleep(4600);
  check("timed toasts auto-dismiss, action persists", (await count(page)) === 1, `count=${await count(page)}`);

  console.log(pass ? "\nALL PASS\n" : "\nFAILED\n");
} catch (e) { console.error("harness error:", e); pass = false; }
finally { if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); clearTimeout(wd); process.exit(pass ? 0 : 1); }
