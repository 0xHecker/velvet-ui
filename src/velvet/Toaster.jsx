import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { subscribeToasts, toast } from "./toast.js";
import "./Toaster.css";

const GLYPH = { success: "✓", error: "✕", info: "i", warning: "!" };

function ToastItem({ t, frontIndex, layoutExpanded, paused, expandedOffset, bottom, duration, dirs, closeButton, setHeight, onRemove }) {
  const ref = useRef(null);
  const start = useRef(null);
  const remaining = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [drag, setDrag] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const ttl = t.duration != null ? t.duration : duration;
  const sign = bottom ? 1 : -1;
  const dismissible = t.dismissible !== false;

  useLayoutEffect(() => {
    if (ref.current) setHeight(t.id, ref.current.offsetHeight);
  });
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);

  const close = () => {
    setExiting(true);
    setTimeout(() => onRemove(t.id), 300);
  };

  useEffect(() => { remaining.current = ttl; }, [ttl]);
  useEffect(() => {
    if (exiting || ttl === Infinity || paused || dragging) return;
    const startedAt = Date.now();
    const id = setTimeout(close, remaining.current);
    return () => { clearTimeout(id); remaining.current -= Date.now() - startedAt; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, exiting, dragging, ttl]);

  // Swipe to dismiss along the configured directions; rubber-band the rest.
  const onDown = (e) => {
    if (e.button || !dismissible) return;
    start.current = { x: e.clientX, y: e.clientY, t: Date.now() };
    setDragging(true);
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e) => {
    if (!start.current) return;
    let x = e.clientX - start.current.x;
    let y = e.clientY - start.current.y;
    if (!((x > 0 && dirs.right) || (x < 0 && dirs.left))) x *= 0.18;
    if (!((y > 0 && dirs.down) || (y < 0 && dirs.up))) y *= 0.18;
    setDrag({ x, y });
  };
  const onUp = () => {
    if (!start.current) return;
    const { x, y } = drag;
    const dt = Math.max(1, Date.now() - start.current.t);
    const past = (d, ok) => ok && (Math.abs(d) > 70 || Math.abs(d) / dt > 0.11);
    const fly = past(x, (x > 0 && dirs.right) || (x < 0 && dirs.left));
    const fall = past(y, (y > 0 && dirs.down) || (y < 0 && dirs.up));
    start.current = null;
    setDragging(false);
    if (fly || fall) {
      setDrag({ x: fly ? Math.sign(x) * 460 : 0, y: fall ? Math.sign(y) * 460 : 0 });
      setTimeout(() => onRemove(t.id), 200);
    } else setDrag({ x: 0, y: 0 });
  };

  let baseY = 0, scale = 1, opacity = 1;
  if (layoutExpanded) baseY = -sign * expandedOffset;
  else { baseY = -sign * frontIndex * 14; scale = 1 - Math.min(frontIndex, 3) * 0.05; if (frontIndex >= 3) opacity = 0; }
  let x = 0, y = baseY;
  if (!mounted || exiting) { y += sign * 56; opacity = 0; }
  else { x = drag.x; y += drag.y; if (drag.x || drag.y) opacity = Math.max(0, 1 - Math.hypot(drag.x, drag.y) / 160); }

  return (
    <li
      ref={ref}
      className={`Toast Toast--${t.type}${t.custom ? " Toast--custom" : ""}`}
      data-front={frontIndex === 0}
      data-exiting={exiting || undefined}
      style={{
        transform: `translate3d(${x}px, ${y}px, 0) scale(${scale})`,
        opacity,
        zIndex: 1000 - frontIndex,
        transition: dragging ? "none" : undefined,
        cursor: dismissible ? undefined : "default",
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {t.custom ? (
        typeof t.message === "function" ? t.message(t.id) : t.message
      ) : (
        <>
          <span className="Toast-icon" aria-hidden>
            {t.icon || (t.type === "loading" ? <span className="Toast-spinner" /> : GLYPH[t.type] || "•")}
          </span>
          <div className="Toast-body">
            <div className="Toast-title">{t.message}</div>
            {t.description && <div className="Toast-desc">{t.description}</div>}
          </div>
          {t.action && (
            <button className="Toast-act" onClick={() => { t.action.onClick && t.action.onClick(); close(); }}>
              {t.action.label}
            </button>
          )}
          {closeButton && dismissible && (
            <button className="Toast-x" aria-label="Dismiss" onClick={close}>✕</button>
          )}
        </>
      )}
    </li>
  );
}

export const Toaster = ({
  position = "bottom-right",
  duration = 4000,
  gap = 14,
  stack = true,
  closeButton = true,
  richColors = false,
  swipeDirections,
}) => {
  const [toasts, setToasts] = useState([]);
  const [hovered, setHovered] = useState(false);
  const [hidden, setHidden] = useState(false);
  const heights = useRef({});
  const [, bump] = useState(0);

  useEffect(() => subscribeToasts(setToasts), []);
  useEffect(() => {
    const on = () => setHidden(document.hidden);
    document.addEventListener("visibilitychange", on);
    return () => document.removeEventListener("visibilitychange", on);
  }, []);

  const bottom = position.startsWith("bottom");
  const defaultDirs = [bottom ? "bottom" : "top", position.endsWith("left") ? "left" : "right"];
  const list = swipeDirections || defaultDirs;
  const dirs = { up: list.includes("top"), down: list.includes("bottom"), left: list.includes("left"), right: list.includes("right") };
  const layoutExpanded = !stack || hovered;
  const setHeight = (id, h) => {
    if (heights.current[id] !== h) { heights.current[id] = h; bump((c) => c + 1); }
  };

  const n = toasts.length;
  return (
    <ol
      className={`Toaster Toaster--${position}${richColors ? " Toaster--rich" : ""}`}
      data-expanded={layoutExpanded || undefined}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {toasts.map((t, i) => {
        let off = 0;
        for (let k = i + 1; k < n; k++) off += (heights.current[toasts[k].id] || 56) + gap;
        return (
          <ToastItem
            key={t.id}
            t={t}
            frontIndex={n - 1 - i}
            layoutExpanded={layoutExpanded}
            paused={hovered || hidden}
            expandedOffset={off}
            bottom={bottom}
            duration={duration}
            dirs={dirs}
            closeButton={closeButton}
            setHeight={setHeight}
            onRemove={toast.dismiss}
          />
        );
      })}
    </ol>
  );
};
