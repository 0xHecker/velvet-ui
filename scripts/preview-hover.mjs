// Regression harness for the real-component card hover previews. It samples
// the preview sheet's visual panel position through enter/leave reversals and
// reports direction changes or one-frame jumps.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";

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
  const positions = samples.filter((sample) => Number.isFinite(sample.top));
  let maxJump = 0;
  let maxFrameJump = 0;
  let maxFrameGap = 0;
  let turns = 0;
  let direction = 0;
  let extreme = positions[0]?.top ?? 0;
  const jumps = [];
  const turnPoints = [];
  for (let index = 1; index < positions.length; index++) {
    const previous = positions[index - 1];
    const current = positions[index];
    const delta = current.top - previous.top;
    const frameGap = Math.max(current.t - previous.t, 1);
    // A busy headless frame can span several refresh intervals. Compare the
    // distance per nominal 60 Hz frame so dropped samples are not mistaken for
    // a visual teleport while a true one-frame discontinuity still fails.
    const frameJump = Math.abs(delta) * Math.min(1, (1000 / 60) / frameGap);
    maxJump = Math.max(maxJump, Math.abs(delta));
    maxFrameJump = Math.max(maxFrameJump, frameJump);
    maxFrameGap = Math.max(maxFrameGap, frameGap);
    if (frameJump >= 24) {
      jumps.push([
        index,
        Math.round(previous.top),
        Math.round(current.top),
        Math.round(frameGap),
      ]);
    }
    // The preview canvas is rendered at half scale. Count a reversal only
    // after it travels at least one rendered pixel away from the prior
    // extremum; raw subpixel raster jitter must not become a flaky extra turn.
    const position = current.top;
    if (!direction) {
      if (Math.abs(position - extreme) >= 2) {
        direction = Math.sign(position - extreme);
        extreme = position;
      }
    } else if (direction > 0) {
      if (position > extreme) extreme = position;
      else if (extreme - position >= 2) {
        turns++;
        turnPoints.push([index, Math.round(extreme), Math.round(position)]);
        direction = -1;
        extreme = position;
      }
    } else if (position < extreme) extreme = position;
    else if (position - extreme >= 2) {
      turns++;
      turnPoints.push([index, Math.round(extreme), Math.round(position)]);
      direction = 1;
      extreme = position;
    }
  }
  return {
    frames: positions.length,
    maxJump,
    maxFrameJump,
    maxFrameGap,
    turns,
    jumps: jumps.slice(0, 8),
    turnPoints: turnPoints.slice(0, 8),
  };
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
    openStats.maxFrameJump < 48 && openStats.turns <= 2,
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
    closeStats.maxFrameJump < 48 && closeStats.turns <= 2 && !mounted,
    JSON.stringify(closeStats),
  );
};

const runNested = async (page, shot, expectedLayers) => {
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
  const stable =
    minLayers === expectedLayers && stats.maxFrameJump < 72 && stats.turns <= 2;
  const detail = { ...stats, minLayers };
  if (!stable) {
    detail.samples = reversal.slice(0, 18).map((sample, index) => ({
      index,
      t: Math.round(sample.t - reversal[0].t),
      top: Number.isFinite(sample.top) ? Math.round(sample.top) : null,
      areaTop: Number.isFinite(sample.areaTop) ? Math.round(sample.areaTop) : null,
      transform: sample.transform,
      scroll: sample.scroll,
    }));
  }
  check(
    `${shot}: interrupted close keeps every live layer and reverses in place`,
    // Stacked sheets own two preview views; the depth treatment owns one sheet
    // over a receding SheetStack. Both must keep their actual live layer count.
    stable,
    JSON.stringify(detail),
  );

  await page.mouse.move(8, 8);
  await page.waitForFunction(
    (id) =>
      document.querySelectorAll(
        `[data-shot="${id}"] [data-velvet-preview]`,
      ).length === 0,
    { timeout: 2500 },
    shot,
  ).catch(() => {});
  const mounted = await page.$$(`[data-shot="${shot}"] [data-velvet-preview]`);
  check(`${shot}: completed leave unmounts both preview layers`, mounted.length === 0);
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4331, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await page.evaluate(() => document.fonts?.ready);
  const only = process.env.VELVET_PREVIEW_CASE;

  console.log("\n--- PREVIEW HOVER ASSERTIONS ---");
  if (!only || only === "detent") await run(page, "detent");
  if (!only || only === "persistent") await run(page, "persistent");
  if (!only || only === "stacked") await runNested(page, "stacked", 2);
  if (!only || only === "depth") await runNested(page, "depth", 1);
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
