import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const [homeSource, docsSource, toastsSource] = process.argv.slice(2);

if (!homeSource || !docsSource || !toastsSource) {
  console.error("Usage: node scripts/compose-og-assets.mjs <home.png> <docs.png> <toasts.png>");
  process.exit(1);
}

const outputDirectory = "public/og";
await mkdir(outputDirectory, { recursive: true });

const cards = [
  {
    source: homeSource,
    output: "velvet-ui",
    eyebrow: "VELVET UI",
    lines: ["Swipeable", "React sheets", "that feel native."],
    detail: "Headless primitives · spring motion · nested stacks",
    label: "npm i @velvetui/react",
    headingSize: 66,
  },
  {
    source: docsSource,
    output: "velvet-ui-docs",
    eyebrow: "VELVET UI",
    lines: ["Everything", "you need", "to ship it."],
    detail: "Sheets · gestures · motion · stacks · toasts",
    label: "Read the docs",
    headingSize: 66,
  },
  {
    source: toastsSource,
    output: "velvet-ui-toasts",
    eyebrow: "VELVET UI · TOASTS",
    lines: ["React toasts,", "with some", "momentum."],
    detail: "Stackable feedback you can swipe away",
    label: "@velvetui/react/toast",
    headingSize: 68,
  },
];

const escapeXml = (value) => value
  .replaceAll("&", "&amp;")
  .replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;");

function textOverlay(card) {
  const heading = card.lines
    .map((line, index) => `<tspan x="72" dy="${index === 0 ? 0 : 72}">${escapeXml(line)}</tspan>`)
    .join("");

  const detailY = 154 + (card.lines.length - 1) * 72 + 150;
  const labelY = detailY + 54;
  const labelWidth = Math.max(204, card.label.length * 12.4 + 44);

  return Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="veil" x1="0" x2="1">
          <stop offset="0" stop-color="#fffaf3" stop-opacity="0.42"/>
          <stop offset="0.47" stop-color="#fffaf3" stop-opacity="0.11"/>
          <stop offset="0.62" stop-color="#fffaf3" stop-opacity="0"/>
        </linearGradient>
      </defs>
      <rect width="720" height="630" fill="url(#veil)"/>
      <g fill="#2d1b35" font-family="Helvetica Neue, Helvetica, Arial, sans-serif">
        <g transform="translate(72 62)">
          <rect width="26" height="26" rx="8" fill="#34203c"/>
          <rect x="5" y="13" width="16" height="9" rx="4" fill="#ef8f97"/>
          <rect x="5" y="8" width="16" height="9" rx="4" fill="#cba1df"/>
          <rect x="5" y="4" width="16" height="9" rx="4" fill="#fbf7ef"/>
        </g>
        <text x="110" y="81" font-size="18" font-weight="700" letter-spacing="2.6">${escapeXml(card.eyebrow)}</text>
        <text x="72" y="154" font-size="${card.headingSize}" font-weight="600" letter-spacing="-2.4">${heading}</text>
        <text x="72" y="${detailY}" font-size="21" font-weight="500" fill="#614d65">${escapeXml(card.detail)}</text>
        <g transform="translate(72 ${labelY})">
          <rect width="${labelWidth}" height="46" rx="23" fill="#2d1b35"/>
          <circle cx="23" cy="23" r="4" fill="#ef9299"/>
          <text x="38" y="30" font-size="18" font-weight="600" fill="#fffaf5">${escapeXml(card.label)}</text>
        </g>
      </g>
    </svg>
  `);
}

for (const card of cards) {
  const image = sharp(card.source)
    .resize(1200, 630, { fit: "cover", position: "centre" })
    .composite([{ input: textOverlay(card) }]);

  await Promise.all([
    image.clone().jpeg({ quality: 84, mozjpeg: true }).toFile(path.join(outputDirectory, `${card.output}.jpg`)),
    image.clone().webp({ quality: 82, effort: 6 }).toFile(path.join(outputDirectory, `${card.output}.webp`)),
  ]);
}

const favicon = await readFile("public/favicon.svg");
await Promise.all([
  sharp(favicon).resize(180, 180).png().toFile("public/apple-touch-icon.png"),
  sharp(favicon).resize(192, 192).png().toFile("public/icon-192.png"),
  sharp(favicon).resize(512, 512).png().toFile("public/icon-512.png"),
]);

console.log("Composed three 1200x630 OG cards plus site icons in public/.");
