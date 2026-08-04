import { mkdir, readFile, writeFile } from "node:fs/promises";
import { DOCS, SITE_ORIGIN, docToMarkdown, getDocPath } from "../src/docs/catalog.js";
import { DEMO_SOURCES } from "../src/docs/demo-sources.js";

const check = process.argv.includes("--check");
const demoFiles = await Promise.all(
  DEMO_SOURCES.map(async (demo) => {
    const [component, styles] = await Promise.all([
      readFile(`src/playground/examples/${demo.file}.jsx`, "utf8"),
      readFile(`src/playground/examples/${demo.file}.css`, "utf8"),
    ]);
    return [
      `public/docs/examples/${demo.id}.md`,
      `# ${demo.title} homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: ${SITE_ORIGIN}/docs/gallery-recipes

## JSX

\`\`\`jsx
${component.trim()}
\`\`\`

## CSS

\`\`\`css
${styles.trim()}
\`\`\`
`,
    ];
  }),
);
const documentationLinks = DOCS.map(
  (doc) => `- [${doc.title}](${SITE_ORIGIN}${getDocPath(doc.slug)}): ${doc.description} ([Markdown](${SITE_ORIGIN}/docs/${doc.slug}.md))`,
).join("\n");

const files = new Map([
  ["public/llms.txt", `# Velvet UI\n\n> Velvet UI is the @velvetui/react package: headless, native-feeling React sheets and toasts with resilient gestures, nested stacks, and spring motion.\n\nInstall with \`npm install @velvetui/react\`. Start with the sheet or toast quick start, then use the focused package subpaths and CSS entries for the pieces your interface needs.\n\n## Start here\n\n- [NPM package](https://www.npmjs.com/package/@velvetui/react)\n- [Documentation index](${SITE_ORIGIN}/docs)\n- [Interactive sheet gallery](${SITE_ORIGIN}/)\n- [Interactive toast gallery](${SITE_ORIGIN}/toasts)\n- [License options and terms](${SITE_ORIGIN}/?license=open)\n\n## License summary\n\n- Free: non-commercial use, unlimited projects, forever access, and free support.\n- Individual: $20 plus tax for commercial use by an individual or a team with fewer than three members.\n- Organization: $129 plus tax for commercial use limited to one organization.\n- Codebase access: contact sales through the license dialog.\n\n## Documentation\n\n${documentationLinks}\n\n## Full reference\n\n- [Complete documentation](${SITE_ORIGIN}/llms-full.txt)\n`],
  ["public/llms-full.txt", `# Velvet UI documentation\n\nGenerated from the same version-controlled source as the human-facing guides and per-page Markdown responses.\n\n${DOCS.map(docToMarkdown).join("\n\n---\n\n").trimEnd()}\n`],
  ["CHANGELOG.md", `${docToMarkdown(DOCS.find((doc) => doc.slug === "changelog")).trimEnd()}\n`],
  ["public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`],
  ["public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_ORIGIN}/</loc></url>\n  <url><loc>${SITE_ORIGIN}/toasts</loc></url>\n  <url><loc>${SITE_ORIGIN}/docs</loc></url>\n${DOCS.filter((doc) => doc.slug !== "overview").map((doc) => `  <url><loc>${SITE_ORIGIN}${getDocPath(doc.slug)}</loc></url>`).join("\n")}\n</urlset>\n`],
  ...DOCS.map((doc) => [
    `public/docs/${doc.slug}.md`,
    docToMarkdown(doc),
  ]),
  ...demoFiles,
]);

let stale = false;
for (const [path, content] of files) {
  if (check) {
    const existing = await readFile(path, "utf8").catch(() => "");
    if (existing !== content) {
      stale = true;
      console.error(`${path} is out of date. Run npm run docs:generate.`);
    }
    continue;
  }
  const directory = path.slice(0, path.lastIndexOf("/"));
  if (directory) await mkdir(directory, { recursive: true });
  await writeFile(path, content);
}

if (stale) process.exitCode = 1;
