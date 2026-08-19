// Regression harness for an initially-controlled draggable Sheet. Setup-time
// scroll/viewport normalization must never be interpreted as a user swipe.
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

const fixture = {
  name: "initial-open-fixture",
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

const runCase = async ({ name, reducedMotion, viewport }) => {
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 430, height: 760, hasTouch: true });
  await page.emulateMediaFeatures([
    { name: "prefers-reduced-motion", value: reducedMotion ? "reduce" : "no-preference" },
  ]);
  await page.evaluateOnNewDocument((initialViewport) => {
    const state = {
      width: initialViewport.width,
      height: initialViewport.height,
      offsetTop: initialViewport.offsetTop,
      offsetLeft: initialViewport.offsetLeft,
      scale: 1,
    };
    const visualViewport = new EventTarget();
    for (const key of Object.keys(state)) {
      Object.defineProperty(visualViewport, key, { get: () => state[key] });
    }
    Object.defineProperty(window, "visualViewport", {
      configurable: true,
      get: () => visualViewport,
    });
    window.__normalizeVisualViewport = () => {
      visualViewport.dispatchEvent(new Event("resize"));
      visualViewport.dispatchEvent(new Event("scroll"));
    };

    // Reproduce the stale first observation reported by mobile engines while
    // their visual viewport and mandatory-snap runway are being normalized.
    const NativeIntersectionObserver = window.IntersectionObserver;
    window.IntersectionObserver = class InitialGeometryObserver extends NativeIntersectionObserver {
      constructor(callback, options) {
        let first = true;
        super((entries, observer) => {
          if (first) {
            first = false;
            callback(
              entries.map((entry) =>
                Object.create(entry, {
                  isIntersecting: { value: false },
                  intersectionRatio: { value: 0 },
                })
              ),
              observer,
            );
            return;
          }
          callback(entries, observer);
        }, options);
      }
    };
  }, viewport);

  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });
  await page.addStyleTag({ content: await readFile("src/velvet/velvet.css", "utf8") });
  await page.evaluate(async () => {
    const ReactModule = (await import("/@id/react")).default;
    const ReactDomClient = await import("/@id/react-dom/client");
    const createRoot =
      ReactDomClient.createRoot ??
      ReactDomClient.default?.createRoot ??
      ReactDomClient.default?.default?.createRoot;
    const { Sheet } = await import("/src/velvet/index.js");
    const h = ReactModule.createElement;
    window.__initialOpenEvents = [];
    window.__initialOpenEntered = 0;
    window.__initialOpenExited = 0;

    createRoot(document.getElementById("root")).render(
      h(
        Sheet.Root,
        {
          open: true,
          onOpenChange: (open, detail) =>
            window.__initialOpenEvents.push({ open, reason: detail?.reason }),
          onEnterComplete: () => window.__initialOpenEntered++,
          onExitComplete: () => window.__initialOpenExited++,
        },
        h(
          Sheet.Panel,
          {
            side: "bottom",
            draggable: true,
            viewProps: { enteringAnimationSettings: { skip: "auto" } },
          },
          h(Sheet.Title, null, "Initially open sheet"),
          h("p", null, "No setup event may dismiss this layer."),
        ),
      ),
    );

    requestAnimationFrame(() => {
      window.__normalizeVisualViewport();
      const scroll = document.querySelector('[data-velvet="scroll"]');
      if (scroll) {
        scroll.dispatchEvent(new Event("scroll"));
      }
    });
  });

  await page.waitForSelector('[data-velvet="view"]');
  await new Promise((resolve) => setTimeout(resolve, reducedMotion ? 300 : 1200));
  const result = await page.evaluate(() => ({
    events: window.__initialOpenEvents,
    entered: window.__initialOpenEntered,
    exited: window.__initialOpenExited,
    viewConnected: Boolean(document.querySelector('[data-velvet="view"]')),
    travel: document
      .querySelector('[data-velvet="view"]')
      ?.getAttribute("data-velvet-travel"),
  }));

  check(
    `${name}: no false open-change request before interaction`,
    !result.events.some((event) => event.open === false),
    JSON.stringify(result),
  );
  check(
    `${name}: remains mounted after multiple animation frames`,
    result.viewConnected,
    JSON.stringify(result),
  );
  check(
    `${name}: enter completes exactly once without an exit`,
    result.entered === 1 && result.exited === 0,
    JSON.stringify(result),
  );

  await page.close();
};

try {
  server = await createServer({
    configFile: false,
    logLevel: "warn",
    plugins: [react(), fixture],
    server: { host: "127.0.0.1", port: 4324 },
  });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });

  await runCase({
    name: "normal motion",
    reducedMotion: false,
    viewport: { width: 430, height: 760, offsetTop: 0, offsetLeft: 0 },
  });
  await runCase({
    name: "reduced motion",
    reducedMotion: true,
    viewport: { width: 430, height: 760, offsetTop: 0, offsetLeft: 0 },
  });
  await runCase({
    name: "pre-offset visual viewport",
    reducedMotion: true,
    viewport: { width: 430, height: 442, offsetTop: 178, offsetLeft: 0 },
  });
} catch (error) {
  console.error(error);
  failures.push("harness");
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(failures.length === 0 ? 0 : 1);
}
