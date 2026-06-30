import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { subscribeToasts, toast } from "./toast.js";
import { solveSpring } from "./core/spring.js";
import "./Toaster.css";

const GLYPH = { success: "✓", error: "✕", info: "i", warning: "!" };

// rAF-drive a number from `from` to `to` along the spring curve, writing it every
// frame via onValue — the transform analogue of core/spring.js' springScroll. Because
// the value is committed each frame (not handed to a CSS transition), the swipe
// release/fly can never strand mid-drag waiting on a transition that didn't arm.
function springValue(from, to, settings, { v0 = 0, onValue, onDone } = {}) {
  const finish = () => { onValue && onValue(to); onDone && onDone(); };
  const reduce = typeof matchMedia !== "undefined" && matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (from === to || reduce) { finish(); return { cancel() {} }; }
  const { values, duration } = solveSpring(settings, from, to, v0);
  if (duration === 0) { finish(); return { cancel() {} }; }
  const delta = to - from;
  const timeScale = (typeof window !== "undefined" && window.__VELVET_TIME_SCALE) || 1;
  let raf = 0;
  let cancelled = false;
  const t0 = performance.now();
  const tick = (now) => {
    if (cancelled) return;
    const ms = (now - t0) / timeScale;
    if (ms >= duration) { finish(); return; }
    const idx = Math.max(0, Math.min(values.length - 1, Math.floor(ms)));
    onValue && onValue(from + delta * values[idx]);
    raf = requestAnimationFrame(tick);
  };
  raf = requestAnimationFrame(tick);
  return { cancel() { cancelled = true; cancelAnimationFrame(raf); } };
}

