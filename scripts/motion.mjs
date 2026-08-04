import {
  animate,
  prefersReducedMotion,
  resolveMotionTiming,
  resolveTravelStyles,
  sampleSpring,
  springEasing,
} from "../dist/motion.js";

const failures = [];
const check = (name, condition, detail = "") => {
  console.log(`${condition ? "PASS" : "FAIL"}  ${name}${detail ? `  ${detail}` : ""}`);
  if (!condition) failures.push(name);
};

const equal = sampleSpring("smooth", { from: 4, to: 4 });
check(
  "equal spring endpoints settle without division by zero",
  equal.duration === 0 && equal.values.length === 1 && equal.values[0] === 1,
  JSON.stringify(equal),
);

const hostile = sampleSpring(
  {
    stiffness: Number.POSITIVE_INFINITY,
    damping: -10,
    mass: 0,
    precision: Number.NaN,
    initialVelocity: Number.POSITIVE_INFINITY,
  },
  { from: Number.NaN, to: Number.POSITIVE_INFINITY },
);
check(
  "malformed spring settings remain finite and bounded",
  hostile.duration <= 10_000 && hostile.values.every(Number.isFinite),
  `duration=${hostile.duration}`,
);

const timing = springEasing({ stiffness: 380, damping: 32, mass: 0.9 });
check(
  "custom physical values produce valid sampled timing",
  timing.duration > 0 &&
    timing.duration <= 10_000 &&
    (timing.easing === "linear" || timing.easing.startsWith("linear(")),
  JSON.stringify(timing),
);
const cssTiming = resolveMotionTiming({ easing: "ease-out" });
check(
  "a CSS easing without duration receives a safe timing default",
  cssTiming.duration === 300 && cssTiming.easing === "ease-out",
  JSON.stringify(cssTiming),
);

const previousWindow = globalThis.window;
globalThis.window = {
  matchMedia: () => ({ matches: true }),
};
check("reduced motion is read at call time", prefersReducedMotion());

const skippedStyles = {};
let animateCalls = 0;
const reducedElement = {
  style: {
    setProperty(property, value) {
      skippedStyles[property] = value;
    },
  },
  animate() {
    animateCalls += 1;
  },
};
const skipped = animate(
  reducedElement,
  [{ opacity: 0 }, { opacity: 1, "--motion-progress": 1 }],
);
check(
  "reduced motion settles the final frame without starting WAAPI",
  animateCalls === 0 &&
    reducedElement.style.opacity === "1" &&
    skippedStyles["--motion-progress"] === "1" &&
    (await skipped.finished) === "skipped",
);
globalThis.window = previousWindow;

class FakeAnimation extends EventTarget {
  constructor() {
    super();
    this.id = "";
  }
  cancel() {
    this.dispatchEvent(new Event("cancel"));
  }
  finish() {
    this.dispatchEvent(new Event("finish"));
  }
  pause() {}
  play() {}
  reverse() {}
}

const activeAnimations = [];
const element = {
  style: {
    setProperty(property, value) {
      this[property] = value;
    },
  },
  getAnimations: () => activeAnimations,
  animate() {
    const animation = new FakeAnimation();
    activeAnimations.push(animation);
    return animation;
  },
};
const first = animate(element, { opacity: [0, 1] }, { id: "panel", skip: false });
const second = animate(element, { opacity: [1, 0] }, { id: "panel", skip: false });
check(
  "a matching element/id interrupts only the previous Velvet playback",
  (await first.finished) === "cancelled" && second.animation !== null,
);
second.finish();
check(
  "finished resolves and commits the final property",
  (await second.finished) === "finished" && element.style.opacity === "0",
);

let travelErrors = 0;
const travel = resolveTravelStyles(
  {
    opacity: [0, 1],
    scale: ({ progress }) => 0.9 + progress * 0.1,
    broken: () => {
      throw new Error("authored failure");
    },
    constructor: "ignored",
  },
  Number.NaN,
  { onError: () => travelErrors++ },
);
check(
  "travel maps isolate invalid progress, callbacks, and unsafe keys",
  travel.opacity.includes("* 0") &&
    travel.transform === "scale(0.9)" &&
    travel.broken === undefined &&
    !Object.hasOwn(travel, "constructor") &&
    travelErrors === 1,
  JSON.stringify(travel),
);

if (failures.length) {
  console.error(`\n${failures.length} failure(s): ${failures.join(", ")}`);
  process.exit(1);
}
