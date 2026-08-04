// Toast store + imperative API. Entries have a short two-phase lifecycle:
// active -> removing -> removed. Marking an entry as removing lets <Toaster />
// reflow its neighbours immediately while the dismissed node finishes its own
// exit animation.
let toasts = [];
let listeners = [];
let counter = 0;
let revision = 0;
const fallbackRemovalTimers = new Map();

const emit = () => {
  const snapshot = toasts.slice();
  listeners.forEach((listener) => listener(snapshot));
};

const safelyCall = (callback, ...args) => {
  if (typeof callback !== "function") return;
  try {
    callback(...args);
  } catch (error) {
    // User callbacks must not strand the store between lifecycle phases.
    setTimeout(() => { throw error; });
  }
};

export const finalizeToast = (id) => {
  const timer = fallbackRemovalTimers.get(id);
  if (timer) clearTimeout(timer);
  fallbackRemovalTimers.delete(id);
  const next = toasts.filter((entry) => entry.id !== id);
  if (next.length === toasts.length) return;
  toasts = next;
  emit();
};

const scheduleFallbackRemoval = (id) => {
  const current = fallbackRemovalTimers.get(id);
  if (current) clearTimeout(current);
  fallbackRemovalTimers.set(id, setTimeout(() => finalizeToast(id), 1200));
};

const add = (nextToast) => {
  let id = nextToast.id;
  if (id == null) {
    do id = ++counter;
    while (toasts.some((entry) => entry.id === id));
  }
  const index = toasts.findIndex((entry) => entry.id === id);
  const now = Date.now();

  if (index >= 0) {
    const current = toasts[index];
    // A late promise resolution must not resurrect a toast the user dismissed.
    if (current.status === "removing") return id;
    const updated = {
      ...current,
      ...nextToast,
      id,
      status: "active",
      updatedAt: now,
      revision: ++revision,
    };
    if (
      current.type === "loading" &&
      nextToast.type &&
      nextToast.type !== "loading" &&
      !Object.hasOwn(nextToast, "duration")
    ) {
      // Loading toasts are persistent by default. A result update without an
      // explicit duration should fall back to the mounted Toaster's duration,
      // not inherit Infinity forever.
      updated.duration = undefined;
    }
    toasts = toasts.map((entry, itemIndex) => itemIndex === index ? updated : entry);
  } else {
    toasts = [
      ...toasts,
      {
        id,
        status: "active",
        createdAt: now,
        updatedAt: now,
        revision: ++revision,
        ...nextToast,
      },
    ];
  }
  emit();
  return id;
};

export const dismissToast = (id, reason = "programmatic") => {
  const targets = toasts.filter(
    (entry) => entry.status === "active" && (id == null || entry.id === id)
  );
  if (!targets.length) return;
  const targetIds = new Set(targets.map((entry) => entry.id));
  const dismissedAt = Date.now();
  toasts = toasts.map((entry) =>
    targetIds.has(entry.id)
      ? { ...entry, status: "removing", dismissReason: reason, dismissedAt }
      : entry
  );
  emit();

  targets.forEach((entry) => {
    const detail = { id: entry.id, reason };
    safelyCall(entry.onDismiss, entry, detail);
    if (reason === "timeout") safelyCall(entry.onAutoClose, entry, detail);
    // Normally ToastItem finalizes at the exact end of its animation. This
    // fallback also cleans entries when no <Toaster /> is mounted.
    scheduleFallbackRemoval(entry.id);
  });
};

export const subscribeToasts = (listener) => {
  listeners.push(listener);
  listener(toasts.slice());
  return () => {
    listeners = listeners.filter((candidate) => candidate !== listener);
  };
};

const variant = (type) => (message, options = {}) =>
  add({ message, type, ...options, custom: false });
const resolveText = (value, payload) => typeof value === "function" ? value(payload) : value;
const isPhaseOptions = (value) => {
  if (!value || typeof value !== "object" || Array.isArray(value) || value.$$typeof) return false;
  // React 19 nodes may be promises or arbitrary sync/async iterables. Only a
  // non-iterable plain record is an options object; node-like records remain
  // content even when their prototype is Object.prototype.
  if (
    typeof value.then === "function" ||
    typeof value[Symbol.iterator] === "function" ||
    typeof value[Symbol.asyncIterator] === "function"
  ) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
};

