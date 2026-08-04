import { gzipSync } from "node:zlib";
import { resolve } from "node:path";
import { build } from "vite";

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

const failures = [];
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
