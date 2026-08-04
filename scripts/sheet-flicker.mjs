// Multi-sheet dismissal-flicker harness. For each swipe-dismissable sheet it
// presents, (optionally) slows the spring via __VELVET_TIME_SCALE, drives a real
// drag-down dismiss, samples travel progress every frame, filters out post-unmount
// frames, and reports any non-monotonic rebound (the visible flicker) + the tail.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 120000);
watchdog.unref();
const SHOTS = ["bottom-sheet", "long-sheet", "page-from-bottom", "parallax"];
const TIME_SCALE = Number(process.env.TS || 4); // slow springs to expose end-of-travel flicker

let server, browser;
const results = [];

const startSampler = (page) =>
  page.evaluate(() => {
    window.__samples = [];
    window.__sampling = true;
    const t0 = performance.now();
    const loop = () => {
      if (!window.__sampling) return;
      const el = document.querySelector('[data-velvet="scroll"]');
      let p = null, c = 0;
      try { c = window.__velvet.count(); } catch {}
      try { const v = window.__velvet.progress(); if (typeof v === "number") p = v; } catch {}
      window.__samples.push({ t: +(performance.now() - t0).toFixed(1), p, off: el ? Math.round(el.scrollTop) : -1, snap: el && el.style.scrollSnapType ? el.style.scrollSnapType : "(css)", c });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
const stopSampler = (page) => page.evaluate(() => { window.__sampling = false; return window.__samples; });

const present = async (page, shot) => {
  await page.click(`[data-shot="${shot}"] .Card-preview`);
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 });
  await page.waitForFunction(() => window.__velvet.idle() && window.__velvet.progress() > 0.99, { timeout: 3000 }).catch(() => {});
  await sleep(80);
};
const grab = (page) =>
  page.$eval('[data-velvet="content"]', (el) => {
    const r = el.getBoundingClientRect();
    return { cx: Math.round(r.x + r.width / 2), top: Math.round(Math.max(r.y, 0)) };
  });

// rebound during the descent, ignoring post-unmount frames (p===null/c===0).
const analyze = (samples) => {
  const live = [];
  for (const s of samples) { if (s.c === 0) break; if (s.p != null) live.push(s); }
  let min = Infinity, rebound = 0, started = false;
  for (const s of live) {
    if (s.p < 0.85) started = true;
    if (!started) continue;
    if (s.p < min) min = s.p;
    else if (s.p - min > rebound) rebound = s.p - min;
  }
  const tail = live.slice(-10).map((s) => s.p.toFixed(2)).join(" ");
  return { rebound: +rebound.toFixed(3), liveN: live.length, tail, live };
};
const spark = (live) => {
  const b = "▁▂▃▄▅▆▇█";
  const step = Math.max(1, Math.floor(live.length / 56));
  let out = "";
  for (let i = 0; i < live.length; i += step) out += b[Math.min(7, Math.max(0, Math.round(live[i].p * 7)))];
  return out;
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4323, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  for (const shot of SHOTS) {
    await present(page, shot);
    await page.evaluate((ts) => window.__velvet.setTimeScale(ts), TIME_SCALE);
    await startSampler(page);
    const g = await grab(page);
    // moderate drag-down dismiss: ~230px then release while still moving a bit
    await page.mouse.move(g.cx, g.top + 40);
    await page.mouse.down();
    for (let dy = 30; dy <= 230; dy += 28) { await page.mouse.move(g.cx, g.top + 40 + dy, { steps: 2 }); await sleep(14); }
    await page.mouse.up();
    await sleep(900 * Math.max(1, TIME_SCALE / 2)); // allow the slowed spring to finish
    const samples = await stopSampler(page);
    const a = analyze(samples);
    const count = await page.evaluate(() => window.__velvet.count());
    const flick = a.rebound > 0.03;
    results.push(`${flick ? "FLICKER" : "clean  "} ${shot.padEnd(16)} rebound=${a.rebound} finalCount=${count} liveN=${a.liveN}`);
    console.log(`\n### ${shot}  (timeScale=${TIME_SCALE})`);
    console.log(`travel: ${spark(a.live)}`);
    console.log(`tail p: ${a.tail}`);
    console.log(`rebound=${a.rebound}  finalCount=${count}`);
    // reset
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 3000 }).catch(() => {});
    await page.evaluate(() => window.__velvet.setTimeScale(1));
    await sleep(150);
  }

  console.log("\n--- SUMMARY ---");
  results.forEach((r) => console.log(r));
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
