import { createServer } from "vite";
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

try {
  server = await createServer({
    logLevel: "warn",
    server: { host: "127.0.0.1", port: 4326 },
  });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  page.setDefaultTimeout(10000);
  await page.setViewport({ width: 390, height: 844, hasTouch: true });
  await page.goto(server.resolvedUrls.local[0], { waitUntil: "load" });

  await page.evaluate(async () => {
    document.getElementById("root")?.remove();
    await import("/src/velvet/base.css");
    await import("/src/velvet/bottom-sheet.css");
    await import("/src/velvet/persistent-sheet.css");
    await import("/src/velvet/lightbox.css");
    const React = (await import("/node_modules/.vite/deps/react.js")).default;
    const { createRoot } = (await import(
      "/node_modules/.vite/deps/react-dom_client.js"
    )).default;
    const { BottomSheet, Lightbox, PersistentSheet } = await import(
      "/src/velvet/index.js"
    );
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const h = React.createElement;
    const skip = {
      enteringAnimationSettings: { skip: true },
      exitingAnimationSettings: { skip: true },
      steppingAnimationSettings: { skip: true },
    };

    window.__renderComposition = (name) => {
      const Composition =
        name === "bottom"
          ? BottomSheet
          : name === "persistent"
            ? PersistentSheet
            : Lightbox;
      const contentProps =
        name === "persistent"
          ? { viewProps: skip }
          : name === "bottom"
            ? { viewProps: skip }
            : { viewProps: skip };
      root.render(
        h(
          Composition.Root,
          { defaultOpen: true, defaultSnap: 1 },
          h(
            Composition.Content,
            contentProps,
            h(Composition.Title, null, `${name} title`),
            h(Composition.Description, null, `${name} description`),
            h(Composition.Close, null, "Close")
          )
        )
      );
    };
  });

  const inspect = async (name, selector) => {
    await page.evaluate((next) => window.__renderComposition(next), name);
    await page.waitForSelector(selector);
    return page.$eval(selector, (content) => {
      const view = content.closest('[data-velvet="view"]');
      const background =
        content.querySelector(
          '[data-velvet-bottom-sheet="background"], [data-velvet-persistent-sheet="background"]'
        ) || content;
      const styles = getComputedStyle(background);
      return {
        width: content.getBoundingClientRect().width,
        height: content.getBoundingClientRect().height,
        background: styles.backgroundColor,
        role: view?.getAttribute("role"),
        labelledBy: view?.getAttribute("aria-labelledby"),
        describedBy: view?.getAttribute("aria-describedby"),
        modal: view?.getAttribute("data-velvet-modal"),
        placement: view?.getAttribute("data-velvet-placement"),
      };
    });
  };

  const bottom = await inspect(
    "bottom",
    '[data-velvet-bottom-sheet="content"]'
  );
  check(
    "BottomSheet ships solid mobile geometry and dialog semantics",
    bottom.width === 390 &&
      bottom.height > 0 &&
      bottom.background !== "rgba(0, 0, 0, 0)" &&
      bottom.role === "dialog" &&
      Boolean(bottom.labelledBy) &&
      Boolean(bottom.describedBy) &&
      bottom.placement === "bottom",
    JSON.stringify(bottom)
  );

  const persistent = await inspect(
    "persistent",
    '[data-velvet-persistent-sheet="content"]'
  );
  check(
    "PersistentSheet is solid, non-modal, and bottom-aligned",
    persistent.width === 390 &&
      persistent.background !== "rgba(0, 0, 0, 0)" &&
      persistent.modal === "false" &&
      persistent.placement === "bottom",
    JSON.stringify(persistent)
  );

  const lightbox = await inspect(
    "lightbox",
    '[data-velvet-lightbox="content"]'
  );
  check(
    "Lightbox fills the viewport with an accessible solid surface",
    lightbox.width === 390 &&
      lightbox.height === 844 &&
      lightbox.background !== "rgba(0, 0, 0, 0)" &&
      lightbox.role === "dialog" &&
      Boolean(lightbox.labelledBy) &&
      Boolean(lightbox.describedBy) &&
      lightbox.placement === "center",
    JSON.stringify(lightbox)
  );
} catch (error) {
  console.error(error);
  failures.push("harness");
} finally {
  if (browser) await browser.close();
  if (server) await server.close();
}

if (failures.length) {
  console.error(`\n${failures.length} failure(s): ${failures.join(", ")}`);
  process.exit(1);
}
