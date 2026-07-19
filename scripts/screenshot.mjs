// Self-contained visual harness — cannot hang.
//   * starts Vite in-process (no orphan server, no HMR network-idle trap)
//   * waits on selectors, never on "networkidle"
//   * freezes the frontmost sheet at exact travel %s for deterministic frames
//   * compresses every shot to a small JPEG (well under the 5MB limit)
//   * a watchdog force-exits if anything stalls
//
//   node scripts/screenshot.mjs                  # desktop, bottom sheet checkpoints
//   node scripts/screenshot.mjs --mobile
//   node scripts/screenshot.mjs --shot bottom-sheet
import { createServer } from "vite";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { mkdirSync, rmSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const getArg = (n, d) => (args.indexOf(`--${n}`) !== -1 ? args[args.indexOf(`--${n}`) + 1] : d);
const has = (n) => args.includes(`--${n}`);

const MOBILE = has("mobile");
const ONLY = getArg("shot", null);
const TAG = MOBILE ? "mobile" : "desktop";
const OUT = resolve("shots");
rmSync(OUT, { recursive: true, force: true }); // auto-delete old screenshots each run
mkdirSync(OUT, { recursive: true });
const VIEWPORT = MOBILE
  ? { width: 402, height: 874, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1280, height: 860, deviceScaleFactor: 1 };

const CHECKPOINTS = [0, 0.05, 0.1, 0.2, 0.25, 0.35, 0.5, 0.65, 0.8, 1];
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// Force-exit if the whole run takes longer than 90s.
const watchdog = setTimeout(() => {
  console.error("watchdog: forcing exit");
  process.exit(1);
}, 90000);
watchdog.unref();

let server, browser;
const compress = async (buf, name) => {
  const file = resolve(OUT, `${name}.${TAG}.jpg`);
  await sharp(buf)
    .resize({ width: MOBILE ? 480 : 1120, withoutEnlargement: true })
    .jpeg({ quality: 72 })
    .toFile(file);
  console.log("shot:", file);
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4316, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  console.log("vite:", base);

  browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--force-color-profile=srgb"],
  });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport(VIEWPORT);
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await sleep(300);

  if (!ONLY) await compress(await page.screenshot({ type: "png" }), "gallery");

  const shot = ONLY || "bottom-sheet";
  // Turn on debug mount (open, no spring) so freeze() fully controls the frame.
  await page.evaluate(() => {
    window.__VELVET_DEBUG = true;
  });
  const trigger = `[data-shot="${shot}"] .Card-preview`;
  await page.waitForSelector(trigger);
  await page.click(trigger);
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, {
    timeout: 5000,
  });

  for (const p of CHECKPOINTS) {
    await page.evaluate((pp) => window.__velvet.freeze(pp), p);
    await sleep(80);
    const pct = String(Math.round(p * 100)).padStart(3, "0");
    await compress(await page.screenshot({ type: "png" }), `${shot}-p${pct}`);
  }
  console.log("done");
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
