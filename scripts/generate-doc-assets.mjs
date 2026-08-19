import { mkdir, readFile, writeFile } from "node:fs/promises";
import {
  CURRENT_DOCS_VERSION,
  DOC_VERSIONS,
  SITE_ORIGIN,
  docToMarkdown,
  getDocMarkdownPath,
  getDocPath,
  loadDocsSnapshot,
} from "../src/docs/versioning.js";
import { RECIPES, getRecipePath } from "../src/recipes/catalog.js";

const check = process.argv.includes("--check");
const invariants = await readFile("INVARIANTS.md", "utf8");
const snapshots = await Promise.all(
  DOC_VERSIONS.map(async (entry) => ({
    ...entry,
    snapshot: await loadDocsSnapshot(entry.version),
  }))
);
const currentSnapshot = snapshots.find(
  (entry) => entry.version === CURRENT_DOCS_VERSION
)?.snapshot;

if (!currentSnapshot) {
  throw new Error(`Missing documentation snapshot ${CURRENT_DOCS_VERSION}.`);
}

const DOCS = currentSnapshot.docs;

const exampleMarkdown = (example, version) => `# ${example.title} homepage demo source

> This source was captured with the Velvet UI ${version} documentation. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: ${SITE_ORIGIN}${getDocPath("gallery-recipes", version)}

## JSX

\`\`\`jsx
${example.component}
\`\`\`

## CSS

\`\`\`css
${example.styles}
\`\`\`
`;

const versionFiles = snapshots.flatMap(({ version, snapshot }) => {
  const links = snapshot.docs.map(
    (doc) => `- [${doc.title}](${SITE_ORIGIN}${getDocPath(doc.slug, version)}): ${doc.description} ([Markdown](${SITE_ORIGIN}${getDocMarkdownPath(doc.slug, version)}))`
  ).join("\n");
  const fullReference = `# Velvet UI ${version} documentation\n\nThis is an immutable documentation snapshot for Velvet UI ${version}.\n\n${snapshot.docs.map((doc) => docToMarkdown(doc, version)).join("\n\n---\n\n").trimEnd()}\n`;

  return [
    [`public/docs/${version}/index.md`, `# Velvet UI ${version} documentation\n\n${links}\n`],
    [`public/docs/${version}/llms.txt`, `# Velvet UI ${version} documentation\n\n${links}\n\n- [Complete ${version} reference](${SITE_ORIGIN}/docs/${version}/llms-full.txt)\n`],
    [`public/docs/${version}/llms-full.txt`, fullReference],
    ...snapshot.docs.map((doc) => [
      `public/docs/${version}/${doc.slug}.md`,
      docToMarkdown(doc, version),
    ]),
    ...snapshot.examples.map((example) => [
      `public/docs/${version}/examples/${example.id}.md`,
      exampleMarkdown(example, version),
    ]),
  ];
});

const currentDemoFiles = currentSnapshot.examples.map((example) => [
  `public/docs/examples/${example.id}.md`,
  exampleMarkdown(example, CURRENT_DOCS_VERSION),
]);
const documentationLinks = DOCS.map(
  (doc) => `- [${doc.title}](${SITE_ORIGIN}${getDocPath(doc.slug, CURRENT_DOCS_VERSION)}): ${doc.description} ([Markdown](${SITE_ORIGIN}${getDocMarkdownPath(doc.slug, CURRENT_DOCS_VERSION)}))`,
).join("\n");
const versionLinks = DOC_VERSIONS.map(
  (entry) => `- [${entry.version}${entry.status === "current" ? " (current)" : ""}](${SITE_ORIGIN}${getDocPath("overview", entry.version)})`
).join("\n");
const recipeLinks = RECIPES.map(
  (recipe) => `- [${recipe.title}](${SITE_ORIGIN}${getRecipePath(recipe.slug)}): ${recipe.description} ([Markdown](${SITE_ORIGIN}/recipes/${recipe.slug}.md))`,
).join("\n");
const recipeFiles = await Promise.all(
  RECIPES.map(async (recipe) => {
    const stackBlitzUrl = recipe.stackblitzId
      ? `https://stackblitz.com/edit/${recipe.stackblitzId}?file=${recipe.sourceFile || "src/App.jsx"}`
      : null;
    const source = recipe.source;
    const runnableNote = stackBlitzUrl
      ? `Existing StackBlitz project: ${stackBlitzUrl}`
      : `The web recipe runs directly in the documentation.`;

    return [
      `public/recipes/${recipe.slug}.md`,
      `# ${recipe.title}\n\n${recipe.description}\n\nWeb recipe: ${SITE_ORIGIN}${getRecipePath(recipe.slug)}\n\n${runnableNote}\n\n## Invariants\n\n${recipe.invariants.map((item) => `- ${item}`).join("\n")}\n\n## Exercise deliberately\n\n${recipe.notes.map((item) => `- ${item}`).join("\n")}${source ? `\n\n## App.jsx\n\n\`\`\`jsx\n${source.trim()}\n\`\`\`` : ""}\n`,
    ];
  }),
);
const recipeReference = `# Runnable recipes\n\n${recipeLinks}`;

