import { createDocumentStore } from "./DocumentStore.js";

const modalStore = createDocumentStore(() => ({
  modalLayers: [],
  managedInert: new Map(),
  scrollLocks: 0,
  scrollRestore: null,
}));

const restoreManagedInert = (state) => {
  state.managedInert.forEach((wasInert, element) => {
    if (element.isConnected) element.inert = wasInert;
  });
  state.managedInert.clear();
};

const syncModalInertness = (ownerDocument, state) => {
  restoreManagedInert(state);
  const activeLayer = [...state.modalLayers]
    .reverse()
    .find((element) => element?.isConnected);
  if (!activeLayer) return;

  const scopeId = activeLayer.getAttribute("data-velvet-scope");
  const protectedTargets = [activeLayer];
  if (scopeId) {
    ownerDocument
      .querySelectorAll(
        '[data-velvet="island"][data-velvet-scope], [data-velvet="external-overlay"][data-velvet-scope]'
      )
      .forEach((element) => {
        if (element.getAttribute("data-velvet-scope") === scopeId) {
          protectedTargets.push(element);
        }
      });
  }

  const protectedBranches = new Map();
  protectedTargets.forEach((target) => {
    let branch = target;
    while (branch && branch !== ownerDocument.body) {
      const parent = branch.parentElement;
      if (!parent) break;
      let branches = protectedBranches.get(parent);
      if (!branches) {
        branches = new Set();
        protectedBranches.set(parent, branches);
      }
      branches.add(branch);
      branch = parent;
    }
  });

  protectedBranches.forEach((branches, parent) => {
    for (const sibling of parent.children) {
      if (branches.has(sibling) || sibling.nodeType !== 1) continue;
      if (!state.managedInert.has(sibling)) {
        state.managedInert.set(sibling, sibling.inert);
      }
      sibling.inert = true;
    }
  });
};

export const registerModalLayer = (element) => {
  const ownerDocument = modalStore.documentOf(element);
  const state = modalStore.get(ownerDocument);
  if (!ownerDocument || !state) return () => {};
  state.modalLayers.push(element);
  syncModalInertness(ownerDocument, state);
  return () => {
    const index = state.modalLayers.lastIndexOf(element);
    if (index >= 0) state.modalLayers.splice(index, 1);
    syncModalInertness(ownerDocument, state);
  };
};

export const isFrontmostModal = (element) => {
  const state = modalStore.peek(element);
  return (
    [...(state?.modalLayers || [])]
      .reverse()
      .find((candidate) => candidate?.isConnected) === element
  );
};

export const lockDocumentScroll = (target) => {
  const ownerDocument = modalStore.documentOf(target);
  const state = modalStore.get(ownerDocument);
  if (!ownerDocument || !state || state.scrollLocks++ > 0) return;
  const element = ownerDocument.documentElement;
  const ownerWindow = ownerDocument.defaultView;
  const gap = (ownerWindow?.innerWidth || element.clientWidth) - element.clientWidth;
  state.scrollRestore = {
    hadAttribute: element.hasAttribute("data-velvet-scroll-locked"),
    paddingRight: element.style.getPropertyValue("padding-right"),
    paddingRightPriority: element.style.getPropertyPriority("padding-right"),
  };
  element.setAttribute("data-velvet-scroll-locked", "");
  if (gap > 0) element.style.paddingRight = `${gap}px`;
};

export const unlockDocumentScroll = (target) => {
  const ownerDocument = modalStore.documentOf(target);
  const state = modalStore.peek(ownerDocument);
  if (!ownerDocument || !state) return;
  state.scrollLocks = Math.max(0, state.scrollLocks - 1);
  if (state.scrollLocks > 0) return;
  const element = ownerDocument.documentElement;
  const restore = state.scrollRestore;
  if (!restore?.hadAttribute) {
    element.removeAttribute("data-velvet-scroll-locked");
  }
  if (restore?.paddingRight) {
    element.style.setProperty(
      "padding-right",
      restore.paddingRight,
      restore.paddingRightPriority
    );
  } else {
    element.style.removeProperty("padding-right");
  }
  state.scrollRestore = null;
};
