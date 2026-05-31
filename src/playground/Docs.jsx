import { useEffect, useState } from "react";
import "./Docs.css";

/* ----------------------------------------------------------------- snippets */

const installCode = `npm install velvet-ui
# or
pnpm add velvet-ui
# or
yarn add velvet-ui`;

const quickStartCode = `import { Sheet } from "velvet-ui";
import "velvet-ui/velvet.css";

export function Example() {
  return (
    <Sheet.Root>
      <Sheet.Trigger className="btn">Open</Sheet.Trigger>

      <Sheet.Portal>
        <Sheet.View className="view">
          <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />

          <Sheet.Content className="panel">
            <Sheet.Handle />
            <Sheet.Title>A native-like sheet</Sheet.Title>
            <Sheet.Description>
              Swipe it down, flick it, or tap outside to close.
            </Sheet.Description>
            <Sheet.Trigger action="dismiss" className="btn">Got it</Sheet.Trigger>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}`;

const controlledCode = `const [open, setOpen] = useState(false);

<Sheet.Root presented={open} onPresentedChange={setOpen}>
  {/* ... */}
</Sheet.Root>

// Open or close it from anywhere in your app.
<button onClick={() => setOpen(true)}>Open from outside</button>`;

const placementCode = `// The edge the sheet travels from.
<Sheet.View contentPlacement="bottom" />   {/* default */}
<Sheet.View contentPlacement="top" />
<Sheet.View contentPlacement="left" />
<Sheet.View contentPlacement="right" />
<Sheet.View contentPlacement="center" />   {/* modals, lightboxes */}`;

const detentsCode = `// One rest stop at 60% of the large viewport height.
<Sheet.Root defaultActiveDetent={1}>
  <Sheet.View detents="60lvh">{/* ... */}</Sheet.View>
</Sheet.Root>

// Several stops. The index is 1-based:
//   0 = closed, 1 = "40lvh", 2 = "80lvh", 3 = fully open.
<Sheet.Root defaultActiveDetent={1}>
  <Sheet.View detents={["40lvh", "80lvh"]}>{/* ... */}</Sheet.View>
</Sheet.Root>

// Move between detents with a Trigger.
<Sheet.Trigger action={{ type: "step", direction: "up" }}>Expand</Sheet.Trigger>
<Sheet.Trigger action={{ type: "step", direction: "down" }}>Collapse</Sheet.Trigger>
<Sheet.Trigger action={{ type: "step", detent: 2 }}>Go to stop 2</Sheet.Trigger>`;

const persistentCode = `// A persistent mini-player: a swipe down collapses it to the
// mini detent instead of dismissing. Only an explicit action closes it.
<Sheet.Root defaultActiveDetent={1}>
  <Sheet.View
    detents="94px"
    swipeDismissal={false}   // a downward swipe collapses, never dismisses
    inertOutside={false}     // non-modal: the page stays interactive
    onEscapeKeyDown={{ dismiss: false }}
  >
    <Sheet.Content>
      {/* mini bar + expanded body */}
      <Sheet.Trigger action={{ type: "step", direction: "up" }}>Expand</Sheet.Trigger>
      <Sheet.Trigger action="dismiss">Close</Sheet.Trigger>
    </Sheet.Content>
  </Sheet.View>
</Sheet.Root>`;

const dismissalCode = `<Sheet.View
  swipe={true}             // enable drag and swipe gestures (default)
  swipeDismissal={true}    // a swipe toward closed can dismiss (default)
  inertOutside={true}      // modal: lock the page and treat outside as inert (default)

  // Keep a click on the backdrop from closing the sheet.
  onClickOutside={{ dismiss: false }}

  // Or decide per event.
  onEscapeKeyDown={({ changeDefault, nativeEvent }) => {
    if (hasUnsavedChanges) changeDefault({ dismiss: false });
  }}
/>

// alertdialog ignores outside-click and Escape dismissal by default.
<Sheet.Root sheetRole="alertdialog">{/* ... */}</Sheet.Root>`;

const travelCode = `// Each property is [from, to], a function of progress, or a literal.
// progress runs 0 (closed) to 1 (open).

<Sheet.Backdrop travelAnimation={{ opacity: [0, 0.4] }} />

<Sheet.Content
  travelAnimation={{
    // Lift and fade the panel in as it arrives.
    transform: ({ tween }) => \`translateY(\${tween(24, 0)}px)\`,
    opacity: ({ progress }) => Math.min(progress * 2, 1),
  }}
/>

// Animate any element outside the panel from the same travel.
<Sheet.Outlet travelAnimation={{ transform: ({ tween }) => \`scale(\${tween(1, 0.94)})\` }}>
  <YourPageBehindTheSheet />
</Sheet.Outlet>`;

