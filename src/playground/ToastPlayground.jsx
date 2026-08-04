import { useState } from "react";
import { Toaster, toast } from "../velvet/index.js";
import "./ToastPlayground.css";

const POSITIONS = [
  "top-left",
  "top-center",
  "top-right",
  "bottom-left",
  "bottom-center",
  "bottom-right",
];

const TRIGGERS = [
  {
    key: "default",
    label: "Default",
    run: () => toast("Event has been created", { description: "Monday, January 3rd at 6:00 PM." }),
  },
  {
    key: "success",
    label: "Success",
    run: () => toast.success("Saved to your library", { description: "Synced across your devices." }),
  },
  {
    key: "error",
    label: "Error",
    run: () => toast.error("Couldn’t save changes", { description: "Check your connection and try again." }),
  },
  {
    key: "info",
    label: "Info",
    run: () => toast.info("Update available", { description: "A new version is ready to install." }),
  },
  {
    key: "warning",
    label: "Warning",
    run: () => toast.warning("Storage almost full", { description: "Only 1.2 GB remaining on this device." }),
  },
  {
    key: "loading",
    label: "Loading",
    run: () => toast.loading("Syncing your changes…"),
  },
  {
    key: "action",
    label: "Action",
    run: () =>
      toast("Update available", {
        description: "Velvet UI 0.2 is ready.",
        duration: 8000,
        action: { label: "Reload" },
      }),
  },
  {
    key: "promise",
    label: "Promise",
    run: () =>
      toast.promise(() => new Promise((res) => setTimeout(res, 1800)), {
        loading: "Uploading photo…",
        success: "Photo uploaded",
        error: "Upload failed",
      }),
  },
  {
    key: "custom",
    label: "Custom JSX",
    run: () =>
      toast.custom((id) => (
        <div className="CustomToast">
          <span className="CustomToast-avatar" aria-hidden>
            V
          </span>
          <div className="CustomToast-body">
            <strong>Velvet UI</strong>
            <span>invited you to collaborate.</span>
          </div>
          <button className="CustomToast-btn" onClick={() => toast.dismiss(id)}>
            Accept
          </button>
        </div>
      )),
  },
];

const Toggle = ({ label, checked, onChange }) => (
  <label className="Toggle">
    <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    <span className="Toggle-track">
      <span className="Toggle-thumb" />
    </span>
    <span className="Toggle-text">{label}</span>
  </label>
);

export const ToastPlayground = () => {
  const [position, setPosition] = useState("bottom-right");
  const [richColors, setRichColors] = useState(false);
  const [closeButton, setCloseButton] = useState(false);
  const [expand, setExpand] = useState(false);

  return (
    <section className="Toastpg">
      <div className="Toastpg-head">
        <h1 className="Toastpg-title">A React toast with some momentum</h1>
        <p className="Toastpg-subtitle">
          Zero dependencies, powered by the same physics that powers Velvet UI.
        </p>
        <p className="Toastpg-lead">
          It stacks, expands on hover, and dismisses with a flick. Render one <code>&lt;Toaster /&gt;</code>,
          then call <code>toast()</code> from anywhere. Fire a few and hover the stack.
        </p>
      </div>

      <div className="Toastpg-stage">
        <div className="Toastpg-triggers">
          {TRIGGERS.map((t) => (
            <button key={t.key} className="Btn" data-toast={t.key} onClick={t.run}>
              {t.label}
            </button>
          ))}
        </div>

        <div className="Toastpg-panel">
          <div className="Field">
            <span className="Field-label">Position</span>
            <div className="PosGrid" role="group" aria-label="Toaster position">
              {POSITIONS.map((p) => (
                <button
                  key={p}
                  className="PosGrid-cell"
                  data-active={position === p}
                  aria-pressed={position === p}
                  aria-label={p.replace("-", " ")}
                  onClick={() => setPosition(p)}
                >
                  <span className="PosGrid-dot" data-pos={p} />
                </button>
              ))}
            </div>
          </div>

          <div className="Field">
            <span className="Field-label">Options</span>
            <div className="Toggles">
              <Toggle label="Rich colors" checked={richColors} onChange={setRichColors} />
              <Toggle label="Close button" checked={closeButton} onChange={setCloseButton} />
              <Toggle label="Expand by default" checked={expand} onChange={setExpand} />
            </div>
          </div>
        </div>

        <button className="Btn Toastpg-clear" onClick={() => toast.dismiss()}>
          Clear all
        </button>
      </div>

      <Toaster position={position} richColors={richColors} closeButton={closeButton} stack={!expand} />
    </section>
  );
};
