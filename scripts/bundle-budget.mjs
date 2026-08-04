import { gzipSync } from "node:zlib";
import { readdir, readFile } from "node:fs/promises";
import { join, posix, resolve } from "node:path";
import { build } from "vite";

async function listFiles(directory, prefix = "") {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const relative = posix.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(join(directory, entry.name), relative));
    } else {
      files.push(relative);
    }
  }
  return files;
}

const publishedFiles = (await listFiles("dist"))
  .filter((file) => file.endsWith(".js") || file.endsWith(".cjs"));
const annotatedFiles = [];
for (const file of publishedFiles) {
  const source = await readFile(resolve("dist", file), "utf8");
  if (/\/\*\s*[@#]__PURE__\s*\*\//.test(source)) annotatedFiles.push(file);
}
console.log(
  `${annotatedFiles.length ? "FAIL" : "PASS"}  published chunks contain no stale pure annotations${
    annotatedFiles.length ? `  found ${annotatedFiles.join(", ")}` : ""
  }`
);

const packageJson = JSON.parse(await readFile("package.json", "utf8"));
const publicJavaScript = new Set(
  Object.values(packageJson.exports)
    .filter((entry) => entry && typeof entry === "object")
    .flatMap((entry) => [entry.import, entry.require])
    .filter(Boolean)
    .map((file) => file.replace(/^\.\/dist\//, ""))
);
const internalFiles = publishedFiles.filter(
  (file) => !publicJavaScript.has(file)
);
const exposedInternalNames = internalFiles.filter(
  (file) => !/^chunks\/[A-Za-z0-9_-]{8}\.(?:js|cjs)$/.test(file)
);
console.log(
  `${exposedInternalNames.length ? "FAIL" : "PASS"}  internal chunks use opaque filenames${
    exposedInternalNames.length
      ? `  found ${exposedInternalNames.join(", ")}`
      : ""
  }`
);

const entries = [
  {
    name: "sheet",
    source: `export { Sheet } from ${JSON.stringify(resolve("dist/sheet.js"))};`,
    budget: 20 * 1024,
    forbidden: ["motion-react", "toast-", "Toaster", "DepthSheet", "CardExpansion"],
  },
  {
    name: "motion",
    source: `export { animate, springEasing } from ${JSON.stringify(resolve("dist/motion.js"))};`,
    budget: 6 * 1024,
    forbidden: ["react", "Sheet", "Toast", "Scroll"],
  },
  {
    name: "utilities",
    source: `export { Scroll, VisuallyHidden } from ${JSON.stringify(resolve("dist/utilities.js"))};`,
    budget: 10 * 1024,
    forbidden: ["Toast", "DepthSheet", "CardExpansion"],
  },
];

const bundle = async ({ name, source }) => {
  const virtualId = `\0velvet-consumer:${name}`;
  const result = await build({
    configFile: false,
    logLevel: "silent",
    plugins: [{
      name: "velvet-consumer-entry",
      resolveId(id) {
        return id === `velvet-consumer:${name}` ? virtualId : null;
      },
      load(id) {
        return id === virtualId ? source : null;
      },
    }],
    build: {
      write: false,
      minify: true,
      target: "es2019",
      rollupOptions: {
        input: `velvet-consumer:${name}`,
        preserveEntrySignatures: "strict",
        external: (id) =>
          id === "react" ||
          id.startsWith("react/") ||
          id === "react-dom" ||
          id.startsWith("react-dom/"),
        output: {
          format: "es",
          entryFileNames: `${name}.js`,
          chunkFileNames: `${name}-[hash].js`,
        },
      },
    },
  });
  return result.output
    .filter((output) => output.type === "chunk")
    .map((output) => output.code)
    .join("\n");
};

const failures = [
  ...(annotatedFiles.length ? ["published-annotations"] : []),
  ...(exposedInternalNames.length ? ["opaque-chunk-names"] : []),
];
for (const entry of entries) {
  const code = await bundle(entry);
  const gzipBytes = gzipSync(code).byteLength;
  const forbidden = entry.forbidden.filter((term) => code.includes(term));
  const withinBudget = gzipBytes <= entry.budget;
  if (!withinBudget || forbidden.length) failures.push(entry.name);
  console.log(
    `${withinBudget ? "PASS" : "FAIL"}  @velvetui/react/${entry.name} consumer bundle  ${(
      gzipBytes / 1024
    ).toFixed(2)} kB gzip / ${(entry.budget / 1024).toFixed(0)} kB`
  );
  console.log(
    `${forbidden.length ? "FAIL" : "PASS"}  @velvetui/react/${entry.name} boundary${
      forbidden.length ? `  found ${forbidden.join(", ")}` : ""
    }`
  );
}

if (failures.length) {
  throw new Error(`Bundle verification failed: ${failures.join(", ")}`);
}
