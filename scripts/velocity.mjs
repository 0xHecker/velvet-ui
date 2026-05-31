// Faithful-to-Silk gesture verification. Silk has NO pointer-drag and NEVER
// seeds the spring from gesture velocity (initialVelocity is only ever the
// integrator default 0 or the user's animationSettings). Gesture snapping is
// native CSS scroll-snap: the browser's own fling/midpoint picks open vs
// closed. On scroll-end we only read where the snap landed and dismiss if it
// landed closed. This harness verifies (A) our integrator matches Silk's tC
// (it consumes initialVelocity), and (B) the native-snap decision.
import { createServer } from "vite";
import puppeteer from "puppeteer";

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();
const results = [];
const assert = (name, cond, detail) => results.push(`${cond ? "PASS" : "FAIL"}  ${name}  ${detail ?? ""}`);

// (A) Integrator parity: Silk's tC accepts initialVelocity; ours must too.
const { solveSpring } = await import("../src/velvet/core/spring.js");
const stepsTo95 = (v0) => {
  const { values } = solveSpring("smooth", 0, 400, v0);
  const i = values.findIndex((v) => v >= 0.95);
  return i < 0 ? values.length : i;
};
assert("integrator consumes initialVelocity (matches tC)", stepsTo95(3) < stepsTo95(0), `steps v0=0→${stepsTo95(0)} v0=3→${stepsTo95(3)}`);

let server, browser;
const progress = (page) => page.evaluate(() => (window.__velvet.count() ? window.__velvet.progress() : 0));
const count = (page) => page.evaluate(() => window.__velvet.count());
const present = async (page) => {
  await page.click('[data-shot="bottom-sheet"] [data-velvet-trigger]');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 });
  await page.waitForFunction(() => window.__velvet.idle() && window.__velvet.progress() > 0.99, { timeout: 3000 }).catch(() => {});
  await sleep(60);
};
// Leave the scroller at a fraction of travel and let native snap + scroll-end resolve it.
const nativeStopAt = (page, prog) =>
  page.evaluate((p) => {
    const el = document.querySelector('[data-velvet="scroll"]');
    const max = el.scrollHeight - el.clientHeight;
    el.scrollTop = max * p;
    el.dispatchEvent(new Event("scroll"));
    el.dispatchEvent(new Event("scrollend"));
  }, prog);

try {
  server = await createServer({ logLevel: "warn", server: { port: 4318, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");

  // (B1) past the midpoint toward closed → native snap closes → dismiss.
  await present(page);
  await nativeStopAt(page, 0.35);
  await page.waitForFunction(() => window.__velvet.count() === 0, { timeout: 2000 }).catch(() => {});
  assert("scroll past midpoint dismisses", (await count(page)) === 0, `count=${await count(page)}`);

  // (B2) short of the midpoint → native snap returns to open → stays.
  await present(page);
  await nativeStopAt(page, 0.85);
  await page.waitForFunction(() => window.__velvet.idle(), { timeout: 3000 }).catch(() => {});
  await sleep(80);
  assert("scroll short of threshold settles open", (await count(page)) === 1 && (await progress(page)) > 0.9, `count=${await count(page)} progress=${(await progress(page))?.toFixed?.(2)}`);

  console.log("\n--- GESTURE (native-snap) ASSERTIONS ---");
  results.forEach((r) => console.log(r));
  console.log(results.every((r) => r.startsWith("PASS")) ? "\nALL PASS" : "\nSOME FAILED");
} catch (e) {
  console.error("harness error:", e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
