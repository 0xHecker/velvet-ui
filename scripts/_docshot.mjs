// TEMP: screenshot the Docs page to verify width + syntax highlighting.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";
import { mkdirSync } from "fs";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server, browser;
try {
  mkdirSync("shots", { recursive: true });
  server = await createServer({ logLevel: "warn", server: { port: 4338, host: "127.0.0.1" } });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000, deviceScaleFactor: 1 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle2" });
  await page.click('[data-view="docs"]');
  await sleep(500);
  await page.evaluate(() => document.getElementById("sheet-quick-start").scrollIntoView());
  await sleep(400);
  await page.screenshot({ path: "shots/docs-quickstart.png" });
  await page.evaluate(() => document.getElementById("detents").scrollIntoView());
  await sleep(400);
  await page.screenshot({ path: "shots/docs-detents.png" });
  console.log("ok");
} catch (e) { console.error("err:", e.message); }
finally { if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); process.exit(0); }
