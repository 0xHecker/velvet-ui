import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";

const watchdog = setTimeout(() => {
  console.error("FAIL  site navigation exceeded 45 seconds");
  process.exit(1);
}, 45_000);
watchdog.unref();

const routes = [
  {
    label: "Toasts",
    href: "/toasts",
    path: "/toasts",
    heading: "A React toast with some momentum",
  },
  { label: "Docs", href: "/docs", path: "/docs/0.3.0", heading: "Overview" },
  {
    label: "Recipes",
    href: "/recipes",
    path: "/recipes",
    heading: "Production-Ready Patterns",
  },
  {
    label: "Sheets",
    href: "/",
    path: "/",
    heading: "Swipeable sheets that feel native",
  },
];
const cycles = Number(process.env.VELVET_NAV_CYCLES || 3);
const externalBase = process.env.VELVET_NAV_BASE;

let server;
let browser;
let cacheDir;

try {
  if (!externalBase) {
    cacheDir = await mkdtemp(join(tmpdir(), "velvet-site-navigation-"));
    server = await createServer({
      cacheDir,
      logLevel: "warn",
      server: { host: "127.0.0.1", port: 4336 },
    });
    await server.listen();
  }

  browser = await launchBrowser({ headless: true, args: ["--no-sandbox"] });
  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 1000 });
  page.setDefaultTimeout(8_000);

  const events = [];
  page.on("console", (message) => {
    if (["error", "warning", "warn"].includes(message.type())) {
      events.push(`console:${message.type()} ${message.text()}`);
    }
  });
  page.on("pageerror", (error) => {
    const cause = error.cause;
    events.push(
      `pageerror ${error.stack || error.message}${
        cause ? ` cause=${cause.stack || cause.message || String(cause)}` : ""
      }`,
    );
  });
  page.on("requestfailed", (request) => {
    events.push(
      `requestfailed ${request.method()} ${request.url()} ${
        request.failure()?.errorText || ""
      }`,
    );
  });

  await page.goto(externalBase || server.resolvedUrls.local[0], {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => document.querySelector("h1")?.textContent);

  for (let cycle = 1; cycle <= cycles; cycle += 1) {
    for (const route of routes) {
      const eventStart = events.length;
      const link = await page.$(
        `nav[aria-label="Primary navigation"] a[href="${route.href}"]`,
      );
      if (!link) throw new Error(`${route.label} navigation link is missing.`);

      const rect = await link.evaluate((element) => {
        const bounds = element.getBoundingClientRect();
        const x = bounds.left + bounds.width / 2;
        const y = bounds.top + bounds.height / 2;
        return {
          x,
          y,
          hitTarget: document.elementFromPoint(x, y) === element,
          inert: Boolean(element.closest("[inert]")),
        };
      });
      if (!rect.hitTarget || rect.inert) {
        throw new Error(`${route.label} navigation link is not interactive.`);
      }

      await page.mouse.click(rect.x, rect.y);
      try {
        await page.waitForFunction(
          (path) => location.pathname === path,
          { timeout: 5_000 },
          route.path,
        );
      } catch {
        throw new Error(
          `${route.label} did not reach ${route.path}; current URL is ${page.url()}${
            events.length === eventStart
              ? ""
              : `; ${events.slice(eventStart).join(" | ")}`
          }`,
        );
      }
      try {
        await page.waitForFunction(
          (heading) => document.querySelector("h1")?.textContent === heading,
          { timeout: 5_000 },
          route.heading,
        );
      } catch {
        throw new Error(
          `${route.label} reached ${route.path}, but its route content did not render.`,
        );
      }

      const state = await Promise.race([
        page.evaluate(() => ({
          heading: document.querySelector("h1")?.textContent || null,
          inert: document.querySelectorAll("[inert]").length,
          dialogs: document.querySelectorAll('[role="dialog"]').length,
        })),
        new Promise((_, reject) =>
          setTimeout(
            () =>
              reject(new Error(`${route.label} renderer became unresponsive.`)),
            3_000,
          ),
        ),
      ]);

      if (state.heading !== route.heading) {
        throw new Error(
          `${route.label} rendered heading ${JSON.stringify(state.heading)} instead of ${JSON.stringify(route.heading)}.`,
        );
      }
      if (state.inert !== 0 || state.dialogs !== 0) {
        throw new Error(
          `${route.label} retained ${state.inert} inert nodes and ${state.dialogs} dialogs.`,
        );
      }
      if (events.length !== eventStart) {
        throw new Error(
          `${route.label} emitted ${events.slice(eventStart).join(" | ")}`,
        );
      }

      console.log(
        `PASS  cycle ${cycle}: ${route.label} tab navigates to ${route.path}`,
      );
      await new Promise((resolve) => setTimeout(resolve, 300));
    }
  }

  console.log("\nALL PASS");
} catch (error) {
  console.error(error.stack || error.message);
  process.exitCode = 1;
} finally {
  clearTimeout(watchdog);
  await browser?.close();
  await server?.close();
  if (cacheDir) await rm(cacheDir, { recursive: true, force: true });
}
