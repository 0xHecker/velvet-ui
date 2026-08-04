// Screenshot the redesigned playground (Sheets / Toasts / Docs)
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = resolve("shots", "play");
mkdirSync(OUT, { recursive: true });
let server, browser;
try {
  server = await createServer({ logLevel: "warn", server: { port: 4324, host: "127.0.0.1" } });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle2" });
  await page.evaluate(() => document.fonts.ready);
  await sleep(500);

  await page.screenshot({ path: resolve(OUT, "sheets-top.png") });
  await page.screenshot({ path: resolve(OUT, "sheets-full.png"), fullPage: true });

  // Open a bottom sheet to confirm the re-valued tokens propagated to examples.
  await page.click('[data-shot="bottom-sheet"] .Card-preview');
  await sleep(700);
  await page.screenshot({ path: resolve(OUT, "sheet-open.png") });
  await page.keyboard.press("Escape");
  await sleep(500);

  await page.click('.Nav-tab[data-view="toasts"]'); await sleep(400);
  await page.screenshot({ path: resolve(OUT, "toasts-top.png") });
  await page.screenshot({ path: resolve(OUT, "toasts-full.png"), fullPage: true });

  await page.click('.Nav-tab[data-view="docs"]'); await sleep(400);
  await page.screenshot({ path: resolve(OUT, "docs-top.png") });
  await page.screenshot({ path: resolve(OUT, "docs-full.png"), fullPage: true });

  console.log("OK");
} catch (e) { console.error("err:", e.message); }
finally { if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); process.exit(0); }
