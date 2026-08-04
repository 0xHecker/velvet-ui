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

const EXAMPLE_GROUPS = [
  {
    label: "States",
    items: [
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
    ],
  },
  {
    label: "Async and queue",
    items: [
      {
        key: "loading-update",
        label: "Loading → update",
        run: () => {
          const id = toast.loading("Syncing your changes…", { description: "One continuous toast." });
          window.setTimeout(() => {
            toast.update(id, {
              type: "success",
              message: "Changes synced",
              description: "Updated in place with the same id.",
            });
          }, 1600);
        },
      },
      {
        key: "promise",
        label: "Promise",
        run: () =>
          toast.promise(() => new Promise((resolve) => window.setTimeout(resolve, 1800)), {
            loading: { message: "Uploading photo…", description: "Promise pending" },
            success: { message: "Photo uploaded", description: "The original promise resolves normally." },
            error: "Upload failed",
          }),
      },
      {
        key: "queue",
        label: "Fill queue",
        run: () => {
          for (let index = 1; index <= 6; index++) {
            toast(`Queued notification ${index}`, { description: "Change Visible toasts to inspect promotion." });
          }
        },
      },
    ],
  },
  {
    label: "Actions",
    items: [
      {
        key: "action",
        label: "Action",
        run: () =>
          toast("Update available", {
            description: "Tap Reload, or drag from the button without firing it.",
            duration: 10000,
            action: {
              label: "Reload",
              onClick: () => toast.success("Reload requested"),
            },
          }),
      },
      {
        key: "keep-open",
        label: "Action stays open",
        run: () => {
          let id;
          id = toast("Review the generated diff", {
            description: "The action returns false, so this toast stays open.",
            duration: 10000,
            action: {
              label: "Reviewed",
              onClick: () => {
                toast.update(id, { type: "success", message: "Review recorded" });
                return false;
              },
            },
          });
        },
      },
      {
        key: "action-cancel",
        label: "Action + cancel",
        run: () =>
          toast("Remove this draft?", {
            description: "Both controls report a distinct dismissal reason.",
            duration: 10000,
            action: { label: "Keep", onClick: () => toast.success("Draft kept") },
            cancel: { label: "Remove", onClick: () => toast("Draft removed") },
          }),
      },
    ],
  },
  {
    label: "Dismissal and rendering",
    items: [
      {
        key: "direction",
        label: "Right swipe only",
        run: () =>
          toast("This one only dismisses to the right", {
            description: "A per-toast swipeDirections override.",
            duration: 10000,
            swipeDirections: ["right"],
          }),
      },
      {
        key: "persistent",
        label: "Persistent",
        run: () =>
          toast("Waiting for your decision", {
            description: "No timeout. Swipe it or use its close button.",
            duration: Infinity,
            closeButton: true,
          }),
      },
      {
        key: "protected",
        label: "Non-dismissible",
        run: () =>
          toast("Background migration running", {
            description: "Swipe, Escape, and close are disabled; timeout still works.",
            duration: 8000,
            dismissible: false,
          }),
      },
      {
        key: "styled-close",
        label: "Styled close",
        run: () =>
          toast("Consumer-styled close control", {
            description: "Plain CSS through closeButton and closeIcon class hooks.",
            duration: 10000,
            closeButton: true,
            closeButtonPosition: "left",
            classNames: {
              closeButton: "DemoToastClose",
              closeIcon: "DemoToastCloseIcon",
            },
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
                <span>Tap Accept, or begin a swipe on the button.</span>
              </div>
              <button type="button" className="CustomToast-btn" onClick={() => toast.dismiss(id, "accepted")}>
                Accept
              </button>
            </div>
          ), { duration: 10000 }),
      },
      {
        key: "unstyled",
        label: "Unstyled",
        run: () =>
          toast("Consumer-owned surface", {
            description: "Behavior and accessibility remain; the skin is yours.",
            className: "DemoToastUnstyled",
            duration: 10000,
            unstyled: true,
          }),
      },
    ],
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
  const [closeButtonPosition, setCloseButtonPosition] = useState("right");
  const [expand, setExpand] = useState(false);
  const [duration, setDuration] = useState(4000);
  const [visibleToasts, setVisibleToasts] = useState(3);
  const [swipePolicy, setSwipePolicy] = useState("natural");

  const placementDirection = position.endsWith("left")
    ? "left"
    : position.endsWith("right")
      ? "right"
      : position.startsWith("top")
        ? "top"
        : "bottom";
  const swipeDirections = swipePolicy === "natural"
    ? undefined
    : swipePolicy === "off"
      ? []
      : [placementDirection];

  return (
    <section className="Toastpg">
      <div className="Toastpg-head">
        <h1 className="Toastpg-title">A React toast with some momentum</h1>
        <p className="Toastpg-subtitle">
          Zero dependencies, powered by the same physics that powers Velvet UI.
        </p>
        <p className="Toastpg-lead">
          It queues, updates in place, expands on hover or focus, and dismisses with a flick. Try the
          interaction cases below—not only the color variants.
        </p>
      </div>

      <div className="Toastpg-stage">
        <div className="Toastpg-examples">
          {EXAMPLE_GROUPS.map((group) => (
            <section className="Toastpg-exampleGroup" key={group.label}>
              <h2>{group.label}</h2>
              <div className="Toastpg-triggers">
                {group.items.map((item) => (
                  <button type="button" key={item.key} className="Btn" data-toast={item.key} onClick={item.run}>
                    {item.label}
                  </button>
                ))}
              </div>
            </section>
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
                  type="button"
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

          <label className="Field">
            <span className="Field-label">Default duration</span>
            <select className="Toastpg-select" value={duration} onChange={(event) => setDuration(Number(event.target.value))}>
              <option value={2000}>2 seconds</option>
              <option value={4000}>4 seconds</option>
              <option value={8000}>8 seconds</option>
            </select>
          </label>

          <label className="Field">
            <span className="Field-label">Visible toasts</span>
            <select
              className="Toastpg-select"
              value={visibleToasts}
              onChange={(event) => setVisibleToasts(Number(event.target.value))}
            >
              <option value={1}>1 toast</option>
              <option value={3}>3 toasts</option>
              <option value={5}>5 toasts</option>
            </select>
          </label>

          <label className="Field">
            <span className="Field-label">Global swipe</span>
            <select className="Toastpg-select" value={swipePolicy} onChange={(event) => setSwipePolicy(event.target.value)}>
              <option value="natural">Natural axis · both ways</option>
              <option value="edge">Placement edge only</option>
              <option value="off">Disabled</option>
            </select>
          </label>

          <label className="Field">
            <span className="Field-label">Close button side</span>
            <select
              className="Toastpg-select"
              value={closeButtonPosition}
              onChange={(event) => setCloseButtonPosition(event.target.value)}
            >
              <option value="right">Right</option>
              <option value="left">Left</option>
            </select>
          </label>
        </div>

        <p className="Toastpg-hint">
          Hover or focus pauses timers. Press <kbd>⌥ Option</kbd> + <kbd>T</kbd> on Mac
          {" "}(<kbd>Alt</kbd> + <kbd>T</kbd> elsewhere) to focus the front toast, then
          {" "}<kbd>Escape</kbd> to dismiss it. Persistent is timeless; loading remains timeless
          only until it is updated.
        </p>

        <button type="button" className="Btn Toastpg-clear" onClick={() => toast.dismiss()}>
          Clear all
        </button>
      </div>

      <Toaster
        position={position}
        duration={duration}
        visibleToasts={visibleToasts}
        richColors={richColors}
        closeButton={closeButton}
        closeButtonPosition={closeButtonPosition}
        expand={expand}
        swipeDirections={swipeDirections}
      />
    </section>
  );
};
