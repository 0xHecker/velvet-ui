// Focused smoke test for the Sheet API facade. It exercises SSR, callable
// Root, Panel composition, snapTo/Step, and Close without
// changing any playground fixture.
import React from "react";
import { renderToString } from "react-dom/server";
import { createServer } from "vite";
import react from "@vitejs/plugin-react";
import { launchBrowser } from "./browser-launch.mjs";
import { readFile } from "node:fs/promises";

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
  name: "sheet-api-html-fixture",
  configureServer(viteServer) {
    viteServer.middlewares.use(async (request, response, next) => {
      if (request.url !== "/") {
        next();
        return;
      }
      const html = await viteServer.transformIndexHtml(
        request.url,
        "<!doctype html><html><body><div id=\"root\"></div></body></html>",
      );
      response.statusCode = 200;
      response.setHeader("content-type", "text/html");
      response.end(html);
    });
  },
};
const preparePage = async (page) => {
  await page.addStyleTag({ content: await readFile("src/velvet/velvet.css", "utf8") });
  await page.addStyleTag({ content: await readFile("src/velvet/depth-sheet.css", "utf8") });
  await page.evaluate(() => {
    window.__sheetApiLoadReact = async () => {
      const ReactModule = (await import("/@id/react")).default;
      const ReactDomClient = await import("/@id/react-dom/client");
      const createRoot =
        ReactDomClient.createRoot ??
        ReactDomClient.default?.createRoot ??
        ReactDomClient.default?.default?.createRoot;
      return { ReactModule, createRoot };
    };
  });
};