const files = new Map([
  ["public/llms.txt", `# Velvet UI\n\n> Velvet UI is the @velvetui/react package: headless, native-feeling React sheets and toasts with resilient gestures, nested stacks, and spring motion.\n\nInstall with \`npm install @velvetui/react\` or \`bun add @velvetui/react\`. Start with the sheet or toast quick start, then use the focused package subpaths and CSS entries for the pieces your interface needs.\n\n## Start here\n\n- [NPM package](https://www.npmjs.com/package/@velvetui/react)\n- [Current documentation](${SITE_ORIGIN}${getDocPath("overview", CURRENT_DOCS_VERSION)})\n- [Interactive recipes](${SITE_ORIGIN}/recipes)\n- [Interactive sheet gallery](${SITE_ORIGIN}/)\n- [Interactive toast gallery](${SITE_ORIGIN}/toasts)\n- [Agent invariant card](${SITE_ORIGIN}/INVARIANTS.md)\n- [License options and terms](${SITE_ORIGIN}/?license=open)\n\n## Documentation versions\n\n${versionLinks}\n\n## License summary\n\n- Free: non-commercial use, unlimited projects, forever access, and free support.\n- Individual: $20 plus tax for commercial use by an individual or a team with fewer than three members.\n- Organization: $129 plus tax for commercial use limited to one organization.\n- Codebase access: contact sales through the license dialog.\n\n## Documentation ${CURRENT_DOCS_VERSION}\n\n${documentationLinks}\n\n## Runnable recipes\n\n${recipeLinks}\n\n## Full reference\n\n- [Complete current documentation](${SITE_ORIGIN}/llms-full.txt)\n- [Version-specific reference](${SITE_ORIGIN}/docs/${CURRENT_DOCS_VERSION}/llms-full.txt)\n`],
  ["public/INVARIANTS.md", invariants],
  ["public/llms-full.txt", `# Velvet UI ${CURRENT_DOCS_VERSION} documentation\n\nGenerated from the same immutable snapshot as the human-facing guides and per-page Markdown responses.\n\n${invariants.trimEnd()}\n\n---\n\n${recipeReference}\n\n---\n\n${DOCS.map((doc) => docToMarkdown(doc, CURRENT_DOCS_VERSION)).join("\n\n---\n\n").trimEnd()}\n`],
  ["CHANGELOG.md", `${docToMarkdown(DOCS.find((doc) => doc.slug === "changelog"), CURRENT_DOCS_VERSION).trimEnd()}\n`],
  ["public/robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${SITE_ORIGIN}/sitemap.xml\n`],
  ["public/docs/versions.json", `${JSON.stringify({ current: CURRENT_DOCS_VERSION, versions: DOC_VERSIONS }, null, 2)}\n`],
  ["public/sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${SITE_ORIGIN}/</loc></url>\n  <url><loc>${SITE_ORIGIN}/toasts</loc></url>\n  <url><loc>${SITE_ORIGIN}/recipes</loc></url>\n${snapshots.flatMap(({ version, snapshot }) => snapshot.docs.map((doc) => `  <url><loc>${SITE_ORIGIN}${getDocPath(doc.slug, version)}</loc></url>`)).join("\n")}\n${RECIPES.map((recipe) => `  <url><loc>${SITE_ORIGIN}${getRecipePath(recipe.slug)}</loc></url>`).join("\n")}\n</urlset>\n`],
  ...DOCS.map((doc) => [
    `public/docs/${doc.slug}.md`,
    docToMarkdown(doc, CURRENT_DOCS_VERSION),
  ]),
  ...versionFiles,
  ...currentDemoFiles,
  ...recipeFiles,
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