const springCode = `// Presets: gentle · smooth (default) · snappy · brisk · bouncy · elastic
<Sheet.View
  enteringAnimationSettings="snappy"
  exitingAnimationSettings="brisk"
/>

// Override a preset.
<Sheet.View enteringAnimationSettings={{ preset: "snappy", stiffness: 420 }} />

// Or define the spring outright.
<Sheet.View
  enteringAnimationSettings={{ stiffness: 380, damping: 32, mass: 0.9 }}
/>`;

const triggerCode = `<Sheet.Trigger>Open</Sheet.Trigger>                  {/* action="present" (default) */}
<Sheet.Trigger action="dismiss">Close</Sheet.Trigger>
<Sheet.Trigger action={{ type: "step", direction: "up" }}>Expand</Sheet.Trigger>

// asChild lets you keep your own element and styles.
<Sheet.Trigger asChild>
  <MyButton>Open</MyButton>
</Sheet.Trigger>

// Run code before the action fires.
<Sheet.Trigger onPress={() => track("open_sheet")}>Open</Sheet.Trigger>`;

const a11yCode = `<Sheet.Content>
  {/* Title and Description wire aria-labelledby / aria-describedby. */}
  <Sheet.Title>Delete project</Sheet.Title>
  <Sheet.Description>This cannot be undone.</Sheet.Description>

  {/* Focus the element you choose on open, not the first focusable. */}
  <input />
  <AutoFocusTarget asChild>
    <button>Confirm</button>
  </AutoFocusTarget>
</Sheet.Content>

// Need a label with no visible text?
<VisuallyHidden>Close dialog</VisuallyHidden>`;

const toastQuickStartCode = `import { Toaster, toast } from "velvet-ui";

// 1. Render one Toaster near the root of your app.
export function App() {
  return (
    <>
      <YourRoutes />
      <Toaster position="bottom-right" />
    </>
  );
}

// 2. Call toast() from anywhere.
toast.success("Saved to your library", {
  description: "Synced across your devices.",
});`;

const toastVariantsCode = `toast("A plain message");
toast.success("Profile updated");
toast.error("Could not connect");
toast.info("A new version is available");
toast.warning("Your trial ends tomorrow");
toast.message("Neutral, same as toast()");

// A spinner that stays until you resolve it (duration: Infinity).
const id = toast.loading("Uploading…");
toast.success("Uploaded", { id }); // reuse the id to update in place

// Render anything you like.
toast.custom((id) => (
  <div className="my-toast">
    Custom content <button onClick={() => toast.dismiss(id)}>Close</button>
  </div>
));`;

const toastOptionsCode = `toast("Message moved to Archive", {
  description: "You can restore it within 30 days.",
  duration: 6000,              // ms, or Infinity to persist
  icon: "📥",
  action: {
    label: "Undo",
    onClick: () => restore(),
  },
  dismissible: true,           // allow swipe and close button
});

// Dismiss a specific toast, or all of them.
toast.dismiss(id);
toast.dismiss();`;

const toastPromiseCode = `toast.promise(saveSettings(), {
  loading: "Saving…",
  success: "Settings saved",
  error: "Could not save",
});

// success and error can read the resolved or rejected value.
toast.promise(uploadFile(file), {
  loading: "Uploading…",
  success: (res) => \`Uploaded \${res.name}\`,
  error: (err) => err.message,
});`;

const scrollCode = `import { Scroll } from "velvet-ui";
import { useRef } from "react";

const ref = useRef(null);

<Scroll.Root componentRef={ref}>
  <Scroll.View className="scroller" onScrollProgress={({ progress }) => setBar(progress)}>
    <Scroll.Content>{/* long content */}</Scroll.Content>
  </Scroll.View>

  {/* Triggers drive the imperative API. */}
  <Scroll.Trigger action={{ type: "scroll-to", progress: 0 }}>Top</Scroll.Trigger>
  <Scroll.Trigger action={{ type: "scroll-by", distance: 240 }}>Down a bit</Scroll.Trigger>
</Scroll.Root>

// Or call it yourself.
ref.current.scrollTo({ progress: 1, animationSettings: "smooth" });`;

