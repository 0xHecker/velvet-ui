// Native-SWIPE flicker harness. Unlike sheet-flicker/sheet-dragdown (which drive
// the mouse manual-drag path), this uses CDP Input.synthesizeScrollGesture with
// gestureSourceType:"touch" — a real momentum/fling scroll on the sheet's native
// scroller, i.e. the actual swipe-to-dismiss path (onScroll). It slows the dismiss
// spring (__VELVET_TIME_SCALE) and inspects the END of travel for a rebound flicker.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 120000);
watchdog.unref();
const SHOTS = process.env.SHOT ? [process.env.SHOT] : ["bottom-sheet", "long-sheet", "page-from-bottom", "parallax"];
const TIME_SCALE = Number(process.env.TS || 5);
const DIST = Number(process.env.DIST || 140); // small swipe
const SPEED = Number(process.env.SPEED || 9000); // fast (px/s)

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
      window.__samples.push({ t: +(performance.now() - t0).toFixed(1), p, off: el ? Math.round(el.scrollTop) : -1, snap: el ? (el.style.scrollSnapType || "(rest)") : "?", c });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
const stopSampler = (page) => page.evaluate(() => { window.__sampling = false; return window.__samples; });

const present = async (page, shot) => {
  await page.click(`[data-shot="${shot}"] .Card-preview`);
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 });
  await page.waitForFunction(() => window.__velvet.idle() && window.__velvet.progress() > 0.99, { timeout: 3000 }).catch(() => {});
  await sleep(100);
};

// rebound (any rise > 0.03 after we've started descending), ignoring post-unmount.
const analyze = (samples) => {
  const live = [];
  for (const s of samples) { if (s.c === 0) break; if (s.p != null) live.push(s); }
  let min = Infinity, rebound = 0, reboundAt = 0, started = false, lowest = Infinity;
  for (const s of live) {
    if (s.p < lowest) lowest = s.p;
    if (s.p < 0.9) started = true;
    if (!started) continue;
    if (s.p < min) min = s.p;
    else if (s.p - min > rebound) { rebound = s.p - min; reboundAt = min; }
  }
  return { rebound: +rebound.toFixed(3), reboundFrom: +reboundAt.toFixed(3), lowest: +(lowest === Infinity ? 1 : lowest).toFixed(3), live };
};
const spark = (live) => {
  const b = "▁▂▃▄▅▆▇█";
  const step = Math.max(1, Math.floor(live.length / 64));
  let out = "";
  for (let i = 0; i < live.length; i += step) out += b[Math.min(7, Math.max(0, Math.round((live[i].p ?? 0) * 7)))];
  return out;
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4324, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("console", (m) => { const t = m.text(); if (t.includes("[VLV]")) console.log("   " + t); });
  const client = await page.createCDPSession();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, hasTouch: true });
  await page.evaluateOnNewDocument(() => { window.__VELVET_LOG = true; });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  for (const shot of SHOTS) {
    await present(page, shot);
    await page.evaluate((ts) => window.__velvet.setTimeScale(ts), TIME_SCALE);
    await startSampler(page);
    // A real fling on the sheet's scroller. Negative yDistance = swipe the panel
    // DOWN toward closed (content scrolls toward the closed detent).
    await client.send("Input.synthesizeScrollGesture", {
      x: 640, y: 250, xDistance: 0, yDistance: Number(process.env.SIGN || -1) * DIST, speed: SPEED,
      gestureSourceType: "touch", repeatCount: 0,
    });
    await sleep(700 * Math.max(1, TIME_SCALE / 2));
    const samples = await stopSampler(page);
    const a = analyze(samples);
    const count = await page.evaluate(() => window.__velvet.count());
    const tail = a.live.slice(-14).map((s) => (s.p ?? -1).toFixed(2)).join(" ");
    const flick = a.rebound > 0.03;
    results.push(`${flick ? "FLICKER" : "clean  "} ${shot.padEnd(16)} rebound=${a.rebound} (from ${a.reboundFrom}) lowest=${a.lowest} finalCount=${count} liveN=${a.live.length}`);
    console.log(`\n### ${shot}  (TS=${TIME_SCALE} dist=${DIST} speed=${SPEED} sign=${process.env.SIGN || -1})`);
    console.log(`travel: ${spark(a.live)}`);
    console.log(`tail p: ${tail}  lowest=${a.lowest}`);
    if (SHOTS.length === 1) {
      console.log("samples (t,p,off,c):");
      for (const s of a.live) console.log(`   t=${String(s.t).padStart(6)} p=${(s.p ?? -1).toFixed(3)} off=${String(s.off).padStart(4)} snap=${(s.snap||"").padEnd(6)} c=${s.c}`);
    }
    await page.keyboard.press("Escape").catch(() => {});
    await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 3000 }).catch(() => {});
    await page.evaluate(() => window.__velvet.setTimeScale(1));
    await sleep(180);
  }

  console.log("\n--- SUMMARY (native swipe) ---");
  results.forEach((r) => console.log(r));
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
