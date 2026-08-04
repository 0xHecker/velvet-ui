// Production toast lifecycle/accessibility verification. The component no
// longer imports its stylesheet as a side effect, so this harness opts into the
// public CSS explicitly while exercising the real playground <Toaster />.
import { createServer } from "vite";
import { launchBrowser } from "./browser-launch.mjs";
import { resolve } from "node:path";

const sleep = (ms) => new Promise((resolveSleep) => setTimeout(resolveSleep, ms));
const watchdog = setTimeout(() => process.exit(1), 90000);
watchdog.unref();

let server;
let browser;
let passed = true;
const results = [];
const errors = [];
const check = (name, condition, detail = "") => {
  passed = passed && Boolean(condition);
  results.push(`${condition ? "PASS" : "FAIL"}  ${name}  ${detail}`);
};

const activeCount = (page) => page.$$eval('.Toast:not([data-state="exiting"])', (nodes) => nodes.length);
const clearToasts = async (page) => {
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss();
  });
  await page.waitForFunction(() => !document.querySelector(".Toast"), { timeout: 4000 }).catch(() => {});
};
const createToasts = (page, entries) => page.evaluate(async (items) => {
  const { toast } = await import("/src/velvet/toast.js");
  items.forEach((item) => toast(item.message, item.options));
}, entries);