const stackCode = `import { Sheet, SheetStack } from "velvet-ui";

<SheetStack.Root>
  {/* A backing layer that recedes as the top sheet rises. */}
  <SheetStack.Outlet stackingAnimation={{ transform: ({ tween }) => \`scale(\${tween(1, 0.92)})\` }}>
    <YourPage />
  </SheetStack.Outlet>

  <Sheet.Root>{/* first sheet */}</Sheet.Root>
  <Sheet.Root>{/* a sheet opened on top of the first */}</Sheet.Root>
</SheetStack.Root>`;

/* -------------------------------------------------------------- prop tables */

const rootProps = [
  ["presented", "boolean", "", "Controlled open state. Pair with onPresentedChange."],
  ["defaultPresented", "boolean", "false", "Uncontrolled initial open state."],
  ["onPresentedChange", "(presented) => void", "", "Called when the sheet opens or closes."],
  ["defaultActiveDetent", "number", "", "Detent index to open at. 1-based, see Detents."],
  ["activeDetent", "number", "", "Controlled detent index."],
  ["onActiveDetentChange", "(index) => void", "", "Called when the active detent changes."],
  ["sheetRole", '"dialog" | "alertdialog"', '"dialog"', "ARIA role. alertdialog keeps outside-click and Escape from dismissing by default."],
  ["license", "string", "", "Accepted for API parity. No runtime effect."],
];

const viewProps = [
  ["contentPlacement", '"bottom" | "top" | "left" | "right" | "center"', '"bottom"', "Edge the sheet travels from."],
  ["detents", "string | string[]", "", "Intermediate rest stops as CSS lengths, e.g. \"60lvh\"."],
  ["swipe", "boolean", "true", "Enable drag and swipe gestures."],
  ["swipeDismissal", "boolean", "true", "Whether a swipe toward closed can dismiss. false makes the sheet persistent."],
  ["inertOutside", "boolean", "true", "Modal by default: locks page scroll and treats the outside as inert. false keeps the page interactive."],
  ["enteringAnimationSettings", "Spring", '"smooth"', "Spring used when opening."],
  ["exitingAnimationSettings", "Spring", '"smooth"', "Spring used when closing."],
  ["onTravel", "({ progress }) => void", "", "Fires as travel progress changes."],
  ["onTravelStart", "() => void", "", "Fires when travel begins."],
  ["onTravelEnd", "() => void", "", "Fires when travel settles."],
  ["onClickOutside", "{ dismiss } | (info) => void", "", "Behavior when the area outside the panel is clicked."],
  ["onEscapeKeyDown", "{ dismiss } | (info) => void", "", "Behavior when Escape is pressed."],
  ["nativeEdgeSwipePrevention", "boolean", "", "Stops the browser edge swipe from hijacking a horizontal drag."],
];

const backdropProps = [
  ["travelAnimation", "TravelMap", "", "Animate the backdrop from travel progress, usually opacity."],
  ["themeColorDimming", '"auto" | string', "", "Dim the browser theme-color in step with travel."],
  ["swipeable", "boolean", "true", "Whether swiping on the backdrop drives the sheet."],
];

const contentProps = [
  ["travelAnimation", "TravelMap", "", "Animate the panel from travel progress."],
  ["stackingAnimation", "TravelMap", "", "Animate the panel from stacking progress when it sits under another sheet."],
];

const triggerProps = [
  ["action", '"present" | "dismiss" | "step" | StepSpec', '"present"', "What pressing the trigger does. StepSpec = { type: \"step\", direction?, detent? }."],
  ["onPress", "(event) => void", "", "Called before the action runs."],
  ["asChild", "boolean", "false", "Render your own element instead of a button."],
];

const toasterProps = [
  ["position", '"top-left" | "top-center" | "top-right" | "bottom-left" | "bottom-center" | "bottom-right"', '"bottom-right"', "Where the stack sits."],
  ["duration", "number", "4000", "Default visible time in ms. A per-toast duration wins."],
  ["gap", "number", "14", "Pixels between toasts when the stack is expanded."],
  ["stack", "boolean", "true", "Collapse into a stack and expand on hover. false keeps a list."],
  ["closeButton", "boolean", "true", "Show a close button on dismissable toasts."],
  ["richColors", "boolean", "false", "Tint toasts by variant."],
  ["swipeDirections", '("top" | "bottom" | "left" | "right")[]', "from position", "Directions a toast can be flicked away."],
];

