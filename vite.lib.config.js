import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { transform as transformCss } from "lightningcss";
import react from "@vitejs/plugin-react";
import { minify as minifyJs } from "terser";
import { defineConfig } from "vite";

const root = dirname(fileURLToPath(import.meta.url));
const emptyToastCssId = "\0velvet:empty-toast-css";
// Favor repeated standards-safe compression. `unsafe_*`, getter assumptions,
// and property mangling save negligible bytes here while risking consumer code.
const terserOptions = {
  compress: {
    passes: 10,
  },
  format: {
    comments: false,
  },
};

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

function writeMinifiedCss(outputName, sourceFile) {
  const source = inlineCss(resolve(root, sourceFile));
  const { code } = transformCss({
    filename: sourceFile,
    code: Buffer.from(source),
    minify: true,
    sourceMap: false,
  });
  writeFileSync(resolve(root, `dist/${outputName}`), code);
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
      writeMinifiedCss("base.css", "src/velvet/base.css");
      writeMinifiedCss("sheet.css", "src/velvet/sheet.css");
      writeMinifiedCss("toast.css", "src/velvet/toast.css");
      writeMinifiedCss("toast-theme.css", "src/velvet/toast-theme.css");
      writeMinifiedCss("styles.css", "src/velvet/styles.css");
      writeMinifiedCss("card-expansion.css", "src/velvet/card-expansion.css");
      writeMinifiedCss("depth-sheet.css", "src/velvet/depth-sheet.css");
      writeMinifiedCss("bottom-sheet.css", "src/velvet/bottom-sheet.css");
      writeMinifiedCss("persistent-sheet.css", "src/velvet/persistent-sheet.css");
      writeMinifiedCss("lightbox.css", "src/velvet/lightbox.css");
      for (const entry of [
        "index",
        "sheet",
        "motion",
        "motion-react",
        "utilities",
        "sheet-morph",
        "theme-backdrop",
        "toast",
        "card-expansion",
        "depth-sheet",
        "bottom-sheet",
        "persistent-sheet",
        "lightbox",
        "adapters",
        "radix",
        "react-aria",
        "base-ui",
        "testing",
      ]) {
        copyFileSync(
          resolve(root, `.velvet-types/entries/${entry}.d.ts`),
          resolve(root, `dist/${entry}.d.ts`)
        );
      }
    },
  };
}

function finalizePublishedJavaScript() {
  return {
    name: "velvet-finalize-published-javascript",
    async generateBundle(_options, bundle) {
      for (const output of Object.values(bundle)) {
        if (output.type !== "chunk") continue;
        // Rollup adds JSX purity annotations before Terser runs. After
        // compression, some comments no longer sit immediately
        // before the expression they describe. A consumer build then warns
        // about every misplaced annotation before removing it. The library is
        // already fully tree-shaken and minified at this point, so stripping
        // these comments keeps the published syntax clean without changing
        // runtime code.
        const cleanCode = output.code.replace(
          /\/\*\s*[@#]__PURE__\s*\*\//g,
          ""
        );
        const result = await minifyJs(cleanCode, {
          ...terserOptions,
          module: output.fileName.endsWith(".js"),
        });
        if (!result.code) {
          throw new Error(`Terser emitted no code for ${output.fileName}`);
        }
        output.code = result.code;
      }
    },
  };
}

const externalReact = (id) =>
  id === "react" ||
  id.startsWith("react/") ||
  id === "react-dom" ||
  id.startsWith("react-dom/");

export default defineConfig({
  plugins: [explicitCssEntries(), react(), finalizePublishedJavaScript()],
  build: {
    copyPublicDir: false,
    emptyOutDir: true,
    minify: "terser",
    sourcemap: false,
    target: "es2019",
    terserOptions,
    lib: {
      entry: {
        index: resolve(root, "src/velvet/entries/index.ts"),
        sheet: resolve(root, "src/velvet/entries/sheet.ts"),
        motion: resolve(root, "src/velvet/entries/motion.ts"),
        "motion-react": resolve(root, "src/velvet/entries/motion-react.ts"),
        utilities: resolve(root, "src/velvet/entries/utilities.ts"),
        "sheet-morph": resolve(root, "src/velvet/entries/sheet-morph.ts"),
        "theme-backdrop": resolve(root, "src/velvet/entries/theme-backdrop.ts"),
        toast: resolve(root, "src/velvet/entries/toast.ts"),
        "card-expansion": resolve(root, "src/velvet/entries/card-expansion.ts"),
        "depth-sheet": resolve(root, "src/velvet/entries/depth-sheet.ts"),
        "bottom-sheet": resolve(root, "src/velvet/entries/bottom-sheet.ts"),
        "persistent-sheet": resolve(root, "src/velvet/entries/persistent-sheet.ts"),
        lightbox: resolve(root, "src/velvet/entries/lightbox.ts"),
        adapters: resolve(root, "src/velvet/entries/adapters.ts"),
        radix: resolve(root, "src/velvet/entries/radix.ts"),
        "react-aria": resolve(root, "src/velvet/entries/react-aria.ts"),
        "base-ui": resolve(root, "src/velvet/entries/base-ui.ts"),
        testing: resolve(root, "src/velvet/entries/testing.ts"),
      },
      fileName: (format, entryName) =>
        `${entryName}.${format === "es" ? "js" : "cjs"}`,
    },
    rollupOptions: {
      external: externalReact,
      output: [
        {
          format: "es",
          exports: "named",
          chunkFileNames: "chunks/[hash].js",
        },
        {
          format: "cjs",
          exports: "named",
          chunkFileNames: "chunks/[hash].cjs",
        },
      ],
    },
  },
});
