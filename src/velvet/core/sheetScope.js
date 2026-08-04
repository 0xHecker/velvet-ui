import { createContext, useContext } from "react";

export const SheetScopeContext = createContext(null);
export const useSheetScope = () => useContext(SheetScopeContext);
