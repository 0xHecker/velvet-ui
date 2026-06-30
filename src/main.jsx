import React from "react";
import { createRoot } from "react-dom/client";
import "./velvet/velvet.css";
import "./playground/playground.css";
import { App } from "./playground/App.jsx";

if (import.meta.env.DEV) {
  import("react-grab");
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
