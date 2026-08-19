// Contract coverage for dismissal request/commit phases, focus lifecycle,
// third-party dismissal ownership, diagnostics, inspection, and conformance.
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { readFile } from "node:fs/promises";
import { launchBrowser } from "./browser-launch.mjs";

const watchdog = setTimeout(() => process.exit(1), 60000);
watchdog.unref();

let server;
let browser;
const failures = [];
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!condition) failures.push(name);
};

const htmlFixture = {
  name: "overlay-contract-fixture",
  configureServer(viteServer) {
    viteServer.middlewares.use(async (request, response, next) => {
      if (request.url !== "/") return next();
      const html = await viteServer.transformIndexHtml(
        request.url,
        '<!doctype html><html><body><button id="restore-landmark">Library</button><div id="root"></div></body></html>',
      );
      response.statusCode = 200;
      response.setHeader("content-type", "text/html");
      response.end(html);
    });
  },
};

try {
  server = await createServer({
    configFile: false,
    logLevel: "warn",
    plugins: [react(), htmlFixture],
    server: { host: "127.0.0.1", port: 4325 },
  });
  await server.listen();

  const { Sheet: ServerSheet } = await server.ssrLoadModule("/src/velvet/Sheet.jsx");
  const { Lightbox: ServerLightbox } = await server.ssrLoadModule(
    "/src/velvet/Lightbox.jsx"
  );
  let familyError = "";
  try {
    renderToString(
      React.createElement(
        ServerLightbox.Root,
        null,
        React.createElement(ServerSheet.Close, null, "Wrong close")
      )
    );
  } catch (error) {
    familyError = String(error?.message || error);
  }
  check(
    "mismatched Sheet and Lightbox parts fail with an actionable diagnostic",
    familyError.includes("Sheet.Close") &&
      familyError.includes("Lightbox.Root") &&
      familyError.includes("Lightbox.Close"),
    familyError
  );

  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 900, height: 700 });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await page.addStyleTag({ content: await readFile("src/velvet/velvet.css", "utf8") });

  await page.evaluate(async () => {
    const ReactModule = (await import("/@id/react")).default;
    const ReactDomClient = await import("/@id/react-dom/client");
    const createRoot =
      ReactDomClient.createRoot ??
      ReactDomClient.default?.createRoot ??
      ReactDomClient.default?.default?.createRoot;
    const { Sheet, ExternalOverlay } = await import("/src/velvet/index.js");
    const { expectVelvetLayer } = await import("/src/velvet/testing.js");
    const h = ReactModule.createElement;

    window.__overlayContract = {
      allowDismiss: false,
      changes: [],
      requests: [],
      externalDismissals: [],
      entered: 0,
      exited: 0,
      externalExited: 0,
    };

    let open = true;
    let externalOpen = false;
    let conditionalExternalOpen = false;
    const initialFocusRef = ReactModule.createRef();
    const restoreFocusRef = { current: document.getElementById("restore-landmark") };
    const ConditionalPopup = ReactModule.forwardRef(function ConditionalPopup(
      { visible, ...props },
      ref
    ) {
      return visible
        ? h("div", { ...props, ref, id: "conditional-popup", role: "dialog" })
        : null;
    });
    window.__contractRoot = createRoot(document.getElementById("root"));

    const renderFixture = () => {
      window.__contractRoot.render(h(
        Sheet.Root,
        {
          open,
          initialFocusRef,
          restoreFocusRef,
          onDismissRequest: async (detail) => {
            window.__overlayContract.requests.push(detail.reason);
            await new Promise((resolve) => setTimeout(resolve, 70));
            return window.__overlayContract.allowDismiss;
          },
          onOpenChange: (next, detail) => {
            window.__overlayContract.changes.push([next, detail.reason]);
            open = next;
            renderFixture();
          },
          onEnterComplete: () => window.__overlayContract.entered++,
          onExitComplete: () => window.__overlayContract.exited++,
        },
        h(
          Sheet.Panel,
          {
            side: "bottom",
            viewProps: {
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
          },
          h(Sheet.Title, null, "Overlay contract"),
          h(Sheet.Description, null, "Request and lifecycle fixture."),
          h("button", { id: "initial-focus", ref: initialFocusRef }, "Safe focus"),
          h(
            ExternalOverlay.DismissLayer,
            {
              asChild: true,
              open: externalOpen,
              restoreFocusRef: initialFocusRef,
              onDismiss: (detail) => {
                window.__overlayContract.externalDismissals.push(detail.reason);
                externalOpen = false;
                renderFixture();
              },
              onExitComplete: () => window.__overlayContract.externalExited++,
            },
            h(
              "div",
              { id: "external-popup", role: "dialog", "aria-label": "Command menu" },
              h("button", null, "Command")
            )
          ),
          h(
            ExternalOverlay.DismissLayer,
            {
              asChild: true,
              open: conditionalExternalOpen,
              onDismiss: () => {
                conditionalExternalOpen = false;
                renderFixture();
              },
            },
            h(ConditionalPopup, { visible: conditionalExternalOpen })
          ),
          h(Sheet.Close, { id: "request-close" }, "Close")
        )
      ));
    };
    window.__setExternalOpen = (next) => {
      externalOpen = next;
      renderFixture();
    };
    window.__setConditionalExternalOpen = (next) => {
      conditionalExternalOpen = next;
      renderFixture();
    };
    renderFixture();
    window.__expectVelvetLayer = expectVelvetLayer;
  });

  await page.waitForFunction(() => document.activeElement?.id === "initial-focus");
  await new Promise((resolve) => setTimeout(resolve, 50));
  const closedConditionalErrors = consoleErrors.filter((message) =>
    message.includes("VELVET_EXTERNAL_OVERLAY_NON_DOM")
  );
  check(
    "a closed external overlay may intentionally render no DOM surface",
    closedConditionalErrors.length === 0,
    closedConditionalErrors.join(" | ")
  );

  await page.evaluate(() => window.__setConditionalExternalOpen(true));
  await page.waitForSelector(
    '#conditional-popup[data-velvet-dismiss-layer][data-velvet-open="true"]'
  );
  await page.evaluate(() => window.__setConditionalExternalOpen(false));
  await page.waitForFunction(() => !document.querySelector("#conditional-popup"));

  const initial = await page.evaluate(() => {
    const view = document.querySelector('[data-velvet="view"]');
    let conformanceError = "";
    try {
      window.__expectVelvetLayer(view, {
        role: "dialog",
        frontmost: true,
        restoresFocusTo: document.getElementById("restore-landmark"),
      });
    } catch (error) {
      conformanceError = String(error?.message || error);
    }
    return {
      state: window.__overlayContract,
      activeFocus: document.activeElement?.id,
      activeFocusVelvet: document.activeElement?.getAttribute?.("data-velvet"),
      activeFocusHtml: document.activeElement?.outerHTML?.slice(0, 180),
      conformanceError,
      inspect: window.__velvet.inspect().map((entry) => ({
        kind: entry.layerKind,
        scope: entry.scopeId,
        frontmost: entry.frontmost,
        initialFocus: entry.initialFocusTarget?.id,
        restoreFocus: entry.plannedRestoreTarget?.id,
      })),
    };
  });
  check(
    "initial and restore focus targets are explicit and conformance passes",
    initial.conformanceError === "" &&
      initial.state.entered === 1 &&
      initial.activeFocus === "initial-focus" &&
      initial.inspect.length === 1,
    JSON.stringify(initial)
  );

  await page.evaluate(() => window.__setExternalOpen(true));
  await page.waitForFunction(
    () =>
      document.querySelector("#external-popup")?.getAttribute("data-velvet-frontmost") ===
      "true"
  );
  const layeredInspection = await page.evaluate(() =>
    window.__velvet.inspect().map((entry) => ({
      kind: entry.layerKind,
      scope: entry.scopeId,
      frontmost: entry.frontmost,
    }))
  );
  check(
    "development inspection exposes the Sheet and enrolled external layer",
    layeredInspection.length === 2 &&
      layeredInspection.some((entry) => entry.kind === "sheet" && !entry.frontmost) &&
      layeredInspection.some(
        (entry) => entry.kind === "external-overlay" && entry.frontmost
      ),
    JSON.stringify(layeredInspection)
  );

  await page.keyboard.press("Escape");
  await page.waitForFunction(() => window.__overlayContract.externalExited === 1);
  const afterExternalEscape = await page.evaluate(() => ({
    state: window.__overlayContract,
    sheetMounted: Boolean(document.querySelector('[data-velvet="view"]')),
    sheetFrontmost:
      document
        .querySelector('[data-velvet="view"]')
        ?.getAttribute("data-velvet-frontmost") === "true",
  }));
  check(
    "Escape dismisses only the frontmost external layer",
    afterExternalEscape.sheetMounted &&
      afterExternalEscape.sheetFrontmost &&
      afterExternalEscape.state.externalDismissals[0] === "escape" &&
      afterExternalEscape.state.requests.length === 0,
    JSON.stringify(afterExternalEscape)
  );

  await page.evaluate(() => document.getElementById("request-close").click());
  await new Promise((resolve) => setTimeout(resolve, 15));
  const pending = await page.evaluate(() => ({
    value: document
      .querySelector('[data-velvet="view"]')
      ?.getAttribute("data-velvet-dismiss-pending"),
    requests: [...window.__overlayContract.requests],
  }));
  check(
    "an async dismissal request exposes a pending phase",
    pending.value === "true" && pending.requests.at(-1) === "close-trigger",
    JSON.stringify(pending)
  );
  await new Promise((resolve) => setTimeout(resolve, 110));
  const rejected = await page.evaluate(() => ({
    state: window.__overlayContract,
    mounted: Boolean(document.querySelector('[data-velvet="view"]')),
    pending: document
      .querySelector('[data-velvet="view"]')
      ?.getAttribute("data-velvet-dismiss-pending"),
  }));
  check(
    "an async dismissal request can reject close without an open-state commit",
    rejected.mounted &&
      rejected.pending == null &&
      rejected.state.requests.at(-1) === "close-trigger" &&
      rejected.state.changes.length === 0,
    JSON.stringify(rejected)
  );

  await page.evaluate(() => {
    window.__overlayContract.allowDismiss = true;
  });
  await page.evaluate(() => document.getElementById("request-close").click());
  await page.waitForFunction(() => window.__overlayContract.exited === 1);
  await page.waitForFunction(() => document.activeElement?.id === "restore-landmark");
  const accepted = await page.evaluate(() => ({
    state: window.__overlayContract,
    mounted: Boolean(document.querySelector('[data-velvet="view"]')),
    focus: document.activeElement?.id,
  }));
  check(
    "accepted dismissal commits its reason, completes exit once, and restores focus",
    !accepted.mounted &&
      accepted.state.changes.at(-1)?.[0] === false &&
      accepted.state.changes.at(-1)?.[1] === "close-trigger" &&
      accepted.state.entered === 1 &&
      accepted.state.exited === 1 &&
      accepted.focus === "restore-landmark",
    JSON.stringify(accepted)
  );
} catch (error) {
  console.error(error);
  failures.push("harness");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(failures.length === 0 ? 0 : 1);
}