const toastMethods = [
  ["toast(message, options?)", "Show a default toast. Returns the toast id."],
  ["toast.success / error / info / warning / message", "Variant toasts with the same signature."],
  ["toast.loading(message, options?)", "A spinner toast with duration set to Infinity."],
  ["toast.custom(content, options?)", "Render arbitrary content. content may be (id) => ReactNode."],
  ["toast.promise(promise, { loading, success, error })", "Track a promise. success and error may be functions of the value."],
  ["toast.dismiss(id?)", "Dismiss one toast, or all of them when id is omitted."],
];

const toastOpts = [
  ["id", "string | number", "", "Reuse an id to update an existing toast in place."],
  ["description", "ReactNode", "", "Secondary line under the message."],
  ["duration", "number", "Toaster default", "ms before auto-dismiss. Infinity to persist."],
  ["action", "{ label, onClick }", "", "A button rendered inside the toast."],
  ["icon", "ReactNode", "", "Override the leading glyph."],
  ["dismissible", "boolean", "true", "Whether it can be swiped away or closed."],
];

const scrollProps = [
  ["Scroll.Root", "Exposes an imperative API through componentRef: getProgress, getDistance, getAvailableDistance, scrollTo, and scrollBy."],
  ["Scroll.View", 'The scroll container. Props: axis ("y" or "x"), scrollGestureTrap, scrollGestureOvershoot, and onScrollProgress.'],
  ["Scroll.Content", "The travelling content inside the view."],
  ["Scroll.Trigger", "Runs scroll-to or scroll-by on press, with a distance or progress and optional animationSettings."],
];

const utilityExports = [
  ["Fixed", "An element that stays put while a sheet's content travels."],
  ["Island", "A region that stays interactive as part of the frontmost sheet."],
  ["ExternalOverlay.Root", "Wrap a third-party overlay so it counts as part of the sheet's modality."],
  ["AutoFocusTarget", "Mark the element the sheet focuses on open."],
  ["VisuallyHidden", "Hidden visually, available to assistive tech."],
  ["SPRING_PRESETS", "The preset map: gentle, smooth, snappy, brisk, bouncy, elastic."],
  ["useClientMediaQuery", "Match a media query after hydration."],
  ["updateThemeColor / useThemeColorDimmingOverlay", "Drive the browser theme-color alongside a sheet."],
  ["createComponentId", "Stable id helper for wiring parts together."],
];

const anatomy = [
  ["Sheet.Root", "Owns presentation and detent state. Provides context to every part."],
  ["Sheet.Trigger", "A button that presents, dismisses, or steps between detents."],
  ["Sheet.Portal", "Renders the sheet into a portal at the document root."],
  ["Sheet.View", "The travel surface. Holds placement, detents, gestures, and modality."],
  ["Sheet.Backdrop", "The dimming layer behind the panel."],
  ["Sheet.Content", "The panel itself."],
  ["Sheet.BleedingBackground", "A background that bleeds past the panel edges as it travels."],
  ["Sheet.Handle", "The drag grabber. action=\"dismiss\" closes on click."],
  ["Sheet.Title / Description", "Accessible name and description for the dialog."],
  ["Sheet.Outlet", "Animate an element outside the panel from this sheet's travel."],
];

/* ------------------------------------------------------------------ nav map */

const SECTIONS = [
  { id: "overview", label: "Overview", group: "Getting started" },
  { id: "installation", label: "Installation", group: "Getting started" },
  { id: "styling", label: "Styling", group: "Getting started" },

  { id: "sheet-quick-start", label: "Quick start", group: "Sheet" },
  { id: "anatomy", label: "Anatomy", group: "Sheet" },
  { id: "open-state", label: "Open state", group: "Sheet" },
  { id: "placement", label: "Placement", group: "Sheet" },
  { id: "detents", label: "Detents", group: "Sheet" },
  { id: "dismissal", label: "Dismissal and modality", group: "Sheet" },
  { id: "travel-animation", label: "Travel animation", group: "Sheet" },
  { id: "springs", label: "Spring settings", group: "Sheet" },
  { id: "triggers", label: "Triggers", group: "Sheet" },
  { id: "accessibility", label: "Accessibility", group: "Sheet" },
  { id: "sheet-api", label: "Sheet API", group: "Sheet" },

  { id: "toast-quick-start", label: "Quick start", group: "Toast" },
  { id: "toast-variants", label: "Variants", group: "Toast" },
  { id: "toast-positioning", label: "Positioning", group: "Toast" },
  { id: "toast-options", label: "Options", group: "Toast" },
  { id: "toast-promise", label: "Promises", group: "Toast" },
  { id: "toast-api", label: "Toast API", group: "Toast" },

  { id: "scroll", label: "Scroll", group: "Advanced" },
  { id: "sheet-stack", label: "Sheet stack", group: "Advanced" },
  { id: "utilities", label: "Utilities", group: "Advanced" },
];

