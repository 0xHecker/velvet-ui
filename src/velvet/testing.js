const describeNode = (node) => {
  if (!node) return "<missing>";
  const tag = node.tagName?.toLowerCase?.() || "node";
  const id = node.id ? `#${node.id}` : "";
  const velvet = node.getAttribute?.("data-velvet");
  return `<${tag}${id}${velvet ? ` data-velvet=\"${velvet}\"` : ""}>`;
};

const fail = (failures) => {
  if (!failures.length) return;
  throw new Error(
    `[Velvet UI] Layer conformance failed:\n${failures
      .map((failure) => `- ${failure}`)
      .join("\n")}`
  );
};

// DOM-only by design: this works in browser tests, jsdom, and Playwright's
// page.evaluate without taking a dependency on any one test runner.
export const expectVelvetLayer = (target, expectations = {}) => {
  const root = target?.nodeType ? target : globalThis.document;
  if (!root?.querySelectorAll) {
    throw new TypeError(
      "[Velvet UI] expectVelvetLayer requires a Document or Element."
    );
  }

  const ownerDocument = root.nodeType === 9 ? root : root.ownerDocument;
  const layerSelector =
    '[data-velvet="view"], [data-velvet="external-overlay"][data-velvet-dismiss-layer][data-velvet-open="true"]';
  const explicitLayer =
    root.nodeType === 1 && root.matches?.(layerSelector)
      ? root
      : null;
  const allLayers = [...ownerDocument.querySelectorAll(layerSelector)];
  const layer =
    explicitLayer ||
    [...root.querySelectorAll(layerSelector)].find(
      (candidate) => candidate.getAttribute("data-velvet-frontmost") === "true"
    ) ||
    root.querySelector(layerSelector);
  const failures = [];

  if (!layer) {
    fail(["No mounted Velvet dismissal layer was found."]);
  }

  const role = expectations.role ?? "dialog";
  if (role && layer.getAttribute("role") !== role) {
    failures.push(
      `${describeNode(layer)} has role ${JSON.stringify(
        layer.getAttribute("role")
      )}; expected ${JSON.stringify(role)}.`
    );
  }

  const frontmostLayers = allLayers.filter(
    (candidate) => candidate.getAttribute("data-velvet-frontmost") === "true"
  );
  if (frontmostLayers.length !== 1) {
    failures.push(
      `Expected exactly one frontmost layer; found ${frontmostLayers.length}.`
    );
  }
  if (
    expectations.frontmost !== undefined &&
    (layer.getAttribute("data-velvet-frontmost") === "true") !==
      expectations.frontmost
  ) {
    failures.push(
      `${describeNode(layer)} frontmost state did not match ${expectations.frontmost}.`
    );
  }

  const labelledBy = layer.getAttribute("aria-labelledby");
  const ariaLabel = layer.getAttribute("aria-label");
  if (!ariaLabel && (!labelledBy || !ownerDocument.getElementById(labelledBy))) {
    failures.push(`${describeNode(layer)} has no resolvable accessible title.`);
  }
  const describedBy = layer.getAttribute("aria-describedby");
  if (describedBy && !ownerDocument.getElementById(describedBy)) {
    failures.push(
      `${describeNode(layer)} aria-describedby points to a missing element.`
    );
  }

  const isSheet = layer.getAttribute("data-velvet") === "view";
  const scrollOwners = isSheet
    ? layer.querySelectorAll(':scope > [data-velvet="scroll"]')
    : [];
  if (isSheet && scrollOwners.length !== 1) {
    failures.push(
      `${describeNode(layer)} must own one direct Velvet scroll runway; found ${scrollOwners.length}.`
    );
  }

  if (layer.hasAttribute("data-velvet-nested")) {
    const host = layer.closest('[data-velvet="nested-host"]');
    if (!host) failures.push("Nested layer is not contained by a NestedPortalHost.");
    const position = ownerDocument.defaultView?.getComputedStyle(layer).position;
    if (position && position !== "absolute") {
      failures.push(`Nested layer is ${position}; expected host-relative absolute positioning.`);
    }
  }

  if (expectations.nestedWithin && !expectations.nestedWithin.contains(layer)) {
    failures.push(
      `${describeNode(layer)} is not nested within ${describeNode(
        expectations.nestedWithin
      )}.`
    );
  }

  const knownScopes = new Set(
    [...ownerDocument.querySelectorAll('[data-velvet="view"]')].map(
      (candidate) => candidate.getAttribute("data-velvet-scope")
    )
  );
  ownerDocument
    .querySelectorAll('[data-velvet="external-overlay"][data-velvet-scope]')
    .forEach((overlay) => {
      if (!knownScopes.has(overlay.getAttribute("data-velvet-scope"))) {
        failures.push(
          `${describeNode(overlay)} is enrolled in an unknown Velvet scope.`
        );
      }
    });

  if (layer.getAttribute("role") === "alertdialog") {
    const active = ownerDocument.activeElement;
    if (!layer.contains(active)) {
      failures.push("Alert dialog does not contain the active focus target.");
    }
  }

  if (expectations.restoresFocusTo) {
    const inspected = ownerDocument.defaultView?.__velvet?.inspect?.() || [];
    const matching = inspected.find((entry) => entry.element === layer);
    if (matching?.plannedRestoreTarget !== expectations.restoresFocusTo) {
      failures.push(
        `Planned focus restoration does not target ${describeNode(
          expectations.restoresFocusTo
        )}.`
      );
    }
  }

  fail(failures);
  return layer;
};
