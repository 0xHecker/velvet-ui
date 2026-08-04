const FOCUSABLE =
  'a[href],button:not([disabled]),input:not([disabled]),textarea:not([disabled]),select:not([disabled]),[tabindex]:not([tabindex="-1"])';

const scopedInteractiveRoots = (view) => {
  const scopeId = view?.getAttribute("data-velvet-scope");
  if (!scopeId || typeof document === "undefined") return view ? [view] : [];
  const roots = [view];
  document
    .querySelectorAll(
      '[data-velvet="island"][data-velvet-scope], [data-velvet="external-overlay"][data-velvet-scope]'
    )
    .forEach((element) => {
      if (
        element.getAttribute("data-velvet-scope") === scopeId &&
        !view.contains(element)
      ) {
        roots.push(element);
      }
    });
  return roots;
};

export const scopedFocusableElements = (view) => {
  const elements = [
    ...new Set(
      scopedInteractiveRoots(view).flatMap((root) => [
        ...(root.matches?.(FOCUSABLE) ? [root] : []),
        ...root.querySelectorAll(FOCUSABLE),
      ])
    ),
  ];

  return elements.sort((a, b) => {
    const position = a.compareDocumentPosition(b);
    if (position & Node.DOCUMENT_POSITION_FOLLOWING) return -1;
    if (position & Node.DOCUMENT_POSITION_PRECEDING) return 1;
    return 0;
  });
};

export const focusFirst = (root) => {
  if (!root) return;
  const element =
    root.querySelector("[data-velvet-autofocus]") ||
    root.querySelector('[data-velvet="content"]') ||
    root.querySelector(FOCUSABLE);
  element?.focus({ preventScroll: true });
};

export const restoreFocus = (element) => {
  if (!element || typeof element.focus !== "function") return;
  let branch = element;
  while (branch && branch !== document.body) {
    if (branch instanceof HTMLElement && branch.inert) branch.inert = false;
    branch = branch.parentElement;
  }
  element.focus({ preventScroll: true });
};