const GROUPS = SECTIONS.reduce((acc, s) => {
  (acc[s.group] = acc[s.group] || []).push(s);
  return acc;
}, {});

const useActiveSection = () => {
  const [active, setActive] = useState(SECTIONS[0].id);
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-90px 0px -72% 0px" }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(s.id);
      if (el) obs.observe(el);
    });
    return () => obs.disconnect();
  }, []);
  return active;
};

/* --------------------------------------------------------------- components */

// Minimal, dependency-free syntax highlighting. One left-to-right pass over a
// combined regex; comments and strings match first so their contents are never
// re-tokenized. Each rule contributes exactly one capture group.
const RULES = [
  ["c", /\/\/[^\n]*|#[^\n]*/],
  ["s", /`(?:\\.|[^`\\])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'/],
  ["t", /<\/?[A-Za-z][\w.]*/],
  ["a", /[A-Za-z_]\w*(?==)/],
  ["k", /\b(?:import|from|export|default|return|const|let|var|function|if|else|new|await|async|true|false|null|undefined)\b/],
  ["y", /\b[A-Z]\w*\b/],
  ["n", /\b\d+(?:\.\d+)?\b/],
];
const MASTER = new RegExp(RULES.map((r) => `(${r[1].source})`).join("|"), "g");

const highlight = (code) => {
  const out = [];
  let last = 0;
  let m;
  let key = 0;
  MASTER.lastIndex = 0;
  while ((m = MASTER.exec(code))) {
    if (m.index > last) out.push(code.slice(last, m.index));
    let cls = "tok";
    for (let g = 1; g <= RULES.length; g++)
      if (m[g] != null) {
        cls = "tok-" + RULES[g - 1][0];
        break;
      }
    out.push(
      <span key={key++} className={cls}>
        {m[0]}
      </span>
    );
    last = m.index + m[0].length;
  }
  if (last < code.length) out.push(code.slice(last));
  return out;
};

const CodeBlock = ({ lang = "tsx", children }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard?.writeText(children).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1400);
    });
  };
  return (
    <div className="Code">
      <div className="Code-head">
        <span className="Code-lang">{lang}</span>
        <button className="Code-copy" onClick={copy}>
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="Code-body">
        <code>{highlight(children)}</code>
      </pre>
    </div>
  );
};

const PropTable = ({ rows }) => (
  <div className="Docs-props">
    {rows.map(([prop, type, def, desc]) => (
      <div className="Docs-prop" key={prop}>
        <div className="Docs-prop-sig">
          <code className="Docs-prop-name">{prop}</code>
          <code className="Docs-prop-type">{type}</code>
          {def ? <span className="Docs-prop-def">default: {def}</span> : null}
        </div>
        <div className="Docs-prop-desc">{desc}</div>
      </div>
    ))}
  </div>
);

const DefList = ({ rows }) => (
  <dl className="Docs-api">
    {rows.map(([name, desc]) => (
      <div className="Docs-apiRow" key={name}>
        <dt className="Docs-apiName">{name}</dt>
        <dd className="Docs-apiDesc">{desc}</dd>
      </div>
    ))}
  </dl>
);

/* --------------------------------------------------------------------- page */