try {
  server = await createServer({
    configFile: false,
    logLevel: "warn",
    plugins: [react(), htmlFixture],
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
  check(
    "playground preview infrastructure is not part of the public Sheet API",
    ServerSheet.PreviewEnvironment === undefined
  );
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

  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 900, height: 700, hasTouch: true });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await preparePage(page);

  const documentManagers = await page.evaluate(async () => {
    const {
      isFrontmostModal,
      lockDocumentScroll,
      registerModalLayer,
      unlockDocumentScroll,
    } = await import("/src/velvet/internal/ModalManager.js");
    const {
      getMorphAnimation,
      isFrontmostView,
      registerActiveView,
      registerMorphAnimation,
      unregisterMorphAnimation,
    } = await import("/src/velvet/internal/SheetMotion.js");

    const frame = document.createElement("iframe");
    frame.title = "manager isolation fixture";
    document.body.appendChild(frame);
    const frameDocument = frame.contentDocument;
    const mainLayer = document.createElement("section");
    const frameLayer = frameDocument.createElement("section");
    document.body.appendChild(mainLayer);
    frameDocument.body.appendChild(frameLayer);

    const unregisterMainModal = registerModalLayer(mainLayer);
    const unregisterFrameModal = registerModalLayer(frameLayer);
    const unregisterMainView = registerActiveView({ element: mainLayer });
    const unregisterFrameView = registerActiveView({ element: frameLayer });
    const mainAnimation = () => ({ opacity: [0, 1] });
    const frameAnimation = () => ({ opacity: [1, 0] });
    registerMorphAnimation(mainLayer, mainAnimation);
    registerMorphAnimation(frameLayer, frameAnimation);
    lockDocumentScroll(mainLayer);
    lockDocumentScroll(frameLayer);

    const result = {
      modal:
        isFrontmostModal(mainLayer) &&
        isFrontmostModal(frameLayer),
      view:
        isFrontmostView(mainLayer) &&
        isFrontmostView(frameLayer),
      morph:
        getMorphAnimation(mainLayer) === mainAnimation &&
        getMorphAnimation(frameLayer) === frameAnimation,
      scroll:
        document.documentElement.hasAttribute("data-velvet-scroll-locked") &&
        frameDocument.documentElement.hasAttribute("data-velvet-scroll-locked"),
    };

    unlockDocumentScroll(frameLayer);
    unlockDocumentScroll(mainLayer);
    unregisterMorphAnimation(frameLayer);
    unregisterMorphAnimation(mainLayer);
    unregisterFrameView();
    unregisterMainView();
    unregisterFrameModal();
    unregisterMainModal();
    frame.remove();
    mainLayer.remove();
    return result;
  });
  check(
    "modal, motion, morph, and scroll managers isolate each document",
    Object.values(documentManagers).every(Boolean),
    JSON.stringify(documentManagers)
  );

  await page.evaluate(async () => {
    document.getElementById("root")?.remove();
    const host = document.createElement("div");
    host.id = "sheet-api-root";
    document.body.appendChild(host);

    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { ExternalOverlay, Sheet } = await import("/src/velvet/index.js");
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
        h(
          Sheet.Trigger,
          {
            asChild: true,
            action: "open",
          },
          h(
            "button",
            {
              id: "api-cancel-open",
              onClick: (event) => {
                window.__sheetApiEvents.push(["cancel-click", true]);
                event.preventDefault();
              },
            },
            "Do not open"
          )
        ),
        h(
          Sheet.Trigger,
          {
            id: "api-open",
            action: "open",
            onClick: () => window.__sheetApiEvents.push(["click", true]),
            onPress: () => window.__sheetApiEvents.push(["press", true]),
          },
          "Open"
        ),
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
              id: "consumer-view-id",
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
              steppingAnimationSettings: { skip: true },
            },
          },
          h(Sheet.Title, { id: "consumer-title-id" }, "API sheet"),
          h(Sheet.Description, { id: "consumer-description-id" }, "Public API accessibility fixture"),
          h(Sheet.Step, { id: "api-step", snapTo: 2 }, "Expand"),
          h(Sheet.Close, { id: "api-close" }, "Close")
        ),
        h(
          ExternalOverlay.Root,
          { asChild: true },
          h("button", { id: "api-external" }, "External color picker")
        )
      );

    createRoot(host).render(h(Fixture));
  });

  await page.waitForSelector("#api-open");
  await page.click("#api-cancel-open");
  const cancelledOpen = await page.evaluate(() => ({
    view: Boolean(document.querySelector('[data-velvet="view"]')),
    events: window.__sheetApiEvents,
  }));
  check(
    "asChild consumer handlers can cancel the Velvet action",
    !cancelledOpen.view && cancelledOpen.events.some(([type]) => type === "cancel-click"),
    JSON.stringify(cancelledOpen)
  );
  await page.click("#api-open");
  await page.waitForSelector('[data-velvet="view"]:not([data-velvet-preview])');
  const opened = await page.evaluate(() => ({
    placement: document.querySelector('[data-velvet="view"]')?.getAttribute("data-velvet-placement"),
    modal: document.querySelector('[data-velvet="view"]')?.getAttribute("data-velvet-modal"),
    role: document.querySelector('[data-velvet="view"]')?.getAttribute("role"),
    labelledBy: document.querySelector('[data-velvet="view"]')?.getAttribute("aria-labelledby"),
    describedBy: document.querySelector('[data-velvet="view"]')?.getAttribute("aria-describedby"),
    outsideInert: document.querySelector("#sheet-api-root")?.inert,
    triggerInert: document.querySelector("#api-open")?.inert,
    externalInert: document.querySelector("#api-external")?.inert,
    triggerExpanded: document.querySelector("#api-open")?.getAttribute("aria-expanded"),
    triggerControls: document.querySelector("#api-open")?.getAttribute("aria-controls"),
    triggerHasPopup: document.querySelector("#api-open")?.getAttribute("aria-haspopup"),
    viewId: document.querySelector('[data-velvet="view"]')?.id,
    titleId: document.querySelector("h2")?.id,
    descriptionId: document.querySelector("p")?.id,
    panel: Boolean(document.querySelector("#api-panel.api-panel")),
    backdrop: Boolean(document.querySelector("[data-api-backdrop]")),
    handle: Boolean(document.querySelector("[data-api-handle]")),
    events: window.__sheetApiEvents,
  }));
  check(
    "Panel routes modern props and composes optional parts",
    opened.placement === "bottom" &&
      opened.modal === "true" &&
      opened.panel &&
      opened.backdrop &&
      opened.handle,
    JSON.stringify(opened)
  );
  check(
    "open callback fires",
    opened.events.some(([type, value]) => type === "open" && value === true) &&
      opened.events.findIndex(([type]) => type === "click") <
        opened.events.findIndex(([type]) => type === "press") &&
      opened.events.findIndex(([type]) => type === "press") <
        opened.events.findIndex(([type, value]) => type === "open" && value === true),
    JSON.stringify(opened.events)
  );
  check(
    "modal Sheet exposes its accessible name and description and makes outside UI inert",
    opened.role === "dialog" &&
      Boolean(opened.labelledBy) &&
      Boolean(opened.describedBy) &&
      opened.outsideInert === false &&
      opened.triggerInert === true &&
      opened.externalInert === false &&
      opened.triggerExpanded === "true" &&
      opened.triggerControls === opened.viewId &&
      opened.viewId === "consumer-view-id" &&
      opened.labelledBy === opened.titleId &&
      opened.describedBy === opened.descriptionId &&
      opened.triggerHasPopup === "dialog",
    JSON.stringify(opened)
  );

  await page.click("#api-step");
  await page.waitForFunction(() =>
    window.__sheetApiEvents.some(([type, value]) => type === "snap" && value === 2)
  );
  check("Sheet.Step/snapTo changes the snap", true);

  await page.focus("#api-close");
  await page.keyboard.press("Tab");
  const externalFocus = await page.evaluate(() => ({
    id: document.activeElement?.id,
    handle: document.activeElement?.hasAttribute("data-api-handle"),
  }));
  await page.keyboard.press("Tab");
  const trappedFocus = await page.evaluate(() => ({
    id: document.activeElement?.id,
    handle: document.activeElement?.hasAttribute("data-api-handle"),
  }));
  check(
    "modal focus includes owned external overlays and loops to the surface",
    externalFocus.id === "api-external" && trappedFocus.handle,
    JSON.stringify({ externalFocus, trappedFocus })
  );

  await page.click("#api-close");
  await page.waitForFunction(
    () => !document.querySelector('[data-velvet="view"]:not([data-velvet-preview])')
  );
  const closedEvents = await page.evaluate(() => ({
    events: window.__sheetApiEvents,
    focusId: document.activeElement?.id,
    outsideInert: document.querySelector("#sheet-api-root")?.inert,
    triggerExpanded: document.querySelector("#api-open")?.getAttribute("aria-expanded"),
  }));
  check(
    "Sheet.Close unmounts Panel and fires the close callback",
    closedEvents.events.some(([type, value]) => type === "open" && value === false),
    JSON.stringify(closedEvents)
  );
  check(
    "closing restores trigger focus and removes outside inertness",
    closedEvents.focusId === "api-open" &&
      closedEvents.outsideInert === false &&
      closedEvents.triggerExpanded === "false",
    JSON.stringify(closedEvents)
  );

  await page.evaluate(async () => {
    const host = document.createElement("div");
    host.id = "interrupt-api-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    window.__interruptEvents = [];
    const root = createRoot(host);
    window.__interruptApiRoot = root;
    root.render(
      h(
        Sheet.Root,
        { onOpenChange: (open) => window.__interruptEvents.push(open) },
        h(Sheet.Trigger, { id: "interrupt-open" }, "Open slowly"),
        h(
          Sheet.Portal,
          null,
          h(
            Sheet.View,
            {
              enteringAnimationSettings: {
                easing: "spring",
                stiffness: 100,
                damping: 12,
                mass: 1.4,
              },
            },
            h(
              Sheet.Content,
              { style: { minHeight: "320px", background: "white" } },
              h(Sheet.Title, null, "Interruptible sheet"),
              h(Sheet.Close, { id: "interrupt-close" }, "Close")
            )
          )
        )
      )
    );
  });
  await page.waitForSelector("#interrupt-open");
  await page.click("#interrupt-open");
  await page.waitForSelector("#interrupt-close");
  await new Promise((resolve) => setTimeout(resolve, 40));
  await page.keyboard.press("Escape");
  await page.waitForFunction(
    () => !document.querySelector("#interrupt-close"),
    { timeout: 5000 }
  );
  const interrupted = await page.evaluate(() => ({
    events: window.__interruptEvents,
    view: Boolean(document.querySelector("#interrupt-close")),
    locked: document.documentElement.hasAttribute("data-velvet-scroll-locked"),
  }));
  check(
    "close intent during entrance reverses from the rendered pose",
    interrupted.events[0] === true &&
      interrupted.events.at(-1) === false &&
      !interrupted.view &&
      !interrupted.locked,
    JSON.stringify(interrupted)
  );
  await page.evaluate(() => {
    window.__interruptApiRoot?.unmount();
    document.getElementById("interrupt-api-root")?.remove();
  });

  // The depth treatment is a shipped composition, not knowledge copied from
  // the playground. A consumer should get the receding page, full-width
  // rounded sheet, solid scroll surface, and public styling hooks without
  // supplying a single class name.
  await page.evaluate(async () => {
    document.getElementById("sheet-api-root")?.remove();
    const host = document.createElement("div");
    host.id = "depth-api-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { DepthSheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    root.render(
      h(
        DepthSheet.Root,
        {
          tokens: {
            radius: "31px",
            shift: "21px",
            scaleLoss: 0.08,
            dimming: 0.12,
          },
        },
        h(
          DepthSheet.Page,
          { asChild: true },
          h(
            "main",
            { id: "depth-api-page" },
            h(DepthSheet.Trigger, { id: "depth-api-open" }, "Open depth sheet")
          )
        ),
        h(
          DepthSheet.Content,
          {
            viewProps: {
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
            scrollViewProps: { id: "depth-api-scroll" },
          },
          h(
            "article",
            { id: "depth-api-article", style: { minHeight: "1200px" } },
            h(DepthSheet.Title, null, "Depth sheet"),
            h(DepthSheet.Description, null, "Styled by the package."),
            h(DepthSheet.Close, { id: "depth-api-close" }, "Close")
          )
        )
      )
    );
  });
  await page.waitForSelector("#depth-api-open");
  await page.click("#depth-api-open");
  await page.waitForSelector("#depth-api-close");
  const depthPreset = await page.evaluate(() => {
    const root = document.querySelector('[data-velvet-depth="root"]');
    const page = document.querySelector('[data-velvet-depth="page"]');
    const view = document.querySelector('[data-velvet-depth="view"]');
    const content = document.querySelector('[data-velvet-depth="content"]');
    const background = document.querySelector('[data-velvet-depth="background"]');
    const scroll = document.querySelector('[data-velvet-depth="scroll"]');
    const pageStyle = page && getComputedStyle(page);
    const pageMatrix =
      pageStyle?.transform && pageStyle.transform !== "none"
        ? new DOMMatrixReadOnly(pageStyle.transform)
        : null;
    const contentStyle = content && getComputedStyle(content);
    const backgroundStyle = background && getComputedStyle(background);
    const scrollStyle = scroll && getComputedStyle(scroll);
    return {
      parts: {
        root: Boolean(root),
        page: Boolean(page),
        view: Boolean(view),
        content: Boolean(content),
        background: Boolean(background),
        scroll: Boolean(scroll),
      },
      placement: view?.getAttribute("data-velvet-placement"),
      track: view?.getAttribute("data-velvet-track"),
      pageTransform: pageStyle?.transform,
      pageRadius: pageStyle?.borderRadius,
      pageScale: pageMatrix ? Math.hypot(pageMatrix.a, pageMatrix.b) : 1,
      pageShift: pageMatrix?.m42 ?? 0,
      pageFilter: pageStyle?.filter,
      contentWidth: contentStyle?.width,
      backgroundColor: backgroundStyle?.backgroundColor,
      scrollOverflowY: scrollStyle?.overflowY,
      scrollRadius: scrollStyle?.borderTopLeftRadius,
    };
  });
  check(
    "DepthSheet ships a complete styled depth composition with public hooks",
    Object.values(depthPreset.parts).every(Boolean) &&
      depthPreset.placement === "center" &&
      depthPreset.track === "vertical" &&
      depthPreset.pageTransform !== "none" &&
      Math.abs(depthPreset.pageScale - 0.92) < 0.002 &&
      Math.abs(depthPreset.pageShift - 21) < 0.5 &&
      Math.abs(Number.parseFloat(depthPreset.pageRadius) - 33) < 0.5 &&
      depthPreset.pageFilter === "brightness(0.88)" &&
      Number.parseFloat(depthPreset.contentWidth) >= 899 &&
      depthPreset.backgroundColor !== "rgba(0, 0, 0, 0)" &&
      depthPreset.scrollOverflowY === "auto" &&
      Number.parseFloat(depthPreset.scrollRadius) > 0,
    JSON.stringify(depthPreset)
  );
  await page.click("#depth-api-close");
  await page.waitForFunction(() => !document.querySelector("#depth-api-close"));

  // DepthSheet must remain composable inside a consumer-owned SheetStack.
  // Previously Content returned null because only a top-level DepthSheet
  // created a private portal host, despite the public API promising that a
  // nested root joins the nearest coordinator.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    document.getElementById("depth-api-root")?.remove();
    const host = document.createElement("div");
    host.id = "depth-generic-stack-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { DepthSheet, SheetStack } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    root.render(
      h(
        SheetStack.Root,
        { id: "consumer-owned-stack" },
        h(
          DepthSheet.Root,
          { defaultOpen: true },
          h(
            DepthSheet.Content,
            {
              viewProps: {
                enteringAnimationSettings: { skip: true },
                exitingAnimationSettings: { skip: true },
              },
            },
            h(DepthSheet.Title, null, "Consumer stack depth sheet"),
            h(DepthSheet.Close, { id: "depth-generic-stack-close" }, "Close")
          )
        )
      )
    );
  });
  await page.waitForSelector("#depth-generic-stack-close").catch(() => {});
  const genericStackDepth = await page.evaluate(() => ({
    stack: Boolean(document.querySelector("#consumer-owned-stack")),
    content: Boolean(document.querySelector("#depth-generic-stack-close")),
    privatePortalHosts: document.querySelectorAll(
      "#consumer-owned-stack [data-velvet-depth=\"portal-host\"]"
    ).length,
    portalledToBody: Boolean(
      document.body.querySelector(":scope > [data-velvet=\"view\"]")
    ),
  }));
  check(
    "DepthSheet renders inside a consumer-owned SheetStack without a private portal host",
    genericStackDepth.stack &&
      genericStackDepth.content &&
      genericStackDepth.privatePortalHosts === 0 &&
      genericStackDepth.portalledToBody,
    JSON.stringify(genericStackDepth)
  );
  if (genericStackDepth.content) {
    await page.click("#depth-generic-stack-close");
    await page.waitForFunction(() => !document.querySelector("#depth-generic-stack-close"));
  }

  // Depth is an unbounded coordinated stack, not a pair of special-case
  // selectors. Every nested Root joins its nearest DepthSheet coordinator.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    document.getElementById("depth-api-root")?.remove();
    const host = document.createElement("div");
    host.id = "depth-nested-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { DepthSheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const instantView = {
      enteringAnimationSettings: { skip: true },
      exitingAnimationSettings: { skip: true },
    };
    const Layer = ({ index }) =>
      h(
        DepthSheet.Root,
        null,
        index === 1
          ? h(
              DepthSheet.Page,
              { asChild: true },
              h("main", { id: "depth-nested-page" }, "Nested depth fixture")
            )
          : null,
        h(
          DepthSheet.Trigger,
          { id: `depth-nested-open-${index}` },
          `Open layer ${index}`
        ),
        h(
          DepthSheet.Content,
          { viewProps: instantView },
          h(DepthSheet.Title, null, `Layer ${index}`),
          h(DepthSheet.Description, null, `Depth level ${index}`),
          index < 10 ? h(Layer, { index: index + 1 }) : null
        )
      );
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    root.render(h(Layer, { index: 1 }));
  });

  for (let index = 1; index <= 10; index += 1) {
    await page.waitForSelector(`#depth-nested-open-${index}`);
    await page.click(`#depth-nested-open-${index}`);
    await page.waitForFunction(
      (count) =>
        document.querySelectorAll('[data-velvet-depth="content"]').length === count,
      {},
      index
    );
  }
  const tenLayerDepth = await page.evaluate(() => {
    const contents = [...document.querySelectorAll('[data-velvet-depth="content"]')];
    const page = document.querySelector("#depth-nested-page");
    return {
      count: contents.length,
      transformedLayers: contents
        .slice(0, -1)
        .filter((element) => getComputedStyle(element).transform !== "none").length,
      pageTransform: getComputedStyle(page).transform,
      pageBrightness: getComputedStyle(page).filter,
      portalHosts: document.querySelectorAll('[data-velvet-depth="portal-host"]').length,
    };
  });
  check(
    "ten nested DepthSheets share one coordinator and every underlying surface receives depth",
    tenLayerDepth.count === 10 &&
      tenLayerDepth.transformedLayers === 9 &&
      tenLayerDepth.pageTransform !== "none" &&
      tenLayerDepth.pageBrightness !== "none" &&
      tenLayerDepth.portalHosts === 1,
    JSON.stringify(tenLayerDepth)
  );

  for (let count = 10; count > 0; count -= 1) {
    await page.keyboard.press("Escape");
    await page.waitForFunction(
      (nextCount) =>
        document.querySelectorAll('[data-velvet-depth="content"]').length === nextCount,
      {},
      count - 1
    );
  }
  check("Escape dismisses only the frontmost layer in an arbitrary stack", true);

  // The optional Panel skin may make tall content independently scrollable,
  // but it must keep native scroll chaining so a boundary swipe can still
  // reach the sheet runway and dismiss it.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    window.__sheetApiTestRoot = null;
    document.getElementById("depth-api-root")?.remove();
    document.getElementById("sheet-api-root")?.remove();
    const host = document.createElement("div");
    host.id = "tall-panel-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    root.render(
      h(
        Sheet,
        { defaultOpen: true },
        h(
          Sheet.Panel,
          {
            id: "tall-panel",
            side: "bottom",
            style: {
              height: "min(640px, 100dvh)",
              overflowY: "auto",
              overscrollBehavior: "auto",
            },
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
      x: Math.max(1, Math.min(innerWidth - 1, rect.left + rect.width / 2)),
      y: Math.max(1, Math.min(innerHeight - 1, rect.top + Math.min(250, rect.height / 2))),
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

  // Long, independently scrolling sheets should not need application state to
  // choose an exit direction. `tracks="auto"` uses stable bidirectional
  // geometry and lets native boundary chaining choose the valid direction.
  // Scrolling content into view must never reconfigure the sheet between
  // pointer-down and click.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    window.__sheetApiTestRoot = null;
    document.getElementById("tall-panel-root")?.remove();
    const host = document.createElement("div");
    host.id = "auto-track-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Scroll, Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    window.__autoTrackClicks = 0;
    root.render(
      h(
        Sheet,
        { defaultOpen: true },
        h(
          Sheet.Portal,
          null,
          h(
            Sheet.View,
            {
              id: "auto-track-view",
              side: "center",
              tracks: "auto",
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
            h(
              Sheet.Content,
              { style: { width: "420px", height: "420px", background: "white" } },
              h(
                Scroll.Root,
                null,
                h(
                  Scroll.View,
                  { id: "auto-track-scroll", style: { height: "300px", overflow: "auto" } },
                  h(
                    Scroll.Content,
                    { style: { minHeight: "1200px", paddingTop: "950px" } },
                    h(
                      "button",
                      {
                        id: "auto-track-action",
                        onClick: () => {
                          window.__autoTrackClicks += 1;
                        },
                      },
                      "Open details"
                    )
                  )
                )
              )
            )
          )
        )
      )
    );
  });
  await page.waitForSelector("#auto-track-scroll");
  const initialAutoTrack = await page.$eval("#auto-track-view", (view) =>
    view.getAttribute("data-velvet-track")
  );
  await page.click("#auto-track-action");
  await page.waitForFunction(() => window.__autoTrackClicks === 1).catch(() => {});
  const autoTrackAfterClick = await page.evaluate(() => ({
    clicks: window.__autoTrackClicks,
    mounted: Boolean(document.querySelector("#auto-track-view")),
    track: document.querySelector("#auto-track-view")?.getAttribute("data-velvet-track"),
    tracks: document.querySelector("#auto-track-view")?.getAttribute("data-velvet-tracks"),
    scrollTop: document.querySelector("#auto-track-scroll")?.scrollTop ?? null,
  }));
  check(
    'tracks="auto" keeps click delivery stable while nested content scrolls',
    initialAutoTrack === "vertical" &&
      autoTrackAfterClick.clicks === 1 &&
      autoTrackAfterClick.mounted &&
      autoTrackAfterClick.track === "vertical" &&
      autoTrackAfterClick.tracks === "top bottom" &&
      autoTrackAfterClick.scrollTop > 0,
    JSON.stringify({ initialAutoTrack, ...autoTrackAfterClick })
  );

  // A page-wide trap inside a horizontal sheet disables swipe-back. Surface a
  // precise development diagnostic at the point of misuse instead of leaving
  // authors to reverse-engineer overscroll-behavior from a dead gesture.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    document.getElementById("auto-track-root")?.remove();
    const host = document.createElement("div");
    host.id = "gesture-trap-diagnostic-root";
    document.body.appendChild(host);
    window.__gestureTrapWarnings = [];
    window.__gestureTrapOriginalWarn = console.warn;
    console.warn = (...parts) => {
      window.__gestureTrapWarnings.push(parts.join(" "));
      window.__gestureTrapOriginalWarn(...parts);
    };
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Scroll, Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    const root = createRoot(host);
    window.__sheetApiTestRoot = root;
    root.render(
      h(
        Sheet,
        { defaultOpen: true },
        h(
          Sheet.Portal,
          null,
          h(
            Sheet.View,
            {
              side: "right",
              tracks: "right",
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
            h(
              Sheet.Content,
              { style: { width: "420px", height: "100vh", background: "white" } },
              h(
                Scroll.Root,
                null,
                h(
                  Scroll.View,
                  {
                    id: "trapped-side-page",
                    scrollGestureTrap: true,
                    style: { width: "100%", height: "100%", overflow: "auto" },
                  },
                  h(Scroll.Content, { style: { minHeight: "1200px" } })
                )
              )
            )
          )
        )
      )
    );
  });
  await page.waitForSelector("#trapped-side-page");
  await page.waitForFunction(() => window.__gestureTrapWarnings.length > 0).catch(() => {});
  const trapDiagnostic = await page.evaluate(() => ({
    handoff: document
      .querySelector("#trapped-side-page")
      ?.getAttribute("data-velvet-scroll-handoff"),
    warning: window.__gestureTrapWarnings.find((message) =>
      message.includes("preserve swipe-back")
    ),
  }));
  check(
    "page-wide gesture traps expose a precise horizontal-sheet diagnostic",
    trapDiagnostic.handoff === "x y" && Boolean(trapDiagnostic.warning),
    JSON.stringify(trapDiagnostic)
  );
  await page.evaluate(() => {
    console.warn = window.__gestureTrapOriginalWarn;
  });

  // A backdrop can opt into matching browser-chrome dimming. The theme-color
  // must be restored when the sheet leaves, including a skipped animation.
  await page.evaluate(async () => {
    window.__sheetApiTestRoot?.unmount();
    window.__sheetApiTestRoot = null;
    document.getElementById("auto-track-root")?.remove();
    let meta = document.querySelector('meta[name="theme-color"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = "rgb(255,255,255)";
    meta.dataset.velvetBase = "rgb(255,255,255)";
    const host = document.createElement("div");
    host.id = "theme-dimming-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Sheet, ThemeBackdrop } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    createRoot(host).render(
      h(
        Sheet,
        null,
        h(Sheet.Trigger, { id: "theme-open" }, "Open"),
        h(
          Sheet.Portal,
          null,
          h(
            Sheet.View,
            {
              enteringAnimationSettings: { skip: true },
              exitingAnimationSettings: { skip: true },
            },
            h(ThemeBackdrop, { themeColor: "rebeccapurple" }),
            h(Sheet.Content, null, h(Sheet.Close, { id: "theme-close" }, "Close"))
          )
        )
      )
    );
  });
  await page.click("#theme-open");
  await page.waitForSelector("#theme-close");
  await page.waitForFunction(
    () => document.querySelector('meta[name="theme-color"]')?.content !== "rgb(255,255,255)"
  ).catch(() => {});
  const dimmedTheme = await page.$eval('meta[name="theme-color"]', (meta) => meta.content);
  await page.click("#theme-close");
  await page.waitForFunction(() => !document.querySelector("#theme-close"));
  const restoredTheme = await page.$eval('meta[name="theme-color"]', (meta) => meta.content);
  const dimmedChannels = dimmedTheme.match(/[\d.]+/g)?.map(Number) || [];
  check(
    "ThemeBackdrop accepts CSS colors, follows travel, and restores the base theme",
    dimmedChannels.length >= 3 &&
      dimmedChannels[2] > dimmedChannels[0] &&
      dimmedChannels[0] > dimmedChannels[1] &&
      restoredTheme === "rgb(255,255,255)",
    JSON.stringify({ dimmedTheme, restoredTheme })
  );

  // Trigger-origin expansion is a geometry contract, not a demo transform:
  // at progress 0 the surface occupies its trigger rect; at progress 1 it
  // occupies its authored layout rect.
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await preparePage(page);
  await page.evaluate(async () => {
    document.getElementById("root")?.remove();
    document.getElementById("theme-dimming-root")?.remove();
    window.scrollTo(0, 0);
    const host = document.createElement("div");
    host.id = "morph-root";
    document.body.appendChild(host);
    const { ReactModule, createRoot } = await window.__sheetApiLoadReact();
    const { Sheet, SheetMorph } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    createRoot(host).render(
      h(
        Sheet,
        null,
        h(
          Sheet.Trigger,
          {
            id: "morph-open",
            style: {
              position: "fixed",
              left: "48px",
              top: "52px",
              width: "180px",
              height: "96px",
              borderRadius: "18px",
            },
          },
          "Expand"
        ),
        h(
          Sheet.Portal,
          null,
          h(
            Sheet.View,
            { side: "center", tracks: ["top", "bottom"] },
            h(
              SheetMorph.Content,
              {
                id: "morph-content",
                from: "trigger",
                style: {
                  width: "520px",
                  height: "360px",
                  borderRadius: "28px",
                  background: "white",
                },
              },
              "Expanded surface"
            )
          )
        )
      )
    );
  });
  const triggerRect = await page.$eval("#morph-open", (element) => element.getBoundingClientRect().toJSON());
  await page.click("#morph-open");
  await page.waitForSelector("#morph-content");
  await page.waitForFunction(() => {
    const content = document.querySelector("#morph-content");
    const wrapper = content?.closest('[data-velvet="content-area"]');
    return content?.getAnimations().length > 0 && wrapper?.getAnimations().length > 0;
  });
  const animatedOrigin = await page.$eval("#morph-content", (content) => {
    const wrapper = content.closest('[data-velvet="content-area"]');
    const contentAnimation = content.getAnimations().find((animation) =>
      animation.effect.getKeyframes().some((frame) => String(frame.transform).includes("scale"))
    );
    const wrapperAnimation = wrapper?.getAnimations().find((animation) =>
      animation.effect.getKeyframes().some((frame) => frame.transform)
    );
    const contentFrame = contentAnimation?.effect.getKeyframes()[0];
    const wrapperFrame = wrapperAnimation?.effect.getKeyframes()[0];
    if (!contentFrame?.transform || !wrapperFrame?.transform) return null;
    const contentMatrix = new DOMMatrix(contentFrame.transform);
    const wrapperMatrix = new DOMMatrix(wrapperFrame.transform);
    return {
      content: {
        a: contentMatrix.a,
        d: contentMatrix.d,
        e: contentMatrix.e,
        f: contentMatrix.f,
      },
      wrapper: { e: wrapperMatrix.e, f: wrapperMatrix.f },
      contentTransform: contentFrame.transform,
      wrapperTransform: wrapperFrame.transform,
    };
  });
  await page.waitForFunction(() => window.__velvet?.idle(), { timeout: 8000 });
  const expandedRect = await page.$eval("#morph-content", (element) => element.getBoundingClientRect().toJSON());
  const composedOrigin = animatedOrigin
    ? {
        left: expandedRect.left + animatedOrigin.wrapper.e + animatedOrigin.content.e,
        top: expandedRect.top + animatedOrigin.wrapper.f + animatedOrigin.content.f,
        width: expandedRect.width * animatedOrigin.content.a,
        height: expandedRect.height * animatedOrigin.content.d,
      }
    : null;
  const near = (a, b, tolerance = 2) => Math.abs(a - b) <= tolerance;
  check(
    'SheetMorph.Content from="trigger" expands from the invoking trigger geometry',
    composedOrigin &&
      near(composedOrigin.left, triggerRect.left, 2) &&
      near(composedOrigin.top, triggerRect.top, 2) &&
      near(composedOrigin.width, triggerRect.width, 2) &&
      near(composedOrigin.height, triggerRect.height, 2) &&
      expandedRect.width > triggerRect.width * 2,
    JSON.stringify({ triggerRect, animatedOrigin, composedOrigin, expandedRect })
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
