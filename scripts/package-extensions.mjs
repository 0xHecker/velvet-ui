import { createRequire } from "node:module";

const require = createRequire(import.meta.url);

const esm = {
  root: await import("@velvetui/react"),
  adapters: await import("@velvetui/react/adapters"),
  radix: await import("@velvetui/react/radix"),
  reactAria: await import("@velvetui/react/react-aria"),
  baseUi: await import("@velvetui/react/base-ui"),
  testing: await import("@velvetui/react/testing"),
};
const cjs = {
  root: require("@velvetui/react"),
  adapters: require("@velvetui/react/adapters"),
  radix: require("@velvetui/react/radix"),
  reactAria: require("@velvetui/react/react-aria"),
  baseUi: require("@velvetui/react/base-ui"),
  testing: require("@velvetui/react/testing"),
};

for (const [format, modules] of Object.entries({ esm, cjs })) {
  const checks = [
    modules.root.VelvetRadixPopover === modules.adapters.VelvetRadixPopover,
    modules.radix.VelvetRadixPopover === modules.adapters.VelvetRadixPopover,
    modules.reactAria.VelvetAriaSelect === modules.adapters.VelvetAriaSelect,
    modules.baseUi.VelvetBaseUIPopover === modules.adapters.VelvetBaseUIPopover,
    typeof modules.testing.expectVelvetLayer === "function",
  ];
  if (checks.includes(false)) {
    throw new Error(`${format.toUpperCase()} extension export identity mismatch`);
  }
}

console.log("PASS  adapter and testing subpath exports preserve identity");
