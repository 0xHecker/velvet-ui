import { useCallback } from "react";

export const setRef = (ref, value) => {
  if (typeof ref === "function") ref(value);
  else if (ref && typeof ref === "object") ref.current = value;
};

export const composeRefs =
  (...refs) =>
  (node) =>
    refs.forEach((r) => setRef(r, node));

export const useComposedRefs = (...refs) =>
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useCallback(composeRefs(...refs), refs);