export const Docs = () => {
  const active = useActiveSection();
  return (
    <div className="Docs">
      <aside className="Docs-side" aria-label="Documentation">
        {Object.entries(GROUPS).map(([group, items]) => (
          <div className="Docs-group" key={group}>
            <div className="Docs-groupLabel">{group}</div>
            {items.map((s) => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="Docs-navLink"
                aria-current={active === s.id || undefined}
              >
                {s.label}
              </a>
            ))}
          </div>
        ))}
      </aside>

      <main className="Docs-main">
        {/* ---------------------------------------------------- Overview */}
        <h1 className="Docs-title" id="overview">
          Documentation
        </h1>
        <div className="Docs-meta">
          <span>v0.1.0</span>
          <span>·</span>
          <span>React 19</span>
          <span>·</span>
          <span>Spring + scroll-snap</span>
        </div>
        <p className="Docs-lead">
          Velvet is a sheet and toast library for React. A sheet is composed from small parts,
          and the library handles the gesture, the travel, and the spring motion. You bring the
          visual design.
        </p>
        <p className="Docs-p">Three ideas carry through the whole API:</p>
        <DefList
          rows={[
            ["Travel", "Every sheet rides on a native scroll container. Travel progress runs from 0 (closed) to 1 (open). Backdrops, the panel, and your own elements can animate from that single value."],
            ["Unstyled", "The package ships only the structural CSS that makes a sheet travel. The look is entirely yours."],
            ["One physics model", "Gestures and programmatic motion share a spring integrator, so a flick and a button press feel like the same material."],
          ]}
        />

        {/* ------------------------------------------------ Installation */}
        <h2 className="Docs-h2" id="installation">
          Installation
        </h2>
        <p className="Docs-p">Add the package with your package manager of choice.</p>
        <CodeBlock lang="bash">{installCode}</CodeBlock>

        {/* ----------------------------------------------------- Styling */}
        <h2 className="Docs-h2" id="styling">
          Styling
        </h2>
        <p className="Docs-p">
          Import the structural stylesheet once, near the entry point of your app. It carries the
          scroll-snap machinery and nothing about color or shape, so it will not fight your design.
        </p>
        <CodeBlock lang="ts">{`import "velvet-ui/velvet.css";`}</CodeBlock>
        <p className="Docs-p">
          Every part forwards <code>className</code> and <code>style</code>, and accepts{" "}
          <code>asChild</code> to render your own element instead of the default tag.
        </p>

        {/* --------------------------------------------- Sheet quick start */}
        <h2 className="Docs-h2" id="sheet-quick-start">
          Sheet quick start
        </h2>
        <p className="Docs-p">
          Compose the parts. Each one maps to a role, and only <code>Sheet.Root</code>,{" "}
          <code>Sheet.View</code>, and <code>Sheet.Content</code> are required.
        </p>
        <CodeBlock lang="tsx">{quickStartCode}</CodeBlock>

        {/* ----------------------------------------------------- Anatomy */}
        <h2 className="Docs-h2" id="anatomy">
          Anatomy
        </h2>
        <p className="Docs-p">The full set of parts and what each one does.</p>
        <DefList rows={anatomy} />

        {/* -------------------------------------------------- Open state */}
        <h2 className="Docs-h2" id="open-state">
          Open state
        </h2>
        <p className="Docs-p">
          Leave it uncontrolled and let a <code>Sheet.Trigger</code> drive it, or control it
          yourself with <code>presented</code> and <code>onPresentedChange</code> to open it from
          anywhere.
        </p>
        <CodeBlock lang="tsx">{controlledCode}</CodeBlock>

        {/* ---------------------------------------------------- Placement */}
        <h2 className="Docs-h2" id="placement">
          Placement
        </h2>
        <p className="Docs-p">
          <code>contentPlacement</code> sets the edge the sheet travels from. Use{" "}
          <code>center</code> for dialogs and lightboxes that scale into the middle of the screen.
        </p>
        <CodeBlock lang="tsx">{placementCode}</CodeBlock>

        {/* ----------------------------------------------------- Detents */}
        <h2 className="Docs-h2" id="detents">
          Detents
        </h2>
        <p className="Docs-p">
          Detents are intermediate rest stops between closed and fully open. Give{" "}
          <code>detents</code> a CSS length, or an array of them, and the sheet measures each
          against its travel to find the stop. The active detent is a 1-based index:{" "}
          <code>0</code> is closed, <code>1</code> is the first stop, and the last index is fully
          open.
        </p>
        <CodeBlock lang="tsx">{detentsCode}</CodeBlock>
        <p className="Docs-p">
          Opening snaps to a detent. Closing never stops at one: a swipe toward closed dismisses,
          exactly like a sheet with no detents. To keep a sheet from dismissing, set{" "}
          <code>swipeDismissal={`{false}`}</code> and it collapses to the next lower detent
          instead.
        </p>
        <CodeBlock lang="tsx">{persistentCode}</CodeBlock>

        {/* ------------------------------------------ Dismissal & modality */}
        <h2 className="Docs-h2" id="dismissal">
          Dismissal and modality
        </h2>
        <p className="Docs-p">
          Control how a sheet can be closed and how it relates to the page behind it. A modal
          sheet locks page scroll and treats the outside as inert. A non-modal sheet leaves the
          page interactive, so it is driven by dragging or swiping the panel itself.
        </p>
        <CodeBlock lang="tsx">{dismissalCode}</CodeBlock>
        <p className="Docs-p">
          <code>onClickOutside</code> and <code>onEscapeKeyDown</code> each take either a behavior
          object like <code>{`{ dismiss: false }`}</code> or a function that receives{" "}
          <code>{`{ changeDefault, nativeEvent }`}</code>, so you can decide per event, for example
          to confirm unsaved changes.
        </p>

        {/* --------------------------------------------- Travel animation */}
        <h2 className="Docs-h2" id="travel-animation">
          Travel animation
        </h2>
        <p className="Docs-p">
          <code>Sheet.Backdrop</code>, <code>Sheet.Content</code>, and <code>Sheet.Outlet</code>{" "}
          take a <code>travelAnimation</code> map. Each key is a CSS property, and its value is one
          of three forms: a <code>[from, to]</code> pair interpolated by progress, a function of{" "}
          <code>{`{ progress, tween }`}</code>, or a literal value.
        </p>
        <CodeBlock lang="tsx">{travelCode}</CodeBlock>

        {/* ----------------------------------------------------- Springs */}
        <h2 className="Docs-h2" id="springs">
          Spring settings
        </h2>
        <p className="Docs-p">
          <code>enteringAnimationSettings</code> and <code>exitingAnimationSettings</code> accept a
          preset name, a preset with overrides, or a full spring definition. The same shape works
          anywhere a spring is expected.
        </p>
        <CodeBlock lang="tsx">{springCode}</CodeBlock>
        <PropTable
          rows={[
            ["gentle", "560 / 68 / 1.85", "", "Slow and soft."],
            ["smooth", "580 / 60 / 1.35", "", "Balanced and overshoot-free. The default."],
            ["snappy", "350 / 34 / 0.9", "", "Quick with a touch of life."],
            ["brisk", "350 / 28 / 0.65", "", "Fast, used for gesture dismissals."],
            ["bouncy", "240 / 19 / 0.7", "", "Pronounced overshoot."],
            ["elastic", "260 / 20 / 1", "", "Loose and springy."],
          ]}
        />
        <p className="Docs-note">
          Preset columns read stiffness / damping / mass. Reduced-motion preferences are honored:
          when set, motion is skipped and the panel appears at its destination.
        </p>

        {/* ---------------------------------------------------- Triggers */}
        <h2 className="Docs-h2" id="triggers">
          Triggers
        </h2>
        <p className="Docs-p">
          A <code>Sheet.Trigger</code> is a plain button by default. Its <code>action</code> decides
          what a press does, and <code>asChild</code> lets you keep your own component.
        </p>
        <CodeBlock lang="tsx">{triggerCode}</CodeBlock>

        {/* ----------------------------------------------- Accessibility */}
        <h2 className="Docs-h2" id="accessibility">
          Accessibility
        </h2>
        <p className="Docs-p">
          <code>Sheet.Title</code> and <code>Sheet.Description</code> label the dialog for
          assistive tech. Focus moves into the panel on open and returns to the opener on close.
          Use <code>AutoFocusTarget</code> to choose which element receives focus.
        </p>
        <CodeBlock lang="tsx">{a11yCode}</CodeBlock>

        {/* --------------------------------------------------- Sheet API */}
        <h2 className="Docs-h2" id="sheet-api">
          Sheet API
        </h2>
        <h3 className="Docs-h3">Sheet.Root</h3>
        <PropTable rows={rootProps} />
        <h3 className="Docs-h3">Sheet.View</h3>
        <PropTable rows={viewProps} />
        <h3 className="Docs-h3">Sheet.Backdrop</h3>
        <PropTable rows={backdropProps} />
        <h3 className="Docs-h3">Sheet.Content and Sheet.Outlet</h3>
        <PropTable rows={contentProps} />
        <h3 className="Docs-h3">Sheet.Trigger</h3>
        <PropTable rows={triggerProps} />
        <p className="Docs-note">
          <code>Sheet.Handle</code> takes <code>action="dismiss"</code> to close on click. Every
          part also forwards <code>className</code>, <code>style</code>, and <code>asChild</code>.
        </p>

        {/* --------------------------------------------- Toast quick start */}
        <h2 className="Docs-h2" id="toast-quick-start">
          Toast quick start
        </h2>
        <p className="Docs-p">
          Render one <code>&lt;Toaster /&gt;</code> near the root of your app, then call{" "}
          <code>toast()</code> from anywhere. Toasts stack, expand on hover, and dismiss with a
          flick.
        </p>
        <CodeBlock lang="tsx">{toastQuickStartCode}</CodeBlock>

        {/* ---------------------------------------------------- Variants */}
        <h2 className="Docs-h2" id="toast-variants">
          Variants
        </h2>
        <p className="Docs-p">
          Each variant shares the same signature. <code>loading</code> persists until you resolve
          it, and reusing an <code>id</code> updates a toast in place.
        </p>
        <CodeBlock lang="tsx">{toastVariantsCode}</CodeBlock>

        {/* ------------------------------------------------- Positioning */}
        <h2 className="Docs-h2" id="toast-positioning">
          Positioning
        </h2>
        <p className="Docs-p">
          The <code>Toaster</code> takes a handful of layout props. Swipe directions default to
          ones that make sense for the position.
        </p>
        <CodeBlock lang="tsx">{`<Toaster
  position="top-center"
  duration={5000}
  gap={12}
  stack
  richColors
  closeButton
  swipeDirections={["top", "right"]}
/>`}</CodeBlock>

        {/* ----------------------------------------------------- Options */}
        <h2 className="Docs-h2" id="toast-options">
          Options
        </h2>
        <p className="Docs-p">
          Every toast call takes an options object for a description, a custom duration, an action
          button, an icon, and more.
        </p>
        <CodeBlock lang="tsx">{toastOptionsCode}</CodeBlock>

        {/* ---------------------------------------------------- Promises */}
        <h2 className="Docs-h2" id="toast-promise">
          Promises
        </h2>
        <p className="Docs-p">
          <code>toast.promise</code> shows a loading toast, then swaps it for a success or error
          message when the promise settles. The success and error messages may be functions of the
          resolved or rejected value.
        </p>
        <CodeBlock lang="tsx">{toastPromiseCode}</CodeBlock>

        {/* --------------------------------------------------- Toast API */}
        <h2 className="Docs-h2" id="toast-api">
          Toast API
        </h2>
        <h3 className="Docs-h3">Toaster props</h3>
        <PropTable rows={toasterProps} />
        <h3 className="Docs-h3">toast methods</h3>
        <DefList rows={toastMethods} />
        <h3 className="Docs-h3">Toast options</h3>
        <PropTable rows={toastOpts} />

        {/* ------------------------------------------------------ Scroll */}
        <h2 className="Docs-h2" id="scroll">
          Scroll
        </h2>
        <p className="Docs-p">
          <code>Scroll</code> is a standalone scroll surface that reports progress and can be
          driven imperatively, useful for custom scrollers and reading position. It shares the same
          spring used by sheets.
        </p>
        <CodeBlock lang="tsx">{scrollCode}</CodeBlock>
        <DefList rows={scrollProps} />

        {/* -------------------------------------------------- Sheet stack */}
        <h2 className="Docs-h2" id="sheet-stack">
          Sheet stack
        </h2>
        <p className="Docs-p">
          Wrap sheets in a <code>SheetStack.Root</code> to coordinate them. A{" "}
          <code>SheetStack.Outlet</code> animates a backing layer from the progress of the
          frontmost sheet, so the page behind can recede as a sheet rises.
        </p>
        <CodeBlock lang="tsx">{stackCode}</CodeBlock>

        {/* --------------------------------------------------- Utilities */}
        <h2 className="Docs-h2" id="utilities">
          Utilities and exports
        </h2>
        <p className="Docs-p">The rest of the surface, for less common needs.</p>
        <DefList rows={utilityExports} />
      </main>

      <nav className="Docs-toc" aria-label="On this page">
        <div className="Docs-tocLabel">On this page</div>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            className="Docs-tocLink"
            aria-current={active === s.id || undefined}
          >
            {s.label}
          </a>
        ))}
      </nav>
    </div>
  );
};
