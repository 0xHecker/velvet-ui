// TEMP: diagnose persistent player open / expand / collapse.
import { createServer } from "vite";
import puppeteer from "puppeteer";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
let server, browser;
const prog = (page) => page.evaluate(() => (window.__velvet && window.__velvet.count() ? +window.__velvet.progress().toFixed(3) : 0));
const dragBar = async (page, dy) => {
  const b = await page.evaluate(() => { const c = document.querySelector('[data-velvet="content"]'); const r = c.getBoundingClientRect(); return { x: r.x + r.width / 2, y: r.y + 20 }; });
  await page.mouse.move(b.x, b.y); await page.mouse.down();
  for (let i = 1; i <= 14; i++) { await page.mouse.move(b.x, b.y + (i / 14) * dy); await sleep(8); }
  await page.mouse.up(); await sleep(700);
  return prog(page);
};
try {
  server = await createServer({ logLevel: "warn", server: { port: 4334, host: "127.0.0.1" } });
  await server.listen();
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "networkidle2" });
  // measure OPEN settle time
  await page.evaluate(() => { window.__t = []; const f = () => { if (!window.__s) { window.__t.push(window.__velvet && window.__velvet.count() ? window.__velvet.progress() : 0); requestAnimationFrame(f); } }; requestAnimationFrame(f); });
  await page.click('[data-shot="persistent"] [data-velvet-trigger]');
  await sleep(1200);
  const openTrace = await page.evaluate(() => { window.__s = true; return window.__t; });
  const settle = (tr, target) => { for (let i = tr.length - 1; i > 0; i--) if (Math.abs(tr[i] - target) > 0.01) return i + 1; return 0; };
  const openMs = Math.round(settle(openTrace, 0.156) * 16.7);
  // expand, then measure COLLAPSE settle time
  await page.evaluate(() => document.querySelector('[data-velvet="content"] [aria-label="Expand"]')?.click());
  await sleep(900);
  await page.evaluate(() => { window.__s = false; window.__t = []; const f = () => { if (!window.__s) { window.__t.push(window.__velvet.count() ? window.__velvet.progress() : 0); requestAnimationFrame(f); } }; requestAnimationFrame(f); });
  await dragBar(page, 300);
  const colTrace = await page.evaluate(() => { window.__s = true; return window.__t; });
  const colMs = Math.round(settle(colTrace, 0.156) * 16.7);
  console.log(`open settle ~${openMs}ms | collapse settle ~${colMs}ms`);
} catch (e) { console.error("err:", e.message); }
finally { if (browser) await browser.close().catch(() => {}); if (server) await server.close().catch(() => {}); process.exit(0); }
