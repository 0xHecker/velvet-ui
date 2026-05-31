// Recon silkhq.com: full-page + section screenshots and a computed design-token
// dump (fonts, colors, type scale). Writes to shots/silk/.
import puppeteer from "puppeteer";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const OUT = resolve("shots", "silk");
mkdirSync(OUT, { recursive: true });
const url = process.argv[2] || "https://silkhq.com/";
const tag = process.argv[3] || "home";

const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
try {
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 1 });
  await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
  await sleep(1500);

  // Full page.
  await page.screenshot({ path: resolve(OUT, `${tag}-full.png`), fullPage: true });
  // Top viewport.
  await page.screenshot({ path: resolve(OUT, `${tag}-top.png`) });

  const tokens = await page.evaluate(() => {
    const fams = new Set();
    const colors = {};
    const bumpColor = (c) => { if (c && c !== "rgba(0, 0, 0, 0)") colors[c] = (colors[c] || 0) + 1; };
    document.querySelectorAll("*").forEach((el) => {
      const s = getComputedStyle(el);
      fams.add(s.fontFamily);
      bumpColor(s.color);
      bumpColor(s.backgroundColor);
    });
    const grab = (sel) => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = getComputedStyle(el);
      return {
        sel,
        text: (el.textContent || "").trim().slice(0, 40),
        font: s.fontFamily,
        size: s.fontSize,
        weight: s.fontWeight,
        ls: s.letterSpacing,
        lh: s.lineHeight,
        color: s.color,
      };
    };
    const bodyS = getComputedStyle(document.body);
    const topColors = Object.entries(colors).sort((a, b) => b[1] - a[1]).slice(0, 16);
    return {
      bodyBg: bodyS.backgroundColor,
      bodyColor: bodyS.color,
      bodyFont: bodyS.fontFamily,
      bodySize: bodyS.fontSize,
      fonts: [...fams],
      loadedFonts: [...document.fonts].map((f) => `${f.family} ${f.weight} ${f.style} (${f.status})`),
      headings: ["h1", "h2", "h3", "h4", "p", "a", "button", "nav a", "li"].map(grab).filter(Boolean),
      topColors,
      title: document.title,
      links: [...document.querySelectorAll("a[href]")].map((a) => a.getAttribute("href")).filter((h) => h && !h.startsWith("http")).slice(0, 30),
    };
  });
  console.log(JSON.stringify(tokens, null, 2));
} catch (e) {
  console.error("recon error:", e.message);
} finally {
  await browser.close().catch(() => {});
}
