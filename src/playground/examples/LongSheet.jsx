import { Sheet } from "../../velvet/index.js";
import "./LongSheet.css";

const paragraphs = [
  "Welcome aboard. This sheet rides on the same spring engine as the rest — open it and the content scrolls on the very same surface that carries it in and out.",
  "Scroll down to read on. The panel stays put once it's fully open; only the content moves under it.",
  "When you reach the top and keep pulling down, the sheet hands the motion back to its travel and closes — one continuous gesture, no seams.",
  "Everything here is unstyled by default; the cream palette is applied entirely from the example stylesheet, not the library.",
  "Travel progress, detents, and scroll progress all share one physics model, so motion feels consistent across every surface.",
  "Resize the window and the geometry recomputes — open always rests at one viewport, and the content scrolls beyond it.",
  "The spring is a fixed-timestep integrator: stiffness pulls toward the target, damping bleeds off velocity, and the curve settles on its own.",
  "Because the easing is derived from real physics, programmatic travel and gesture travel feel like the same material.",
  "Backdrops dim in step with travel, so the world behind the panel fades exactly as fast as the panel arrives.",
  "Detents are extra rest stops for opening; closing never stops at them — it just dismisses, like this long sheet.",
  "Triggers are plain buttons. Press one to present, dismiss, step, or scroll — the action is declarative and easy to read.",
  "Keyboard focus moves into the panel on open and returns to the opener on close, so nothing is lost along the way.",
  "Reduced-motion preferences are respected: when set, animations are skipped and the panel simply appears at its destination.",
  "Nothing here depends on a fixed height — give it a little content or a lot, and it adapts.",
  "Pull down from the top whenever you like to send it away.",
  "That's the whole idea — building blocks that behave like the native components you already trust.",
];

export const LongSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Long Sheet</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="LongSheet-view">
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="LongSheet-content">
          <Sheet.BleedingBackground className="LongSheet-bg" />
          <Sheet.Handle className="LongSheet-handle" />
          <Sheet.Title className="LongSheet-title">Field Notes</Sheet.Title>
          {paragraphs.map((p, i) => (
            <p key={i} className="LongSheet-para">{p}</p>
          ))}
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
