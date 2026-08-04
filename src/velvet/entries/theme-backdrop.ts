import * as React from "react";
import { ThemeBackdrop as themeBackdropRuntime } from "../ThemeBackdrop.jsx";
import type { SheetBackdropProps } from "./sheet.js";

export interface ThemeBackdropProps extends SheetBackdropProps {
  /** `auto` uses black; any CSS color supplies the browser-chrome tint. */
  themeColor?: "auto" | string;
}

export const ThemeBackdrop = themeBackdropRuntime as React.ForwardRefExoticComponent<
  React.PropsWithoutRef<ThemeBackdropProps> &
    React.RefAttributes<HTMLDivElement>
>;
