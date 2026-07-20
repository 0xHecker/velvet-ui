// Focused smoke test for the additive Sheet API facade. It exercises SSR,
// callable Root, alias props, Panel composition, snapTo/Step, and Close without
// changing any playground fixture.
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import puppeteer from "puppeteer";

const watchdog = setTimeout(() => process.exit(1), 60000);
watchdog.unref();

let server;
let browser;
const failures = [];
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!condition) failures.push(name);
};

try {
  server = await createServer({
    logLevel: "warn",
    server: { host: "127.0.0.1", port: 4321 },
  });
  await server.listen();

  const { Sheet: ServerSheet } = await server.ssrLoadModule("/src/velvet/Sheet.jsx");
  const { resolveSpringSettings, springEasing } = await server.ssrLoadModule(
    "/src/velvet/core/spring.js"
  );
  const ssr = renderToString(
    React.createElement(
      ServerSheet,
      { defaultOpen: true },
      React.createElement(
        ServerSheet.Portal,
        null,
        React.createElement("div", { id: "server-sheet" }, "Server sheet")
      )
    )
  );
  check("Sheet is callable and preserves Sheet.Root", ServerSheet === ServerSheet.Root);
  check("Portal is document-safe during SSR", ssr === "", `html=${JSON.stringify(ssr)}`);
  check(
    'skip="auto" follows reduced motion instead of acting as truthy skip',
    resolveSpringSettings({ skip: "auto" }).skip === false
  );
  const oneSampleSpring = springEasing(
    { easing: "spring", stiffness: 520, damping: 44, mass: 1 },
    { from: 0, to: 1 }
  );
  check(
    "a one-sample spring always serializes to valid WAAPI timing",
    oneSampleSpring.duration === 1 && oneSampleSpring.easing === "linear",
    JSON.stringify(oneSampleSpring)
  );

  const closedInlineSsr = renderToString(
    React.createElement(
      ServerSheet,
      null,
      React.createElement(
        ServerSheet.Panel,
        { portal: false },
        React.createElement("div", { id: "closed-inline-panel" }, "Closed")
      )
    )
  );
  check(
    "closed inline Panel obeys the same mounted gate as Portal",
    closedInlineSsr === "",
    `html=${JSON.stringify(closedInlineSsr)}`
  );

  browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 900, height: 700, hasTouch: true });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });

  await page.evaluate(async () => {
    document.getElementById("root")?.remove();
    const host = document.createElement("div");
    host.id = "sheet-api-root";
    document.body.appendChild(host);

    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js")).default;
    const { Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    window.__sheetApiEvents = [];

    const Fixture = () =>
      h(
        Sheet,
        {
          defaultOpen: false,
          defaultSnap: 1,
          onOpenChange: (open) => window.__sheetApiEvents.push(["open", open]),
          onSnapChange: (snap) => window.__sheetApiEvents.push(["snap", snap]),
        },
        h(Sheet.Trigger, { id: "api-open", action: "open" }, "Open"),
        h(
          Sheet.Panel,
          {
            id: "api-panel",
            className: "api-panel",
            side: "bottom",
            snapPoints: ["35lvh", "65lvh"],
            modal: true,
            dismissible: true,
            draggable: false,
            backdropProps: { "data-api-backdrop": "" },
            handleProps: { "data-api-handle": "" },
            viewProps: {
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
              steppingAnimationSettings: { skip: true },
            },
          },
          h(Sheet.Title, null, "API sheet"),
          h(Sheet.Step, { id: "api-step", snapTo: 2 }, "Expand"),
          h(Sheet.Close, { id: "api-close" }, "Close")
        )
      );

    createRoot(host).render(h(Fixture));
  });

  await page.waitForSelector("#api-open");
  await page.click("#api-open");
  await page.waitForSelector('[data-velvet="view"]:not([data-velvet-preview])');
  const opened = await page.evaluate(() => ({
    placement: document.querySelector('[data-velvet="view"]')?.getAttribute("data-velvet-placement"),
    modal: document.querySelector('[data-velvet="view"]')?.getAttribute("data-velvet-modal"),
    panel: Boolean(document.querySelector("#api-panel.api-panel")),
    backdrop: Boolean(document.querySelector("[data-api-backdrop]")),
    handle: Boolean(document.querySelector("[data-api-handle]")),
    events: window.__sheetApiEvents,
  }));
  check(
    "Panel routes aliases and composes optional parts",
    opened.placement === "bottom" &&
      opened.modal === "true" &&
      opened.panel &&
      opened.backdrop &&
      opened.handle,
    JSON.stringify(opened)
  );
  check(
    "open alias callback fires",
    opened.events.some(([type, value]) => type === "open" && value === true),
    JSON.stringify(opened.events)
  );

  await page.click("#api-step");
  await page.waitForFunction(() =>
    window.__sheetApiEvents.some(([type, value]) => type === "snap" && value === 2)
  );
  check("Sheet.Step/snapTo changes the snap", true);

  await page.click("#api-close");
  await page.waitForFunction(
    () => !document.querySelector('[data-velvet="view"]:not([data-velvet-preview])')
  );
  const closedEvents = await page.evaluate(() => window.__sheetApiEvents);
  check(
    "Sheet.Close unmounts Panel and fires close alias callback",
    closedEvents.some(([type, value]) => type === "open" && value === false),
    JSON.stringify(closedEvents)
  );

  // The optional Panel skin may make tall content independently scrollable,
  // but it must keep native scroll chaining so a boundary swipe can still
  // reach the sheet runway and dismiss it.
  await page.evaluate(async () => {
    document.getElementById("sheet-api-root")?.remove();
    const host = document.createElement("div");
    host.id = "tall-panel-root";
    document.body.appendChild(host);
    const ReactModule = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import("/node_modules/.vite/deps/react-dom_client.js")).default;
    const { Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    createRoot(host).render(
      h(
        Sheet,
        { defaultOpen: true },
        h(
          Sheet.Panel,
          {
            id: "tall-panel",
            side: "bottom",
            viewProps: {
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
          },
          h("div", { style: { height: "1800px" } }, "Tall panel")
        )
      )
    );
  });
  await page.waitForSelector("#tall-panel");
  await new Promise((resolve) => setTimeout(resolve, 500));
  const tallBefore = await page.evaluate(() => {
    const panel = document.querySelector("#tall-panel");
    const outer = document.querySelector(
      '[data-velvet="view"]:not([data-velvet-preview]) [data-velvet="scroll"]'
    );
    const rect = panel.getBoundingClientRect();
    return {
      x: rect.left + rect.width / 2,
      y: rect.top + Math.min(250, rect.height / 2),
      innerTop: panel.scrollTop,
      innerMax: panel.scrollHeight - panel.clientHeight,
      overscroll: getComputedStyle(panel).overscrollBehavior,
      outerTop: outer?.scrollTop ?? null,
    };
  });
  const cdp = await page.createCDPSession();
  await cdp.send("Input.synthesizeScrollGesture", {
    x: tallBefore.x,
    y: tallBefore.y,
    xDistance: 0,
    yDistance: 1100,
    speed: 4500,
    gestureSourceType: "touch",
    repeatCount: 0,
  });
  await new Promise((resolve) => setTimeout(resolve, 1000));
  const tallAfter = await page.evaluate(() => ({
    mounted: document.querySelectorAll(
      '[data-velvet="view"]:not([data-velvet-preview])'
    ).length,
  }));
  check(
    "tall Panel preserves native boundary chaining for swipe dismissal",
    tallBefore.innerMax > 0 && tallBefore.overscroll === "auto" && tallAfter.mounted === 0,
    JSON.stringify({ before: tallBefore, after: tallAfter })
  );
} catch (error) {
  console.error(error);
  failures.push("harness");
} finally {
  await browser?.close().catch(() => {});
  await server?.close().catch(() => {});
  clearTimeout(watchdog);
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s): ${failures.join(", ")}`);
  process.exit(1);
}
console.log("\nALL PASS");
