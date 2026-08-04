// Observation harness for the drag-down-to-close FLICKER. It records the rendered
// travel progress (window.__velvet.progress(); 1=open, 0=closed) every animation
// frame across a mouse drag-down + release, then prints the timeline and flags any
// non-monotonic "down -> up -> down" rebound (the visible flicker).
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server, browser;

const startSampler = (page) =>
  page.evaluate(() => {
    window.__samples = [];
    window.__sampling = true;
    const t0 = performance.now();
    const loop = () => {
      if (!window.__sampling) return;
      const el = document.querySelector('[data-velvet="scroll"]');
      let p = 1, count = 0;
      try { count = window.__velvet.count(); } catch {}
      try { const v = window.__velvet.progress(); if (typeof v === "number") p = v; } catch {}
      window.__samples.push({
        t: +(performance.now() - t0).toFixed(1),
        p: +p.toFixed(4),
        off: el ? Math.round(el.scrollTop) : -1,
        snap: el ? (el.style.scrollSnapType || getComputedStyle(el).scrollSnapType) : "?",
        c: count,
      });
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  });
const stopSampler = (page) =>
  page.evaluate(() => {
    window.__sampling = false;
    return window.__samples;
  });

const present = async (page) => {
  await page.click('[data-shot="bottom-sheet"] .Card-preview');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 });
  await page.waitForFunction(() => window.__velvet.idle() && window.__velvet.progress() > 0.99, { timeout: 3000 }).catch(() => {});
  await sleep(80);
};
const panelGrab = (page) =>
  page.$eval('[data-velvet="content"]', (el) => {
    const r = el.getBoundingClientRect();
    return { cx: Math.round(r.x + r.width / 2), top: Math.round(r.y) };
  });

// Find rebound: the lowest progress reached, then a later sample that rises
// >= margin above it, then falls again. Returns the rebound height (0 if none).
const reboundOf = (samples) => {
  let min = Infinity;
  let maxRiseAfterMin = 0;
  let reboundPeak = 0;
  for (const s of samples) {
    if (s.p < min) { min = s.p; maxRiseAfterMin = 0; }
    else {
      const rise = s.p - min;
      if (rise > maxRiseAfterMin) { maxRiseAfterMin = rise; reboundPeak = s.p; }
    }
  }
  return { min: +min.toFixed(3), rise: +maxRiseAfterMin.toFixed(3), reboundPeak: +reboundPeak.toFixed(3) };
};

const sparkline = (samples) => {
  const blocks = "▁▂▃▄▅▆▇█";
  // downsample to ~60 cols
  const step = Math.max(1, Math.floor(samples.length / 60));
  let out = "";
  for (let i = 0; i < samples.length; i += step) out += blocks[Math.min(7, Math.max(0, Math.round(samples[i].p * 7)))];
  return out;
};

const run = async (page, label, doGesture) => {
  await present(page);
  await startSampler(page);
  await doGesture();
  const samples = await stopSampler(page);
  const count = await page.evaluate(() => window.__velvet.count());
  const r = reboundOf(samples);
  console.log(`\n### ${label}`);
  console.log(`samples=${samples.length} finalCount=${count} (0=closed,1=open)`);
  console.log(`min=${r.min} reboundRise=${r.rise} reboundPeak=${r.reboundPeak}`);
  console.log(`travel: ${sparkline(samples)}`);
  // Count transitions over the gesture (detects unmount→remount).
  let cline = "count:";
  let prevc = null;
  for (const s of samples) if (s.c !== prevc) { cline += ` ${s.t}ms=${s.c}`; prevc = s.c; }
  console.log(cline);
  // Dump the window around the lowest point reached mid-gesture, to expose any
  // snap re-engagement (snap != none) while the offset is between snap points.
  let lowIdx = 0;
  for (let i = 1; i < samples.length; i++) if (samples[i].p < samples[lowIdx].p) { lowIdx = i; break; }
  // find first local min (end of the manual drag) instead of global min
  for (let i = 1; i < samples.length - 1; i++) {
    if (samples[i].p <= samples[i - 1].p && samples[i].p < samples[i + 1].p) { lowIdx = i; break; }
  }
  const from = Math.max(0, lowIdx - 1);
  const to = Math.min(samples.length, lowIdx + 10);
  console.log("frames around first dip (t,p,off,snap):");
  for (let i = from; i < to; i++) {
    const s = samples[i];
    console.log(`   t=${String(s.t).padStart(6)} p=${s.p.toFixed(3)} off=${String(s.off).padStart(4)} snap=${s.snap}`);
  }
  // ensure closed for next run
  await page.keyboard.press("Escape").catch(() => {});
  await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 2000 }).catch(() => {});
  await sleep(120);
  return { samples, count, rebound: r };
};

try {
  server = await createServer({ logLevel: "warn", server: { port: 4322, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("console", (m) => {
    const tx = m.text();
    if (tx.includes("[VLV]")) console.log("   " + tx);
  });
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860 });
  await page.evaluateOnNewDocument(() => { window.__VELVET_LOG = true; });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  // A) Small, deliberate drag down (~120px) with a pause before release (low velocity).
  await run(page, "A: small slow drag-down + slow release", async () => {
    const g = await panelGrab(page);
    await page.mouse.move(g.cx, g.top + 16);
    await page.mouse.down();
    for (let dy = 20; dy <= 120; dy += 20) { await page.mouse.move(g.cx, g.top + 16 + dy, { steps: 2 }); await sleep(22); }
    await sleep(140); // deliberate hold → low release velocity
    await page.mouse.up();
    await sleep(900);
  });

  // B) Medium drag down (~220px) with a moderate release.
  await run(page, "B: medium drag-down + moderate release", async () => {
    const g = await panelGrab(page);
    await page.mouse.move(g.cx, g.top + 16);
    await page.mouse.down();
    for (let dy = 30; dy <= 240; dy += 30) { await page.mouse.move(g.cx, g.top + 16 + dy, { steps: 2 }); await sleep(16); }
    await page.mouse.up();
    await sleep(900);
  });

  // C) Quick flick down — realistic fast flick (time-spaced events, ~4px/ms).
  await run(page, "C: quick flick down", async () => {
    const g = await panelGrab(page);
    await page.mouse.move(g.cx, g.top + 16);
    await page.mouse.down();
    for (let dy = 40; dy <= 200; dy += 40) { await page.mouse.move(g.cx, g.top + 16 + dy, { steps: 2 }); await sleep(9); }
    await page.mouse.up();
    await sleep(900);
  });

  console.log("\n(For each: a 'reboundRise' well above ~0.03 after reaching its min = the visible up-flicker.)");
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
