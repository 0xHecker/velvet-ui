import { createServer } from "vite";
import puppeteer from "puppeteer";

const watchdog = setTimeout(() => process.exit(1), 60000);
watchdog.unref();
let server, browser;
try {
  server = await createServer({ logLevel: "warn", server: { port: 4316, host: "127.0.0.1" } });
  await server.listen();
  const base = server.resolvedUrls.local[0];
  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 860 });
  await page.goto(base, { waitUntil: "load" });
  await page.waitForSelector(".Gallery");
  await page.evaluate(() => (window.__VELVET_DEBUG = true));
  await page.click('[data-shot="bottom-sheet"] [data-velvet-trigger]');
  await page.waitForFunction(() => window.__velvet && window.__velvet.count() > 0);
  await page.evaluate(() => window.__velvet.freeze(1));
  await new Promise((r) => setTimeout(r, 100));
  const data = await page.evaluate(() => {
    const r = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const b = el.getBoundingClientRect();
      return { y: Math.round(b.y), h: Math.round(b.height), x: Math.round(b.x), w: Math.round(b.width) };
    };
    const scroll = document.querySelector('[data-velvet="scroll"]');
    return {
      scrollEl: r('[data-velvet="scroll"]'),
      spacer: r('[data-velvet="spacer"]'),
      contentArea: r('[data-velvet="content-area"]'),
      content: r('[data-velvet="content"]'),
      bleed: r('[data-velvet="bleeding-background"]'),
      metrics: scroll
        ? { scrollTop: scroll.scrollTop, scrollHeight: scroll.scrollHeight, clientHeight: scroll.clientHeight }
        : null,
      contentAreaStyle: (() => {
        const el = document.querySelector('[data-velvet="content-area"]');
        if (!el) return null;
        const s = getComputedStyle(el);
        return { flex: s.flex, height: s.height, justifyContent: s.justifyContent, flexDirection: s.flexDirection };
      })(),
    };
  });
  console.log(JSON.stringify(data, null, 2));
} catch (e) {
  console.error(e);
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(0);
}