try {
  server = await createServer({ logLevel: "warn", server: { port: 4319, host: "127.0.0.1" } });
  await server.listen();
  browser = await launchBrowser({ headless: true, args: ["--no-sandbox", "--force-color-profile=srgb"] });
  const page = await browser.newPage();
  page.on("pageerror", (error) => errors.push(`pageerror: ${String(error)}`));
  page.on("console", (message) => {
    if (message.type() !== "error") return;
    const text = message.text();
    if (/Failed to load resource|favicon\.ico|status of 404/i.test(text)) return;
    errors.push(text);
  });
  page.setDefaultTimeout(15000);
  await page.setViewport({ width: 1280, height: 860, deviceScaleFactor: 1 });
  await page.goto(new URL("/toasts", server.resolvedUrls.local[0]).href, { waitUntil: "load" });
  // Consumer CSS intentionally loads first. Its class selectors must still
  // beat the default skin's low-specificity close-button declarations.
  await page.addStyleTag({ content: `
    .consumer-close { width: 24px; height: 24px; background: rgb(250, 240, 255); }
    .consumer-close-icon { font-size: 7px; }
  ` });
  await page.addStyleTag({ path: resolve("src/velvet/Toaster.css") });
  await page.waitForSelector(".Toastpg");

  // === 0) Store identity and loading-update invariants ====================
  const storeInvariants = await page.evaluate(async () => {
    const { subscribeToasts, toast } = await import("/src/velvet/toast.js");
    let snapshot = [];
    const unsubscribe = subscribeToasts((entries) => { snapshot = entries; });
    toast("Explicit numeric id", { id: 1, duration: Infinity });
    const autoId = toast("Automatic id", { duration: Infinity });
    const loadingId = toast.loading("Loading", { id: "loading-reuse" });
    toast.success("Complete", { id: loadingId });
    const loadingResult = snapshot.find((entry) => entry.id === loadingId);
    const result = {
      autoId,
      explicitMessage: snapshot.find((entry) => entry.id === 1)?.message,
      autoMessage: snapshot.find((entry) => entry.id === autoId)?.message,
      loadingType: loadingResult?.type,
      loadingDuration: loadingResult?.duration ?? null,
    };
    unsubscribe();
    return result;
  });
  check(
    "automatic ids never overwrite explicit numeric ids",
    storeInvariants.autoId !== 1 &&
      storeInvariants.explicitMessage === "Explicit numeric id" &&
      storeInvariants.autoMessage === "Automatic id",
    JSON.stringify(storeInvariants)
  );
  check(
    "loading-to-result reuse falls back to the Toaster duration",
    storeInvariants.loadingType === "success" && storeInvariants.loadingDuration == null,
    JSON.stringify(storeInvariants)
  );
  await clearToasts(page);

  // === 1) Middle removal reflows immediately; ResizeObserver follows height ===
  await createToasts(page, [
    { message: "Alpha", options: { id: "gap-a", duration: Infinity } },
    { message: "Bravo", options: { id: "gap-b", duration: Infinity } },
    { message: "Charlie", options: { id: "gap-c", duration: Infinity } },
  ]);
  await page.waitForFunction(() => document.querySelectorAll('.Toast[data-state="open"]').length === 3);
  // The list is a fixed-position layout container whose own box can be zero;
  // hover the front toast so the real bubbling mouseenter path is exercised.
  await page.hover('[data-toast-id="gap-c"]');
  // Measure from the expanded resting layout, not while the entry transition is
  // still travelling toward its first measured position.
  await sleep(500);
  const beforeRemoval = await page.$eval('[data-toast-id="gap-a"]', (element) => {
    const matrix = new DOMMatrixReadOnly(getComputedStyle(element).transform);
    return matrix.m42;
  });
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss("gap-b");
  });
  await sleep(70);
  const duringRemoval = await page.evaluate(() => {
    const alpha = document.querySelector('[data-toast-id="gap-a"]');
    const bravo = document.querySelector('[data-toast-id="gap-b"]');
    const matrix = new DOMMatrixReadOnly(getComputedStyle(alpha).transform);
    return { alphaY: matrix.m42, bravoState: bravo?.getAttribute("data-state") };
  });
  check(
    "middle dismissal starts neighbour reflow before the exiting node unmounts",
    duringRemoval.bravoState === "exiting" && duringRemoval.alphaY > beforeRemoval + 2,
    `before=${beforeRemoval.toFixed(1)} during=${duringRemoval.alphaY.toFixed(1)} middle=${duringRemoval.bravoState}`
  );
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="gap-b"]'));
  await sleep(460);
  const settledGap = await page.evaluate(() => {
    const alpha = document.querySelector('[data-toast-id="gap-a"]').getBoundingClientRect();
    const charlie = document.querySelector('[data-toast-id="gap-c"]').getBoundingClientRect();
    return Math.round(charlie.top - alpha.bottom);
  });
  check("remaining expanded toasts settle contiguously", Math.abs(settledGap - 14) <= 2, `gap=${settledGap}`);

  const beforeHeight = await page.$eval('[data-toast-id="gap-c"]', (element) => element.offsetHeight);
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.update("gap-c", {
      description: "A dynamically inserted description that wraps and changes the measured toast height without remounting.",
    });
  });
  await page.waitForFunction(
    (height) => document.querySelector('[data-toast-id="gap-c"]')?.offsetHeight > height,
    {},
    beforeHeight
  );
  const afterHeight = await page.$eval('[data-toast-id="gap-c"]', (element) => element.offsetHeight);
  check("ResizeObserver tracks in-place content height", afterHeight > beforeHeight, `before=${beforeHeight} after=${afterHeight}`);
  await page.mouse.move(300, 300);
  await clearToasts(page);

  // === 2) visibleToasts cap queues and promotes without starting hidden timers ===
  await createToasts(page, [1, 2, 3, 4, 5].map((number) => ({
    message: `Queue ${number}`,
    options: { id: `queue-${number}`, duration: Infinity },
  })));
  await page.waitForFunction(() => document.querySelector('.Toaster')?.dataset.visibleCount === "3");
  const capBefore = await page.$eval(".Toaster", (element) => ({
    active: element.querySelectorAll('.Toast:not([data-state="exiting"])').length,
    queued: Number(element.dataset.queueCount),
    ids: [...element.querySelectorAll('.Toast:not([data-state="exiting"])')].map((node) => node.dataset.toastId),
  }));
  check(
    "visibleToasts caps the mounted active queue",
    capBefore.active === 3 && capBefore.queued === 2 && capBefore.ids.join(",") === "queue-3,queue-4,queue-5",
    JSON.stringify(capBefore)
  );
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss("queue-5");
  });
  await page.waitForFunction(() => document.querySelector('[data-toast-id="queue-2"]'));
  const capDuring = await page.$eval(".Toaster", (element) => ({
    active: element.querySelectorAll('.Toast:not([data-state="exiting"])').length,
    queued: Number(element.dataset.queueCount),
    exiting: element.querySelectorAll('.Toast[data-state="exiting"]').length,
  }));
  check(
    "dismissing a visible toast promotes one queued toast immediately",
    capDuring.active === 3 && capDuring.queued === 1 && capDuring.exiting === 1,
    JSON.stringify(capDuring)
  );
  await clearToasts(page);

  await createToasts(page, ["A", "B", "C"].map((letter) => ({
    message: `Historical ${letter}`,
    options: { id: `history-${letter}`, duration: Infinity },
  })));
  await page.waitForFunction(() => document.querySelectorAll('.Toast[data-state="open"]').length === 3);
  await createToasts(page, [{
    message: "Historical D",
    options: { id: "history-D", duration: Infinity },
  }]);
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="history-A"]'));
  await sleep(80);
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss("history-A");
  });
  await sleep(100);
  check(
    "dismissing a formerly visible queued toast never remounts an exit ghost",
    !(await page.$('[data-toast-id="history-A"]')),
  );
  await clearToasts(page);

  // === 3) live semantics, focus pause, hotkey, Escape reason =============
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    window.__toastDismissals = [];
    toast.error("Connection lost", {
      id: "a11y-error",
      description: "Retry in a moment.",
      duration: 260,
      action: { label: "Retry" },
      onDismiss: (_entry, detail) => window.__toastDismissals.push(detail.reason),
      onAutoClose: (_entry, detail) => window.__toastDismissals.push(`auto:${detail.reason}`),
    });
  });
  await page.waitForSelector('[data-toast-id="a11y-error"][data-state="open"]');
  const semantics = await page.evaluate(() => ({
    visualLive: document.querySelector(".Toaster").getAttribute("aria-live"),
    polite: document.querySelector('[data-live="polite"]')?.getAttribute("role"),
    assertiveRole: document.querySelector('[data-live="assertive"]')?.getAttribute("role"),
    assertiveLive: document.querySelector('[data-live="assertive"]')?.getAttribute("aria-live"),
    assertiveText: document.querySelector('[data-live="assertive"]')?.textContent,
  }));
  check(
    "visual reorder is non-live while dedicated polite/assertive regions announce",
    semantics.visualLive == null && semantics.polite === "status" && semantics.assertiveRole === "alert" &&
      semantics.assertiveLive === "assertive" && semantics.assertiveText.includes("Connection lost"),
    JSON.stringify(semantics)
  );
  await page.focus('[data-toast="success"]');
  await page.keyboard.down("Alt");
  await page.keyboard.press("KeyT");
  await page.keyboard.up("Alt");
  const hotkeyFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-toast-id"));
  await sleep(420);
  check(
    "Alt+T focuses the front toast and focus pauses auto-close",
    hotkeyFocus === "a11y-error" && (await activeCount(page)) === 1,
    `focus=${hotkeyFocus} active=${await activeCount(page)}`
  );
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="a11y-error"]'));
  const dismissalReasons = await page.evaluate(() => window.__toastDismissals);
  const restoredFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-toast"));
  check(
    "Escape dismisses with one explicit reason and restores the hotkey origin",
    dismissalReasons.join(",") === "escape" && restoredFocus === "success",
    `reasons=${dismissalReasons.join(",")} focus=${restoredFocus}`
  );

  await createToasts(page, ["A", "B"].map((letter) => ({
    message: `Focus ${letter}`,
    options: { id: `focus-${letter}`, duration: Infinity },
  })));
  await page.waitForFunction(() => document.querySelectorAll('.Toast[data-state="open"]').length === 2);
  await page.focus('[data-toast="success"]');
  for (let index = 0; index < 2; index++) {
    await page.keyboard.down("Alt");
    await page.keyboard.press("KeyT");
    await page.keyboard.up("Alt");
  }
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="focus-B"]'));
  await page.keyboard.press("Escape");
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="focus-A"]'));
  const repeatedHotkeyFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-toast"));
  check(
    "repeated hotkeys and stepped dismissals preserve the original focus target",
    repeatedHotkeyFocus === "success",
    `focus=${repeatedHotkeyFocus}`
  );

  await createToasts(page, [{
    message: "Pinned",
    options: { id: "pinned", duration: Infinity, dismissible: false },
  }]);
  await page.waitForSelector('[data-toast-id="pinned"][data-state="open"]');
  await page.focus('[data-toast-id="pinned"]');
  await page.keyboard.press("Escape");
  await sleep(120);
  check(
    "Escape respects dismissible=false",
    Boolean(await page.$('[data-toast-id="pinned"]')),
  );
  await clearToasts(page);

  await createToasts(page, [{
    message: "Keyboard close",
    options: { id: "keyboard-close", duration: Infinity, closeButton: true },
  }]);
  await page.waitForSelector('[data-toast-id="keyboard-close"][data-state="open"]');
  await page.focus('[data-toast="success"]');
  await page.keyboard.down("Alt");
  await page.keyboard.press("KeyT");
  await page.keyboard.up("Alt");
  await page.focus('[data-toast-id="keyboard-close"] [data-slot="close-button"]');
  await page.keyboard.press("Enter");
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="keyboard-close"]'));
  const keyboardCloseFocus = await page.evaluate(() => document.activeElement?.getAttribute("data-toast"));
  check(
    "keyboard close-button dismissal restores the hotkey focus origin",
    keyboardCloseFocus === "success",
    `focus=${keyboardCloseFocus}`
  );

  await createToasts(page, [
    {
      message: "Close on left",
      options: {
        id: "close-left",
        duration: Infinity,
        closeButton: true,
        closeButtonPosition: "left",
        classNames: { closeButton: "consumer-close", closeIcon: "consumer-close-icon" },
      },
    },
    {
      message: "Close on right",
      options: { id: "close-right", duration: Infinity, closeButton: true },
    },
  ]);
  await page.waitForFunction(() => document.querySelectorAll('[data-slot="close-button"]').length === 2);
  const closeButtonContract = await page.evaluate(() => {
    const read = (id) => {
      const toast = document.querySelector(`[data-toast-id="${id}"]`);
      const button = toast?.querySelector('[data-slot="close-button"]');
      const icon = button?.querySelector('[data-slot="close-icon"]');
      const toastRect = toast?.getBoundingClientRect();
      const buttonRect = button?.getBoundingClientRect();
      return {
        side: button?.dataset.side,
        closeClass: button?.classList.contains("consumer-close"),
        iconClass: icon?.classList.contains("consumer-close-icon"),
        size: buttonRect?.width,
        cssSize: button ? Number.parseFloat(getComputedStyle(button).width) : 0,
        background: button ? getComputedStyle(button).backgroundColor : "",
        iconSize: icon ? Number.parseFloat(getComputedStyle(icon).fontSize) : 0,
        leftDistance: buttonRect && toastRect
          ? Math.abs(buttonRect.left + buttonRect.width / 2 - toastRect.left)
          : Infinity,
        rightDistance: buttonRect && toastRect
          ? Math.abs(buttonRect.left + buttonRect.width / 2 - toastRect.right)
          : Infinity,
      };
    };
    return { left: read("close-left"), right: read("close-right") };
  });
  check(
    "close button supports left/right placement and separate icon styling",
    closeButtonContract.left.side === "left" &&
      closeButtonContract.right.side === "right" &&
      closeButtonContract.left.closeClass &&
      closeButtonContract.left.iconClass &&
      Math.abs(closeButtonContract.left.cssSize - 24) < 0.5 &&
      closeButtonContract.left.background === "rgb(250, 240, 255)" &&
      Math.abs(closeButtonContract.left.iconSize - 7) < 0.5 &&
      closeButtonContract.left.leftDistance < 4 &&
      closeButtonContract.right.rightDistance < 4,
    JSON.stringify(closeButtonContract)
  );
  await clearToasts(page);

  // === 4) additive update/promise/styling hooks ===========================
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast("Starting", { id: "update", duration: Infinity });
    toast.update("update", { message: "Updated in place", type: "success" });
    window.__promiseFinally = 0;
    await toast.promise(Promise.resolve({ name: "photo.jpg" }), {
      id: "promise",
      loading: { message: "Uploading", description: "Preparing file" },
      success: (value) => ({ message: `Uploaded ${value.name}`, description: "Ready", duration: Infinity }),
      error: "Upload failed",
      finally: () => { window.__promiseFinally += 1; },
    });
    toast("Bare", {
      id: "unstyled",
      duration: Infinity,
      unstyled: true,
      className: "consumer-toast",
      classNames: { title: "consumer-title" },
    });
  });
  await page.waitForFunction(() => document.querySelector('[data-toast-id="promise"]')?.textContent.includes("Uploaded photo.jpg"));
  const additive = await page.evaluate(() => {
    const bare = document.querySelector('[data-toast-id="unstyled"]');
    const style = getComputedStyle(bare);
    return {
      updated: document.querySelector('[data-toast-id="update"]')?.textContent,
      promise: document.querySelector('[data-toast-id="promise"]')?.textContent,
      finallyCount: window.__promiseFinally,
      bareClass: bare?.classList.contains("consumer-toast"),
      titleClass: bare?.querySelector('[data-slot="title"]')?.classList.contains("consumer-title"),
      unstyled: bare?.hasAttribute("data-unstyled"),
      background: style.backgroundColor,
      shadow: style.boxShadow,
      attrs: [bare?.dataset.slot, bare?.dataset.state, bare?.dataset.type, bare?.dataset.position],
    };
  });
  check(
    "update, rich promise phases, and finally remain single-entry operations",
    additive.updated.includes("Updated in place") && additive.promise.includes("Ready") && additive.finallyCount === 1,
    JSON.stringify(additive)
  );
  check(
    "class/style hooks and unstyled data contract retain layout without skin",
    additive.bareClass && additive.titleClass && additive.unstyled && additive.background === "rgba(0, 0, 0, 0)" &&
      additive.shadow === "none" && additive.attrs.every(Boolean),
    JSON.stringify(additive)
  );
  await clearToasts(page);

  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    const work = new Promise((resolveWork) => { window.__resolveLateToast = resolveWork; });
    toast.promise(work, {
      id: "late-promise",
      loading: "Still working",
      success: "Finished",
    });
  });
  await page.waitForSelector('[data-toast-id="late-promise"]');
  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    toast.dismiss("late-promise");
  });
  await page.waitForFunction(() => !document.querySelector('[data-toast-id="late-promise"]'));
  await page.evaluate(() => window.__resolveLateToast("done"));
  await sleep(120);
  check(
    "a dismissed promise toast cannot resurrect after its work settles",
    !(await page.$('[data-toast-id="late-promise"]')),
  );

  const promiseInvariants = await page.evaluate(async () => {
    const { subscribeToasts, toast } = await import("/src/velvet/toast.js");
    let snapshot = [];
    const unsubscribe = subscribeToasts((entries) => { snapshot = entries; });
    let phaseFinally = 0;
    const phaseValue = await toast.promise(Promise.resolve("phase-value"), {
      id: "phase-only-options",
      loading: "Loading phase",
      success: { important: true, duration: Infinity },
      finally: () => { phaseFinally += 1; },
    });
    const phaseEntry = snapshot.find((entry) => entry.id === "phase-only-options");

    let formatterFinally = 0;
    const formatterValue = await toast.promise(Promise.resolve("formatter-value"), {
      id: "formatter-throws",
      loading: "Formatting",
      success: () => { throw new Error("formatter failed"); },
      finally: () => { formatterFinally += 1; },
    });
    const formatterEntry = snapshot.find((entry) => entry.id === "formatter-throws");

    await toast.promise(Promise.resolve("phase-reset"), {
      id: "phase-reset",
      loading: {
        message: "Loading-only state",
        icon: "L",
        important: true,
        className: "loading-only",
        swipeDirections: ["top"],
      },
      success: { message: "Clean result", duration: Infinity },
    });
    const resetEntry = snapshot.find((entry) => entry.id === "phase-reset");

    await toast.promise(Promise.resolve("ok"), {
      id: "formatter-owner",
      loading: "Owned loading",
      success: (value) => {
        toast.update("formatter-owner", {
          message: "Manual formatter update",
          type: "info",
          duration: Infinity,
        });
        return `Resolved ${value}`;
      },
    });
    const formatterOwnerEntry = snapshot.find((entry) => entry.id === "formatter-owner");

    toast.custom("Custom content", { id: "custom-reuse", duration: Infinity });
    toast.success("Standard content", { id: "custom-reuse", duration: Infinity });
    const customReuseEntry = snapshot.find((entry) => entry.id === "custom-reuse");

    let syncRejected = false;
    try {
      await toast.promise(() => {
        toast.update("sync-owner", {
          message: "Manual replacement",
          type: "info",
          duration: Infinity,
        });
        throw new Error("task failed");
      }, {
        id: "sync-owner",
        loading: "Initial owner",
        error: "Should not overwrite",
      });
    } catch {
      syncRejected = true;
    }
    const syncEntry = snapshot.find((entry) => entry.id === "sync-owner");
    unsubscribe();
    return {
      phaseValue,
      phaseFinally,
      phaseMessage: phaseEntry?.message,
      phaseImportant: phaseEntry?.important,
      formatterValue,
      formatterFinally,
      formatterType: formatterEntry?.type,
      formatterMessage: formatterEntry?.message,
      resetIcon: resetEntry?.icon ?? null,
      resetImportant: resetEntry?.important ?? null,
      resetClassName: resetEntry?.className ?? null,
      resetSwipeDirections: resetEntry?.swipeDirections ?? null,
      formatterOwnerType: formatterOwnerEntry?.type,
      formatterOwnerMessage: formatterOwnerEntry?.message,
      customReuse: customReuseEntry?.custom,
      syncRejected,
      syncType: syncEntry?.type,
      syncMessage: syncEntry?.message,
    };
  });
  check(
    "promise phase-only options stay renderable and await includes finally",
    promiseInvariants.phaseValue === "phase-value" &&
      promiseInvariants.phaseFinally === 1 &&
      promiseInvariants.phaseMessage === "Success" &&
      promiseInvariants.phaseImportant === true,
    JSON.stringify(promiseInvariants)
  );
  check(
    "throwing promise formatters settle to a safe error without changing task semantics",
    promiseInvariants.formatterValue === "formatter-value" &&
      promiseInvariants.formatterFinally === 1 &&
      promiseInvariants.formatterType === "error" &&
      promiseInvariants.formatterMessage === "Something went wrong",
    JSON.stringify(promiseInvariants)
  );
  check(
    "a synchronous task failure cannot overwrite a manually replaced promise toast",
    promiseInvariants.syncRejected &&
      promiseInvariants.syncType === "info" &&
      promiseInvariants.syncMessage === "Manual replacement",
    JSON.stringify(promiseInvariants)
  );
  check(
    "promise phases clear loading-only presentation and preserve formatter-owned updates",
      promiseInvariants.resetIcon == null &&
      promiseInvariants.resetImportant == null &&
      promiseInvariants.resetClassName == null &&
      promiseInvariants.resetSwipeDirections == null &&
      promiseInvariants.formatterOwnerType === "info" &&
      promiseInvariants.formatterOwnerMessage === "Manual formatter update",
    JSON.stringify(promiseInvariants)
  );
  check(
    "standard variants clear custom rendering when an id is reused",
    promiseInvariants.customReuse === false,
    JSON.stringify(promiseInvariants)
  );
  await clearToasts(page);

  await page.evaluate(async () => {
    const { toast } = await import("/src/velvet/toast.js");
    const iterableNode = {
      // An arbitrary iterable may also have an incidental props field. React
      // renders the iterator, so accessibility text must use the same source.
      props: { children: "Wrong source" },
      *[Symbol.iterator]() {
        yield "Alpha";
        yield "Beta";
      },
    };
    await toast.promise(Promise.resolve("iterable"), {
      id: "iterable-phase",
      duration: Infinity,
      loading: "Loading iterable",
      success: iterableNode,
    });
    await toast.promise(Promise.resolve("optional-description"), {
      id: "optional-description",
      duration: Infinity,
      loading: "Loading description",
      success: {
        message: "No optional description",
        description: () => undefined,
      },
    });
  });
  await page.waitForFunction(() => {
    const iterable = document.querySelector('[data-toast-id="iterable-phase"]');
    const optional = document.querySelector('[data-toast-id="optional-description"]');
    return iterable?.textContent.includes("AlphaBeta") && optional?.textContent.includes("No optional description");
  });
  const reactNodeEdges = await page.evaluate(() => {
    const iterable = document.querySelector('[data-toast-id="iterable-phase"]');
    const optional = document.querySelector('[data-toast-id="optional-description"]');
    return {
      iterableText: iterable?.querySelector('[data-slot="title"]')?.textContent,
      iterableLabel: iterable?.getAttribute("aria-label"),
      liveText: document.querySelector('[data-slot="live-region"][data-live="polite"]')?.textContent,
      optionalDescription: Boolean(optional?.querySelector('[data-slot="description"]')),
    };
  });
  check(
    "plain-record iterable phases remain React nodes and keep accessible text",
    reactNodeEdges.iterableText === "AlphaBeta" &&
      reactNodeEdges.iterableLabel === "Alpha Beta" &&
      reactNodeEdges.liveText.includes("Alpha Beta"),
    JSON.stringify(reactNodeEdges)
  );
  check(
    "an optional description formatter returning undefined never leaks into JSX",
    reactNodeEdges.optionalDescription === false,
    JSON.stringify(reactNodeEdges)
  );
  await clearToasts(page);

  check("no page/runtime errors", errors.length === 0, errors.slice(0, 4).join(" | "));
  console.log("\n--- TOAST PRODUCTION ASSERTIONS ---");
  results.forEach((result) => console.log(result));
  console.log(passed ? "\nALL PASS\n" : "\nFAILED\n");
} catch (error) {
  console.error("harness error:", error);
  passed = false;
} finally {
  if (browser) await browser.close().catch(() => {});
  if (server) await server.close().catch(() => {});
  clearTimeout(watchdog);
  process.exit(passed ? 0 : 1);
}