function ToastItem({ t, frontIndex, layoutExpanded, paused, expandedOffset, bottom, duration, dirs, closeButton, setHeight, onRemove }) {
  const ref = useRef(null);
  const start = useRef(null);
  const anim = useRef(null);
  const remaining = useRef(0);
  const [mounted, setMounted] = useState(false);
  const [exiting, setExiting] = useState(false);
  const [dragging, setDragging] = useState(false);
  const ttl = t.duration != null ? t.duration : duration;
  const sign = bottom ? 1 : -1;
  const dismissible = t.dismissible !== false;

  // The gesture is locked to ONE axis — the axis this position dismisses along.
  // Side positions (…-left / …-right) drag horizontally; center positions drag
  // vertically. So a bottom-right toast moves left/right only, never diagonally.
  const axisX = dirs.left || dirs.right;
  const offVar = axisX ? "--vt-dx" : "--vt-dy";
  const allowed = (off) =>
    axisX
      ? (off > 0 && dirs.right) || (off < 0 && dirs.left)
      : (off > 0 && dirs.down) || (off < 0 && dirs.up);

  useLayoutEffect(() => {
    if (ref.current) setHeight(t.id, ref.current.offsetHeight);
  });
  useEffect(() => {
    const r = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(r);
  }, []);
  // Never leave a rAF running against an unmounted node.
  useEffect(() => () => { if (anim.current) anim.current.cancel(); }, []);

  // Drag offset is written straight to the node as a CSS var — there is no React
  // state per pointermove, so no render can land between move and commit (the old
  // race that stranded the toast). The transform reads var(--vt-dx/dy); opacity
  // fades with distance via var(--vt-op).
  const fade = (off) => Math.max(0, 1 - Math.abs(off) / 300);
  const paint = (off) => {
    const el = ref.current;
    if (!el) return;
    el.style.setProperty(offVar, `${off}px`);
    el.style.setProperty("--vt-op", String(fade(off)));
  };
  const clearGesture = () => {
    if (anim.current) { anim.current.cancel(); anim.current = null; }
    start.current = null;
    const el = ref.current;
    if (el) {
      el.style.transition = ""; // hand transform/opacity back to the CSS transition
      el.style.removeProperty("--vt-dx");
      el.style.removeProperty("--vt-dy");
      el.style.removeProperty("--vt-op");
    }
  };

  const close = () => {
    clearGesture();
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

  // --- Swipe to dismiss: single-axis, ref-driven, spring release ---
  const onDown = (e) => {
    if (e.button || !dismissible) return;
    // Let clicks on buttons/links inside the toast work without starting a drag.
    if (e.target.closest("button, a, input, textarea, select, [role='button']")) return;
    const el = ref.current;
    if (!el) return;
    if (anim.current) { anim.current.cancel(); anim.current = null; } // re-grab mid-fling
    const p = axisX ? e.clientX : e.clientY;
    const now = Date.now();
    start.current = { p0: p, off: 0, v: 0, lastP: p, lastT: now };
    el.style.transition = "none"; // track the pointer 1:1 while dragging
    setDragging(true); // pause the auto-dismiss timer
    try { el.setPointerCapture(e.pointerId); } catch {}
  };
  const onMove = (e) => {
    const s = start.current;
    if (!s) return; // a stray move after release is ignored — no stuck follow
    const p = axisX ? e.clientX : e.clientY;
    const raw = p - s.p0;
    // Free toward a dismiss direction; elastically resist (and spring back) the wrong way.
    const off = allowed(raw) ? raw : (raw * 0.55) / (1 + Math.abs(raw) / 120);
    const now = Date.now();
    if (now > s.lastT) { s.v = (p - s.lastP) / (now - s.lastT); s.lastP = p; s.lastT = now; }
    s.off = off;
    paint(off);
  };
  const release = () => {
    const s = start.current;
    if (!s) return;
    start.current = null;
    setDragging(false);
    const off = s.off;
    const fly = allowed(off) && (Math.abs(off) > 70 || Math.abs(s.v) > 0.45);
    if (fly) {
      const span = (typeof window !== "undefined" && (axisX ? window.innerWidth : window.innerHeight)) || 600;
      anim.current = springValue(off, Math.sign(off) * (span + 80), "snappy", {
        v0: Math.abs(s.v),
        onValue: paint,
        onDone: () => { anim.current = null; onRemove(t.id); },
      });
    } else {
      anim.current = springValue(off, 0, "smooth", {
        onValue: paint,
        onDone: () => { anim.current = null; clearGesture(); },
      });
    }
  };
  // pointercancel / lostpointercapture: the gesture was taken from us (the classic
  // "stuck" trigger). Spring back to rest instead of stranding at the last offset.
  const cancel = () => {
    const s = start.current;
    if (!s) return;
    start.current = null;
    setDragging(false);
    anim.current = springValue(s.off, 0, "smooth", {
      onValue: paint,
      onDone: () => { anim.current = null; clearGesture(); },
    });
  };

  let baseY = 0, scale = 1, opacity = 1;
  if (layoutExpanded) baseY = -sign * expandedOffset;
  else { baseY = -sign * frontIndex * 14; scale = 1 - Math.min(frontIndex, 3) * 0.05; if (frontIndex >= 3) opacity = 0; }
  let y = baseY;
  if (!mounted || exiting) { y += sign * 56; opacity = 0; }

  return (
    <li
      ref={ref}
      className={`Toast Toast--${t.type}${t.custom ? " Toast--custom" : ""}`}
      data-front={frontIndex === 0}
      data-exiting={exiting || undefined}
      style={{
        transform: `translate3d(var(--vt-dx, 0px), calc(${y}px + var(--vt-dy, 0px)), 0) scale(${scale})`,
        opacity: `calc(${opacity} * var(--vt-op, 1))`,
        zIndex: 1000 - frontIndex,
        cursor: dismissible ? undefined : "default",
        touchAction: dismissible ? (axisX ? "pan-y" : "pan-x") : undefined,
      }}
      onPointerDown={onDown}
      onPointerMove={onMove}
      onPointerUp={release}
      onPointerCancel={cancel}
      onLostPointerCapture={cancel}
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
  // Side positions dismiss horizontally toward that edge; center positions
  // dismiss vertically toward that edge. This keeps a bottom-right toast from
  // being dismissed by a vertical swipe or a leftward swipe.
  const horizontalEdge = position.endsWith("left")
    ? "left"
    : position.endsWith("right")
      ? "right"
      : null;
  const verticalEdge = position.endsWith("center") ? (bottom ? "bottom" : "top") : null;
  const defaultDirs = [horizontalEdge || verticalEdge].filter(Boolean);
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
