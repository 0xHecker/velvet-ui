import { createContext, useContext } from "react";

// Internal bridge between the independently composable Sheet and Scroll
// primitives. A Sheet.View with tracks="auto" provides the boundary reporter;
// a nested Scroll.View publishes its native scroll progress into it.
export const SheetScrollHandoffContext = createContext(null);

export const useSheetScrollHandoff = () => useContext(SheetScrollHandoffContext);
