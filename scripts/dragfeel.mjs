// Drag-release feel on the bottom sheet: distance AND velocity should decide,
// like the native scroll path. Small slow drag snaps back; long drag or quick
// flick dismisses.
import { createServer } from "vite";
import puppeteer from "puppeteer";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const wd = setTimeout(() => process.exit(1), 90000); wd.unref();
let server, browser, pass = true;
const check = (n, ok, info = "") => { pass = pass && ok; console.log(`${ok ? "PASS" : "FAIL"}  ${n}  ${info}`); };
try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  const prog = async () => await page.evaluate(() => (window.__velvet.count() ? window.__velvet.progress() : 0));
  const count = () => page.evaluate(() => window.__velvet.count());
  const idle = () => page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0 && window.__velvet.idle(), { timeout: 6000 }).catch(() => {});
  const grab = () => page.$eval('[data-velvet="content"]', (el) => { const r = el.getBoundingClientRect(); return { cx: Math.round(r.x + r.width / 2), top: Math.round(r.y) }; });
  const open = async () => { await page.click('[data-shot="bottom-sheet"] [data-velvet-trigger]'); await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0, { timeout: 4000 }); await idle(); await sleep(60); };
  const drag = async (dy, gap) => {
    const g = await grab();
    await page.mouse.move(g.cx, g.top + 14);
    await page.mouse.down();
    const steps = Math.max(3, Math.floor(Math.abs(dy) / 12));
    for (let i = 1; i <= steps; i++) { await page.mouse.move(g.cx, g.top + 14 + (dy * i) / steps, { steps: 1 }); if (gap) await sleep(gap); }
    await page.mouse.up();
    await idle();
    await sleep(160);
  };

  console.log("\n--- DRAG FEEL ---");
  await open();
  await drag(16, 40); // tiny + slow → under the 25% threshold
  check("small slow drag snaps back", (await count()) === 1 && (await prog()) > 0.9, `count=${await count()} progress=${(await prog()).toFixed(2)}`);

  if ((await count()) === 0) await open();
  await drag(600, 16); // long + slow (clamps well past the midpoint)
  check("long slow drag dismisses", (await count()) === 0, `count=${await count()}`);

  await open();
  await drag(140, 0); // short + fast flick
  check("quick flick dismisses", (await count()) === 0, `count=${await count()}`);

  console.log(pass ? "\nALL PASS\n" : "\nFAILED\n");
} catch (e) { console.error("harness error:", e); pass = false; }
finally { if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); clearTimeout(wd); process.exit(pass ? 0 : 1); }
