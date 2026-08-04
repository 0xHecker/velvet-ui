import * as React from "react";
import { SheetMorph as sheetMorphRuntime } from "../SheetMorph.jsx";
import type {
  PrimitiveProps,
  SheetContentProps,
} from "./sheet.js";
import type { TravelAnimation } from "./motion.js";

export interface SheetMorphContentProps extends SheetContentProps {
  from?: "trigger" | React.RefObject<Element | null> | Element | false | null;
  stackingAnimation?: TravelAnimation;
}

type SheetMorphDivPart<P = PrimitiveProps<HTMLDivElement>> =
  React.ForwardRefExoticComponent<
    React.PropsWithoutRef<P> & React.RefAttributes<HTMLDivElement>
  >;

export const SheetMorph = sheetMorphRuntime as {
  Content: SheetMorphDivPart<SheetMorphContentProps>;
};
