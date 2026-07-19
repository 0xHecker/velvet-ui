import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const emptyToastCssId = "\0velvet:empty-toast-css";

function inlineCss(file, seen = new Set()) {
  const absolute = resolve(file);
  if (seen.has(absolute)) return "";
  seen.add(absolute);

  const source = readFileSync(absolute, "utf8");
  return source.replace(
    /@import\s+(?:url\()?(["'])(\.\/[^"']+\.css)\1\)?\s*;/g,
    (_, _quote, specifier) => inlineCss(resolve(dirname(absolute), specifier), seen)
  );
}

function explicitCssEntries() {
  return {
    name: "velvet-explicit-css-entries",
    enforce: "pre",
    resolveId(source, importer) {
      if (source === "./Toaster.css" && importer?.endsWith("/Toaster.jsx")) {
        return emptyToastCssId;
      }
    },
    load(id) {
      if (id === emptyToastCssId) return "";
    },
    writeBundle() {
      writeFileSync(resolve(root, "dist/base.css"), inlineCss(resolve(root, "src/velvet/base.css")));
      writeFileSync(resolve(root, "dist/styles.css"), inlineCss(resolve(root, "src/velvet/styles.css")));
      copyFileSync(resolve(root, "src/velvet/index.d.ts"), resolve(root, "dist/index.d.ts"));
      copyFileSync(resolve(root, "src/velvet/entries/sheet.d.ts"), resolve(root, "dist/sheet.d.ts"));
      copyFileSync(resolve(root, "src/velvet/entries/toast.d.ts"), resolve(root, "dist/toast.d.ts"));
    },
  };
}

const externalReact = (id) =>
  id === "react" ||
  id.startsWith("react/") ||
  id === "react-dom" ||
  id.startsWith("react-dom/");

export default defineConfig({
  plugins: [explicitCssEntries(), react()],
  build: {
    copyPublicDir: false,
    emptyOutDir: true,
    minify: false,
    sourcemap: true,
    target: "es2019",
    lib: {
      entry: {
        index: resolve(root, "src/velvet/index.js"),
        sheet: resolve(root, "src/velvet/entries/sheet.js"),
        toast: resolve(root, "src/velvet/entries/toast.js"),
      },
      formats: ["es", "cjs"],
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: externalReact,
      output: {
        exports: "named",
      },
    },
  },
});
