import { useEffect, useState } from "react";
import "./Docs.css";

const quickStart = `import { Sheet } from "velvet-ui";
import "velvet-ui/velvet.css";

export function Example() {
  return (
    <Sheet.Root>
      <Sheet.Trigger>Open</Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View>
          <Sheet.Backdrop />
          <Sheet.Content>
            <Sheet.Handle />
            <Sheet.Title>A native-like sheet</Sheet.Title>
            <Sheet.Trigger action="dismiss">Close</Sheet.Trigger>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  );
}`;

const toastUsage = `import { Toaster, toast } from "velvet-ui";

// Render once, near the root.
<Toaster position="bottom-right" />

// Then call from anywhere.
toast.success("Saved to your library", {
  description: "Synced across your devices.",
});`;

const recipes = [
  { label: "Placement", code: `<Sheet.View contentPlacement="right">  {/* bottom · top · left · right · center */}` },
  { label: "Detents", code: `<Sheet.View detents="60lvh">          {/* or ["40lvh", "80lvh"] */}\n<Sheet.Root defaultActiveDetent={1}>` },
  { label: "Persistent", code: `<Sheet.View detents="92px" swipeDismissal={false}>  {/* mini-player */}` },
  { label: "Travel animation", code: `<Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />` },
  { label: "Spring", code: `<Sheet.View enteringAnimationSettings="snappy">  {/* smooth gentle snappy brisk bouncy */}` },
];

const api = [
  ["Sheet.Root", "Owns presentation state — presented, defaultActiveDetent, onPresentedChange."],
  ["Sheet.Trigger", `Opens, or with action="dismiss" / action={{ type: "step" }}.`],
  ["Sheet.Portal", "Renders the sheet into a portal at the document root."],
  ["Sheet.View", "The travel surface. contentPlacement, detents, swipe, swipeDismissal."],
  ["Sheet.Backdrop", "Dimming layer behind the panel. Accepts travelAnimation."],
  ["Sheet.Content", "The panel. Accepts travelAnimation and stackingAnimation."],
  ["Sheet.Handle", "The drag grabber."],
  ["Sheet.Title / Description", "Labelled for assistive tech (WAI-ARIA dialog)."],
  ["Toaster", "Stacking toast viewport — position, richColors, closeButton."],
  ["toast()", "Imperative toast API: success, error, info, loading, promise, custom."],
];

const SECTIONS = [
  { id: "getting-started", label: "Getting Started", group: "Fundamentals" },
  { id: "install", label: "Install", group: "Fundamentals" },
  { id: "styles", label: "Import the styles", group: "Fundamentals" },
  { id: "quick-start", label: "Quick start", group: "Usage" },
  { id: "recipes", label: "Recipes", group: "Usage" },
  { id: "toasts", label: "Toasts", group: "Usage" },
  { id: "anatomy", label: "Anatomy", group: "Reference" },
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
        <code>{children}</code>
      </pre>
    </div>
  );
};

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
        <h1 className="Docs-title" id="getting-started">
          Getting Started
        </h1>
        <div className="Docs-meta">
          <span>v0.1.0</span>
          <span>·</span>
          <span>React 19</span>
          <span>·</span>
          <span>Spring + WAAPI</span>
        </div>
        <p className="Docs-lead">
          Velvet is a compound-component sheet library. You compose the parts; it handles the
          spring physics, native scroll-snap gestures, and travel-driven animation.
        </p>

        <h2 className="Docs-h2" id="install">
          Install
        </h2>
        <p className="Docs-p">Add the package with your package manager of choice.</p>
        <CodeBlock lang="bash">npm install velvet-ui</CodeBlock>

        <h2 className="Docs-h2" id="styles">
          Import the styles
        </h2>
        <p className="Docs-p">
          Velvet ships unstyled structural CSS: the scroll-snap machinery that makes a sheet
          travel. Import it once, then bring your own visual design.
        </p>
        <CodeBlock lang="ts">{`import "velvet-ui/velvet.css";`}</CodeBlock>

        <h2 className="Docs-h2" id="quick-start">
          Quick start
        </h2>
        <p className="Docs-p">Compose the parts. Each one maps to a semantic role.</p>
        <CodeBlock lang="tsx">{quickStart}</CodeBlock>

        <h2 className="Docs-h2" id="recipes">
          Recipes
        </h2>
        <p className="Docs-p">Common configurations, one line each.</p>
        <div className="Docs-recipes">
          {recipes.map((r) => (
            <div className="Docs-recipe" key={r.label}>
              <h3 className="Docs-h3">{r.label}</h3>
              <CodeBlock lang="tsx">{r.code}</CodeBlock>
            </div>
          ))}
        </div>

        <h2 className="Docs-h2" id="toasts">
          Toasts
        </h2>
        <p className="Docs-p">
          Render one <code>&lt;Toaster /&gt;</code> near the root, then call <code>toast()</code>{" "}
          from anywhere. It stacks, expands on hover, and dismisses with a flick.
        </p>
        <CodeBlock lang="tsx">{toastUsage}</CodeBlock>

        <h2 className="Docs-h2" id="anatomy">
          Anatomy
        </h2>
        <p className="Docs-p">The full set of parts and what each one does.</p>
        <dl className="Docs-api">
          {api.map(([name, desc]) => (
            <div className="Docs-apiRow" key={name}>
              <dt className="Docs-apiName">{name}</dt>
              <dd className="Docs-apiDesc">{desc}</dd>
            </div>
          ))}
        </dl>
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