const resolvePhase = (phase, payload, fallback) => {
  const resolved = resolveText(phase, payload);
  if (isPhaseOptions(resolved)) {
    const message = resolveText(resolved.message, payload);
    const description = resolveText(resolved.description, payload);
    return {
      ...resolved,
      message: message == null ? fallback : message,
      // Always replace the formatter with its result. Leaving the original
      // function in place when it returns undefined makes React try to render
      // that function as a child.
      description,
    };
  }
  return { message: resolved == null ? fallback : resolved };
};

const RESET_PHASE_OPTIONS = {
  announcement: undefined,
  description: undefined,
  icon: undefined,
  dismissible: undefined,
  swipeDirections: undefined,
  important: undefined,
  action: undefined,
  cancel: undefined,
  closeButton: undefined,
  closeButtonPosition: undefined,
  closeButtonAriaLabel: undefined,
  className: undefined,
  descriptionClassName: undefined,
  classNames: undefined,
  style: undefined,
  unstyled: undefined,
  onDismiss: undefined,
  onAutoClose: undefined,
};

const update = (id, patch) => {
  const current = toasts.find((entry) => entry.id === id && entry.status === "active");
  if (!current) return undefined;
  const resolved = typeof patch === "function" ? patch(current) : patch;
  add({ ...(resolved || {}), id });
  return id;
};

const promiseToast = (promise, messages = {}) => {
  const {
    loading,
    success,
    error,
    finally: onFinally,
    ...sharedOptions
  } = messages || {};
  let loadingPhase;
  try {
    loadingPhase = resolvePhase(loading, undefined, "Loading…");
  } catch {
    loadingPhase = { message: "Loading…" };
  }
  const id = add({
    ...sharedOptions,
    ...loadingPhase,
    type: "loading",
    duration: loadingPhase.duration ?? Infinity,
    custom: false,
  });
  const ownerRevision = toasts.find((entry) => entry.id === id)?.revision;
  const stillOwnsToast = () => {
    const current = toasts.find((entry) => entry.id === id);
    return current?.status === "active" && current.revision === ownerRevision;
  };

  const settle = (type, phase, payload, fallback) => {
    if (!stillOwnsToast()) return;
    let resolvedPhase;
    try {
      resolvedPhase = resolvePhase(phase, payload, fallback);
    } catch {
      resolvedPhase = { message: "Something went wrong" };
      type = "error";
    }
    // A formatter is user code and may intentionally update or dismiss this
    // toast. Recheck after invoking it so its newer revision remains owner.
    if (!stillOwnsToast()) return;
    add({
      ...RESET_PHASE_OPTIONS,
      ...sharedOptions,
      ...resolvedPhase,
      id,
      type,
      duration: resolvedPhase.duration ?? sharedOptions.duration ?? 4000,
      custom: false,
    });
  };

  let result;
  try {
    result = typeof promise === "function" ? promise() : promise;
  } catch (reason) {
    result = Promise.reject(reason);
  }

  return Promise.resolve(result).then(
    (value) => {
      settle("success", success, value, "Success");
      return value;
    },
    (reason) => {
      settle("error", error, reason, "Something went wrong");
      throw reason;
    }
  ).finally(() => onFinally?.());
};

const dismiss = (id, reason = "programmatic") => dismissToast(id, reason);

export const toast = Object.assign(
  (message, options = {}) => add({ message, type: "default", ...options, custom: false }),
  {
    success: variant("success"),
    error: variant("error"),
    info: variant("info"),
    warning: variant("warning"),
    message: variant("default"),
    loading: (message, options = {}) =>
      add({ message, type: "loading", duration: Infinity, ...options, custom: false }),
    custom: (content, options = {}) =>
      add({ message: content, type: "default", custom: true, ...options }),
    update,
    dismiss,
    promise: promiseToast,
  }
);
