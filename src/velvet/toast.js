// Toast store + imperative API. A tiny pub/sub the <Toaster /> subscribes to;
// toast(...) and toast.success(...) etc. push entries. Reusing an id updates a
// toast in place (used by toast.promise to swap loading → success/error).
let toasts = [];
let listeners = [];
let counter = 0;
const emit = () => listeners.forEach((l) => l(toasts));

const add = (toast) => {
  const id = toast.id != null ? toast.id : ++counter;
  const i = toasts.findIndex((t) => t.id === id);
  if (i >= 0) toasts = toasts.map((t) => (t.id === id ? { ...t, ...toast, id } : t));
  else toasts = [...toasts, { id, createdAt: Date.now(), ...toast }];
  emit();
  return id;
};

const dismiss = (id) => {
  toasts = id == null ? [] : toasts.filter((t) => t.id !== id);
  emit();
};

export const subscribeToasts = (l) => {
  listeners.push(l);
  l(toasts);
  return () => {
    listeners = listeners.filter((x) => x !== l);
  };
};

const variant = (type) => (message, opts = {}) => add({ message, type, ...opts });
const text = (m, v) => (typeof m === "function" ? m(v) : m);

export const toast = Object.assign((message, opts = {}) => add({ message, type: "default", ...opts }), {
  success: variant("success"),
  error: variant("error"),
  info: variant("info"),
  warning: variant("warning"),
  message: variant("default"),
  loading: (message, opts = {}) => add({ message, type: "loading", duration: Infinity, ...opts }),
  custom: (content, opts = {}) => add({ message: content, type: "default", custom: true, ...opts }),
  dismiss,
  promise: (promise, msgs = {}) => {
    const id = add({ message: msgs.loading || "Loading…", type: "loading", duration: Infinity });
    const p = typeof promise === "function" ? promise() : promise;
    Promise.resolve(p).then(
      (v) => add({ id, type: "success", message: text(msgs.success, v) || "Success", duration: 4000 }),
      (e) => add({ id, type: "error", message: text(msgs.error, e) || "Something went wrong", duration: 4000 })
    );
    return p;
  },
});
