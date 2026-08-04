const ownerDocumentOf = (target) => {
  if (target?.nodeType === 9) return target;
  if (target?.ownerDocument) return target.ownerDocument;
  return typeof document === "undefined" ? null : document;
};

export const createDocumentStore = (createState) => {
  const states = new WeakMap();

  return {
    documentOf: ownerDocumentOf,
    get(target) {
      const ownerDocument = ownerDocumentOf(target);
      if (!ownerDocument) return null;
      let state = states.get(ownerDocument);
      if (!state) {
        state = createState(ownerDocument);
        states.set(ownerDocument, state);
      }
      return state;
    },
    peek(target) {
      const ownerDocument = ownerDocumentOf(target);
      return ownerDocument ? states.get(ownerDocument) || null : null;
    },
  };
};
