import { readFile } from "node:fs/promises";
import { transform as transformCss } from "lightningcss";
import {
  depthSheetDefaultTokens,
  depthSheetStackingAnimation,
  depthSheetVariables,
} from "../dist/depth-sheet.js";
import { resolveTravelStyles } from "../dist/motion.js";

const failures = [];
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!condition) failures.push(name);
};
const normalize = (value) =>
  String(value)
    .replace(/\s+/g, " ")
    .replace(/\s*,\s*/g, ", ")
    .trim();
const canonicalCssValue = (value) => {
  const { code } = transformCss({
    filename: "token.css",
    code: Buffer.from(`a{--token:${normalize(value)}}`),
    minify: true,
  });
  return /--token:([^;}]+)/.exec(code.toString())?.[1] ?? normalize(value);
};

const css = await readFile("dist/depth-sheet.css", "utf8");
for (const [name, property] of Object.entries(depthSheetVariables)) {
  const match = new RegExp(
    `${property.replace(/[.*+?^${}()|[\\]\\\\]/g, "\\$&")}\\s*:\\s*([^;]+);`,
  ).exec(css);
  check(
    `Depth token ${name} matches its shipped CSS default`,
    Boolean(match) &&
      canonicalCssValue(match[1]) === canonicalCssValue(depthSheetDefaultTokens[name]),
    match
      ? `${canonicalCssValue(match[1])} !== ${canonicalCssValue(depthSheetDefaultTokens[name])}`
      : `${property} missing`,
  );
}

const deep = resolveTravelStyles(depthSheetStackingAnimation, 10);
check(
  "the public Depth animation remains bounded at arbitrary nesting depth",
  deep.transform.includes("clamp(0.5") &&
    deep.translateY === undefined &&
    deep.borderRadius.includes("max(0px") &&
    deep.filter.includes("clamp(0.4"),
  JSON.stringify(deep),
);

const depthExports = await import("../dist/depth-sheet.js");
check(
  "ambiguous legacy Depth constants are absent",
  !("DEPTH_SHEET_TOKENS" in depthExports) &&
    !("DEPTH_SHEET_STACKING" in depthExports),
);

if (failures.length) {
  console.error(`\n${failures.length} failure(s): ${failures.join(", ")}`);
  process.exit(1);
}
