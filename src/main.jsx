import React from "react";
import { createRoot } from "react-dom/client";
import "./velvet/styles.css";
import "./playground/playground.css";
import { App } from "./playground/App.jsx";

if (import.meta.env.DEV && typeof window !== "undefined") {
  import("react-grab");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
