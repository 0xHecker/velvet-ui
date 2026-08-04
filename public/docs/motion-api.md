# Motion API

> Use Velvet's interruptible springs, WAAPI orchestration, travel interpolation, reduced-motion handling, and React lifecycle hooks anywhere.

Web: https://velvetui.co/docs/motion-api

Velvet's motion engine is a framework-free public module. Use the same sampled springs, interruption policy, reduced-motion settlement, and progress interpolation outside Sheet without importing React or any component runtime.

## Choose the smallest entry

```tsx
// Any JavaScript or framework
import {
  animate,
  springEasing,
  resolveTravelStyles,
} from "@velvetui/react/motion";

// React lifecycle helpers only
import {
  useAnimate,
  useReducedMotion,
  useSpringEasing,
} from "@velvetui/react/motion/react";
```

`@velvetui/react/motion` has no React dependency. `@velvetui/react/motion/react` adds only the hooks and their lifecycle ownership. Neither entry imports Sheet, Scroll, Toast, or a stylesheet.

## Animate any element

```tsx
import { animate } from "@velvetui/react/motion";

const playback = animate(card, {
  transform: ["translateY(16px) scale(.98)", "translateY(0) scale(1)"],
  opacity: [0, 1],
}, {
  id: "card-enter",
  preset: "snappy",
  commit: true,
});

const status = await playback.finished;
// "finished" | "cancelled" | "skipped"
```

`id` is local to one element. Starting another Velvet animation with the same element and id cancels the old playback; unrelated browser or library animations are untouched. Pass `id: false` only when concurrent effects are intentional.

`finished` never rejects during normal cancellation. By default the final keyframe is committed to inline styles and the completed WAAPI animation is released. Set `commit: false` when another owner must retain final-style control.

## Public functions

| Export | Contract |
| --- | --- |
| `animate(element, keyframes, options)` | Interruptible, reduced-motion-safe WAAPI playback |
| `sampleSpring(settings, { from, to, v0 })` | Finite normalized spring samples and settle duration |
| `springEasing(settings, sampleOptions)` | CSS `linear()` easing and duration |
| `resolveMotionTiming(settings)` | Normalized duration and easing |
| `prefersReducedMotion(target?)` | Current preference for an Element, Document, Window, or global window |
| `resolveTravelStyles(map, progress, context?)` | Resolve a progress map without touching the DOM |
| `applyTravelStyles(element, map, progress, context?)` | Resolve and apply the same map |
| `linearEasingFromSamples(values)` | Safe CSS easing serialization |
| `decimateSpring(values, amount?)` | Reduce a sampled curve for CSS or WAAPI |

## SpringSettings

| Field | Type | Default or behavior |
| --- | --- | --- |
| `preset` | gentle, smooth, snappy, brisk, bouncy, elastic | overrides conflicting physical fields |
| `easing` | spring, ease, ease-in, ease-out, ease-in-out, linear | `spring` |
| `stiffness` | number | `300` without component fallback |
| `damping` | number | `34` without component fallback |
| `mass` | number | `1` |
| `precision` | number | `0.1` |
| `initialVelocity` | number | `0` |
| `duration` | milliseconds | timing-easing override |
| `delay` | milliseconds | `0` |
| `skip` | boolean, `auto`, or `never` | follows reduced motion |

Physics are normalized to finite operating ranges. A zero mass, infinite stiffness, NaN endpoint, or equal endpoints cannot create an endless loop or non-finite keyframe list. Unknown settings fall back to a smooth spring.

## Preset values

| Preset | Stiffness | Damping | Mass | Character |
| --- | ---: | ---: | ---: | --- |
| gentle | 560 | 68 | 1.85 | deliberate and heavy |
| smooth | 580 | 60 | 1.35 | default opening |
| snappy | 350 | 34 | 0.9 | compact controls |
| brisk | 350 | 28 | 0.65 | fast state change |
| bouncy | 240 | 19 | 0.7 | visible overshoot |
| elastic | 260 | 20 | 1 | softer rebound |

```tsx
const timing = springEasing("smooth");
const samples = sampleSpring(
  { stiffness: 520, damping: 44, mass: 1 },
  { from: 0, to: 240, v0: 0.4 },
);
```

A recognized preset wins over physical values in the same object. Use either a preset or custom physics, not both.

## TravelAnimation

`travelAnimation` and `stackingAnimation` accept a property map or `{ properties: map }`. Each value may be a literal, `[from, to]`, a callback, `false`, or `null`.

| Value | Meaning |
| --- | --- |
| `[0, 1]` | interpolate with CSS `calc()` |
| `["24px", "0px"]` | interpolate compatible CSS values |
| `({ progress }) => value` | compute any property |
| `({ tween }) => tween(from, to)` | generate interpolation explicitly |
| literal | keep the property fixed through travel |
| `false`, `null`, `"ignore"` | leave the property untouched |

```tsx
<Sheet.Backdrop travelAnimation={{ opacity: [0, 0.42] }} />
<Sheet.Content travelAnimation={{
  translateY: ["28px", "0px"],
  scale: [0.97, 1],
  borderRadius: ({ progress }) => `${32 - progress * 8}px`,
}} />
```

```tsx
const styles = resolveTravelStyles({
  opacity: [0, 1],
  translateY: ["12px", "0px"],
  "--scrim-strength": [0, 0.42],
}, progress);

Object.assign(node.style, styles);
```

Non-finite progress becomes zero. Invalid entries, unsafe object keys, and a property callback that throws are isolated instead of corrupting the rest of the map. Supply `onError(error, detail)` in the context when the application needs reporting.

## Transform composition

The transform aliases are `translate`, `translateX/Y/Z`, `scale/X/Y/Z`, `rotate/X/Y/Z`, and `skew/X/Y`. Velvet combines them into one transform in declaration order. A literal `transform` can also participate, but product CSS should not animate the same transform property at the same time.

## React hooks

```tsx
function SaveButton() {
  const animate = useAnimate();
  const reduceMotion = useReducedMotion();

  return (
    <button onClick={(event) => {
      animate(event.currentTarget, {
        transform: ["scale(.96)", "scale(1)"],
      }, {
        id: "press",
        preset: "snappy",
        skip: reduceMotion,
      });
    }}>
      Save
    </button>
  );
}
```

`useAnimate` cancels every playback it owns when the component unmounts. `useReducedMotion` is hydration-safe and remains subscribed when the operating-system setting changes. `useSpringEasing` memoizes a CSS easing for render-time integration; pass a stable custom settings object.

## Sheet integration

```tsx
<Sheet.View
  enteringAnimationSettings="smooth"
  steppingAnimationSettings="snappy"
  exitingAnimationSettings={{ stiffness: 520, damping: 44, mass: 1 }}
/>
```

| Callback | Use |
| --- | --- |
| `onTravel({ progress, range, progressAtDetents })` | synchronize product UI |
| `onTravelStart()` | start expensive visual work |
| `onTravelEnd()` | settle derived state |
| `onTravelStatusChange(status)` | observe idleOutside, entering, idleInside, stepping, exiting |

Avoid writing `progress` to React state on every frame. Update an imperative ref, CSS variable, canvas, or external animation when continuous rendering is required.

## Reduced motion

All spring entry points read `prefers-reduced-motion` when motion starts, not when the module loads. `skip="auto"` follows the current media query, `skip={true}` forces immediate settlement, and `skip="never"` deliberately opts out for motion that conveys essential state.

Skipped motion still applies the final keyframe and resolves its playback as `skipped`; a missing element or unavailable WAAPI follows the same safe path. Keep the final keyframe complete enough to represent the settled UI.
