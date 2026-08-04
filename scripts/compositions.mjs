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
    const { BottomSheet, Lightbox, PersistentSheet, Sheet } = await import(
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
    const CustomButton = React.forwardRef(function CustomButton(
      { children, ...props },
      ref
    ) {
      return h("button", { ...props, ref, "data-product-button": "" }, children);
    });
    const CustomSurface = React.forwardRef(function CustomSurface(
      { children, ...props },
      ref
    ) {
      return h("section", { ...props, ref, "data-product-surface": "" }, children);
    });

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

    window.__customTriggerRef = React.createRef();
    window.__renderCustomPanel = () => {
      root.render(
        h(
          Sheet.Root,
          { key: "custom-panel" },
          h(
            Sheet.Trigger,
            { asChild: true, ref: window.__customTriggerRef },
            h(CustomButton, { id: "custom-panel-open" }, "Open custom panel")
          ),
          h(
            Sheet.Panel,
            {
              asChild: true,
              viewProps: skip,
              view: h(
                CustomSurface,
                { className: "product-view" },
                h("span", { id: "custom-view-decoration" })
              ),
              backdrop: h(CustomSurface, { className: "product-backdrop" }),
              backdropProps: { className: "velvet-backdrop" },
              handle: h(CustomButton, { "aria-label": "Resize custom panel" }),
              handleProps: { className: "product-handle" },
            },
            h(
              CustomSurface,
              { id: "custom-panel", className: "product-panel" },
              h(Sheet.Title, null, "Custom panel"),
              h(
                Sheet.Close,
                { asChild: true },
                h(CustomButton, { id: "custom-panel-close" }, "Done")
              )
            )
          )
        )
      );
    };

    window.__renderCustomBottom = () => {
      root.render(
        h(
          BottomSheet.Root,
          { key: "custom-bottom" },
          h(
            BottomSheet.Trigger,
            { asChild: true },
            h(CustomButton, { id: "custom-bottom-open" }, "Open branded sheet")
          ),
          h(
            BottomSheet.Content,
            {
              asChild: true,
              viewProps: skip,
              backdrop: h(CustomSurface, { className: "brand-backdrop" }),
              handle: h(CustomButton, { "aria-label": "Resize branded sheet" }),
              bleedingBackground: h(CustomSurface, { className: "brand-background" }),
            },
            h(
              CustomSurface,
              { id: "custom-bottom", className: "brand-sheet" },
              h(BottomSheet.Title, null, "Branded sheet"),
              h(
                BottomSheet.Close,
                { asChild: true },
                h(CustomButton, { id: "custom-bottom-close" }, "Close")
              )
            )
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

  await page.evaluate(() => window.__renderCustomPanel());
  await page.waitForSelector("#custom-panel-open");
  const customTriggerRef = await page.evaluate(
    () => window.__customTriggerRef.current?.id
  );
  await page.click("#custom-panel-open");
  await page.waitForSelector("#custom-panel");
  const customPanel = await page.evaluate(() => {
    const content = document.querySelector("#custom-panel");
    const view = document.querySelector(".product-view");
    const backdrop = document.querySelector(".product-backdrop");
    const handle = content?.querySelector(".product-handle");
    const close = content?.querySelector("#custom-panel-close");
    return {
      contentNode: content?.tagName,
      contentPrimitive: content?.hasAttribute("data-velvet-panel"),
      viewNode: view?.tagName,
      viewPrimitive: view?.getAttribute("data-velvet"),
      viewDecoration: Boolean(view?.querySelector("#custom-view-decoration")),
      backdropPrimitive: backdrop?.getAttribute("data-velvet"),
      backdropClasses: backdrop?.className,
      handlePrimitive: handle?.getAttribute("data-velvet"),
      closeTrigger: close?.hasAttribute("data-velvet-trigger"),
    };
  });
  check(
    "Sheet.Panel preserves custom trigger refs and custom surface/part behavior",
    customTriggerRef === "custom-panel-open" &&
      customPanel.contentNode === "SECTION" &&
      customPanel.contentPrimitive &&
      customPanel.viewNode === "SECTION" &&
      customPanel.viewPrimitive === "view" &&
      customPanel.viewDecoration &&
      customPanel.backdropPrimitive === "backdrop" &&
      customPanel.backdropClasses.includes("velvet-backdrop") &&
      customPanel.backdropClasses.includes("product-backdrop") &&
      customPanel.handlePrimitive === "handle" &&
      customPanel.closeTrigger,
    JSON.stringify({ customTriggerRef, ...customPanel })
  );
  await page.click("#custom-panel-close");
  await page.waitForFunction(() => !document.querySelector("#custom-panel"));
  await page
    .waitForFunction(() => document.activeElement?.id === "custom-panel-open", {
      timeout: 2000,
    })
    .catch(() => {});
  const customRestoredFocus = await page.evaluate(
    () => document.activeElement?.id || document.activeElement?.tagName
  );
  check(
    "a custom Close component dismisses and restores focus to a custom Trigger",
    customRestoredFocus === "custom-panel-open",
    String(customRestoredFocus)
  );

  await page.evaluate(() => window.__renderCustomBottom());
  await page.waitForSelector("#custom-bottom-open");
  await page.click("#custom-bottom-open");
  await page.waitForSelector("#custom-bottom");
  const customBottom = await page.evaluate(() => {
    const content = document.querySelector("#custom-bottom");
    return {
      contentNode: content?.tagName,
      contentPrimitive: content?.getAttribute("data-velvet-bottom-sheet"),
      backgroundPrimitive: content
        ?.querySelector(".brand-background")
        ?.getAttribute("data-velvet"),
      handlePrimitive: content
        ?.querySelector('[aria-label="Resize branded sheet"]')
        ?.getAttribute("data-velvet"),
      scroll: Boolean(content?.querySelector('[data-velvet-scroll="view"]')),
      backdropPrimitive: document
        .querySelector(".brand-backdrop")
        ?.getAttribute("data-velvet"),
    };
  });
  check(
    "styled compositions keep their mechanics when every visual part is custom",
    customBottom.contentNode === "SECTION" &&
      customBottom.contentPrimitive === "content" &&
      customBottom.backgroundPrimitive === "bleeding-background" &&
      customBottom.handlePrimitive === "handle" &&
      customBottom.scroll &&
      customBottom.backdropPrimitive === "backdrop",
    JSON.stringify(customBottom)
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
