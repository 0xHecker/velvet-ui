import { Link } from "@tanstack/react-router";
import "./ErrorGuide.css";

export const ERROR_GUIDES = {
  "as-child-non-dom": {
    code: "VELVET_AS_CHILD_NON_DOM",
    title: "The slotted ref is not a DOM element",
    summary:
      "Velvet received a ref value, but it did not resolve to the one concrete element that owns the interaction surface.",
    fix:
      "Wrap the content in a DOM element, or forward the ref through your component to its stable outer DOM node.",
  },
  "as-child-identity-changed": {
    code: "VELVET_AS_CHILD_IDENTITY_CHANGED",
    title: "The slotted element changed identity",
    summary:
      "An asChild composition replaced its DOM node while mounted, so gesture, focus, and dismissal ownership could point at different elements.",
    fix:
      "Keep one stable outer element for the component's mounted lifetime. Change its content or attributes instead of swapping the ref target.",
  },
  "external-overlay-non-dom": {
    code: "VELVET_EXTERNAL_OVERLAY_NON_DOM",
    title: "Wrap the popup surface, not its controller",
    summary:
      "External overlay coordination needs the actual portalled DOM surface so it can join the active modal scope and dismissal stack.",
    fix:
      "Place the Velvet adapter inside the third-party Portal and slot its Content or Positioner—the element that really renders DOM.",
  },
  "as-child-ref-dropped": {
    code: "VELVET_AS_CHILD_REF_DROPPED",
    title: "The slotted child dropped its ref",
    summary:
      "The child accepted the composition but did not forward the ref to a DOM node, leaving Velvet unable to observe or focus the surface.",
    fix:
      "Use React.forwardRef when needed and attach the received ref to the component's stable outer DOM element.",
  },
  "as-child-props-dropped": {
    code: "VELVET_AS_CHILD_PROPS_DROPPED",
    title: "The slotted child dropped required attributes",
    summary:
      "The child did not spread Velvet's data or accessibility attributes onto its DOM node, so scope and state cannot be inspected reliably.",
    fix:
      "Spread remaining props onto the same element that receives the forwarded ref. Do not selectively discard data-* or aria-* attributes.",
  },
  "close-not-frontmost": {
    code: "VELVET_CLOSE_NOT_FRONTMOST",
    title: "A covered layer tried to close",
    summary:
      "A close control belongs to a layer behind the current frontmost dismissible surface. Closing it would break stack order.",
    fix:
      "Close the frontmost nested sheet or external overlay first, or move the control into the layer it is intended to dismiss.",
  },
};

export function ErrorGuide({ guide }) {
  return (
    <main className="ErrorGuide">
      <nav className="ErrorGuide-breadcrumb" aria-label="Breadcrumb">
        <Link to="/docs">Docs</Link>
        <span aria-hidden="true">/</span>
        <span>Composition diagnostic</span>
      </nav>
      <div className="ErrorGuide-layout">
        <header>
          <p className="ErrorGuide-eyebrow">Development diagnostic</p>
          <h1>{guide.title}</h1>
          <p>{guide.summary}</p>
        </header>
        <aside aria-label="Diagnostic code">
          <span>Error code</span>
          <code>{guide.code}</code>
        </aside>
      </div>
      <section className="ErrorGuide-fix">
        <p>Recommended recovery</p>
        <h2>{guide.fix}</h2>
        <div>
          <Link to="/docs/component-api">Review component API</Link>
          <Link to="/recipes">Open runnable recipes</Link>
        </div>
      </section>
    </main>
  );
}
