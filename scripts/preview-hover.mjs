// Regression harness for the real-component card hover previews. It samples
// the preview sheet's visual panel position through enter/leave reversals and
// reports direction changes or one-frame jumps.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server;
let browser;
let pass = true;

const check = (name, ok, info = "") => {
  pass = pass && ok;
  console.log(`${ok ? "PASS" : "FAIL"}  ${name}${info ? `  ${info}` : ""}`);
};

const startTrace = (page, shot) =>
  page.evaluate((id) => {
    window.__previewTrace = [];
    window.__previewTracing = true;
    const card = document.querySelector(`[data-shot="${id}"]`);
    const canvas = card.querySelector(".DemoPreview-canvas");
    const loop = () => {
      if (!window.__previewTracing) return;
      const views = [...card.querySelectorAll('[data-velvet="view"][data-velvet-preview]')];
      const view = views.at(-1);
      const content = view?.querySelector('[data-velvet="content"]');
      const area = view?.querySelector('[data-velvet="content-area"]');
      const scroll = view?.querySelector('[data-velvet="scroll"]');
      const canvasRect = canvas.getBoundingClientRect();
      const contentRect = content?.getBoundingClientRect();
      const areaRect = area?.getBoundingClientRect();
      window.__previewTrace.push({
        t: performance.now(),
        open: card.hasAttribute("data-preview-open"),
        mounted: Boolean(view),
        layers: views.length,
        top: contentRect ? (contentRect.top - canvasRect.top) * 2 : null,
        areaTop: areaRect ? (areaRect.top - canvasRect.top) * 2 : null,
        transform: area?.style.transform || "",
        scroll: scroll?.scrollTop ?? null,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }, shot);

const stopTrace = (page) =>
  page.evaluate(() => {
    window.__previewTracing = false;
    return window.__previewTrace;
  });

const phaseStats = (samples) => {
  const positions = samples.map((sample) => sample.top).filter(Number.isFinite);
  let maxJump = 0;
  let turns = 0;
  let direction = 0;
  let extreme = positions[0] ?? 0;
  const jumps = [];
  for (let index = 1; index < positions.length; index++) {
    const delta = positions[index] - positions[index - 1];
    maxJump = Math.max(maxJump, Math.abs(delta));
    if (Math.abs(delta) >= 24) {
      jumps.push([index, Math.round(positions[index - 1]), Math.round(positions[index])]);
    }
    // The preview canvas is rendered at half scale. Count a reversal only
    // after it travels at least one rendered pixel away from the prior
    // extremum; raw subpixel raster jitter must not become a flaky extra turn.
    const position = positions[index];
    if (!direction) {
      if (Math.abs(position - extreme) >= 2) {
        direction = Math.sign(position - extreme);
        extreme = position;
      }
    } else if (direction > 0) {
      if (position > extreme) extreme = position;
      else if (extreme - position >= 2) {
        turns++;
        direction = -1;
        extreme = position;
      }
    } else if (position < extreme) extreme = position;
    else if (position - extreme >= 2) {
      turns++;
      direction = 1;
      extreme = position;
    }
  }
  return { frames: positions.length, maxJump, turns, jumps: jumps.slice(0, 8) };
};

const run = async (page, shot) => {
  await page.$eval(`[data-shot="${shot}"]`, (element) =>
    element.scrollIntoView({ block: "center" })
  );
  await sleep(80);
  const card = await page.$(`[data-shot="${shot}"]`);
  const box = await card.boundingBox();
  await page.mouse.move(8, 8);
  await startTrace(page, shot);

  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(170);
  await page.mouse.move(8, 8);
  await sleep(130);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(900);
  const opened = await stopTrace(page);
  const backdropOpacity = await page.$eval(
    `[data-shot="${shot}"] [data-velvet="backdrop"]`,
    (element) => Number.parseFloat(getComputedStyle(element).opacity),
  ).catch(() => null);

  await startTrace(page, shot);
  await page.mouse.move(8, 8);
  await sleep(170);
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await sleep(130);
  await page.mouse.move(8, 8);
  await sleep(900);
  const closed = await stopTrace(page);

  const openStats = phaseStats(opened);
  const closeStats = phaseStats(closed);
  const mounted = await page.$(`[data-shot="${shot}"] [data-velvet-preview]`);
  check(
    `${shot}: hover reversal opens without a visual teleport`,
    openStats.maxJump < 48 && openStats.turns <= 2,
    JSON.stringify(openStats),
  );
  if (shot === "detent") {
    check(
      `${shot}: first entrance includes its registered backdrop animation`,
      backdropOpacity > 0.1,
      `opacity=${backdropOpacity}`,
    );
  }
  check(
    `${shot}: leave reversal closes without a visual teleport`,
    closeStats.maxJump < 48 && closeStats.turns <= 2 && !mounted,
    JSON.stringify(closeStats),
  );
};

const runNested = async (page, shot) => {
  await page.$eval(`[data-shot="${shot}"]`, (element) =>
    element.scrollIntoView({ block: "center" })
  );
  await sleep(80);
  const card = await page.$(`[data-shot="${shot}"]`);
  const box = await card.boundingBox();
  const inside = [box.x + box.width / 2, box.y + box.height / 2];
  await page.mouse.move(8, 8);
  await page.mouse.move(...inside);
  await sleep(1200);

  await startTrace(page, shot);
  await page.mouse.move(8, 8);
  await sleep(80);
  await page.mouse.move(...inside);
  await sleep(900);
  const reversal = await stopTrace(page);
  const stats = phaseStats(reversal);
  const minLayers = Math.min(...reversal.map((sample) => sample.layers));
  check(
    `${shot}: interrupted nested close keeps the live child and reverses in place`,
    // Nested sheets travel farther than a single preview layer; 72 logical px
    // is 36 rendered px in this half-scale canvas and still distinguishes a
    // one-frame endpoint teleport from continuous spring travel.
    minLayers === 2 && stats.maxJump < 72 && stats.turns <= 2,
    JSON.stringify({ ...stats, minLayers }),
  );

  await page.mouse.move(8, 8);
  await sleep(1000);
  const mounted = await page.$$(`[data-shot="${shot}"] [data-velvet-preview]`);
  check(`${shot}: completed leave unmounts both preview layers`, mounted.length === 0);
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4331, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  console.log("\n--- PREVIEW HOVER ASSERTIONS ---");
  await run(page, "detent");
  await run(page, "persistent");
  await runNested(page, "stacked");
  await runNested(page, "depth");
  console.log(pass ? "\nALL PASS\n" : "\nFAILED\n");
} catch (error) {
  console.error("harness error:", error);
  pass = false;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(pass ? 0 : 1);
}
