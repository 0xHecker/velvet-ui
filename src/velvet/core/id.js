import { createContext } from "react";

// A "component id" is just a dedicated React context object. Passing it to a
// sub-component's `forComponent` prop lets it target a specific instance.
export const createComponentId = () => createContext(null);
