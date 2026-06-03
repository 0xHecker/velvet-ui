import { useState } from "react";
import { BottomSheet } from "./examples/BottomSheet.jsx";
import { Card } from "./examples/Card.jsx";
import { Docs } from "./Docs.jsx";
import { DepthSheet } from "./examples/DepthSheet.jsx";
import { DetachedSheet } from "./examples/DetachedSheet.jsx";
import { DetentSheet } from "./examples/DetentSheet.jsx";
import { KeyboardSheet } from "./examples/KeyboardSheet.jsx";
import { Lightbox } from "./examples/Lightbox.jsx";
import { LongSheet } from "./examples/LongSheet.jsx";
import { Modal } from "./examples/Modal.jsx";
import { Page } from "./examples/Page.jsx";
import { PageFromBottom } from "./examples/PageFromBottom.jsx";
import { ParallaxPage } from "./examples/ParallaxPage.jsx";
import { PersistentSheet } from "./examples/PersistentSheet.jsx";
import { Sidebar } from "./examples/Sidebar.jsx";
import { StackedSheets } from "./examples/StackedSheets.jsx";
import { ToastPlayground } from "./ToastPlayground.jsx";
import { TopSheet } from "./examples/TopSheet.jsx";

const Chevron = () => (
  <svg viewBox="0 0 24 24" fill="none" aria-hidden>
    <path d="M9 6l6 6-6 6" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const cards = [
  { id: "bottom-sheet", title: "Bottom Sheet", desc: "Slides up, swipe to dismiss.", el: <BottomSheet /> },
  { id: "modal", title: "Modal", desc: "Centered dialog with backdrop.", el: <Modal /> },
  { id: "sidebar", title: "Sidebar", desc: "Drawer from the side.", el: <Sidebar /> },
  { id: "detent", title: "Sheet with Detent", desc: "Rests at an intermediate stop.", el: <DetentSheet /> },
  { id: "top-sheet", title: "Top Sheet", desc: "Descends from the top.", el: <TopSheet /> },
  { id: "long-sheet", title: "Long Sheet", desc: "Scroll the content; pull to dismiss.", el: <LongSheet /> },
  { id: "stacked", title: "Stacked Sheets", desc: "Sheets that settle behind each other.", el: <StackedSheets /> },
  { id: "detached", title: "Detached Sheet", desc: "Floats inset, all corners rounded.", el: <DetachedSheet /> },
  { id: "page-from-bottom", title: "Page from Bottom", desc: "Full-height page slides up.", el: <PageFromBottom /> },
  { id: "depth", title: "Sheet with Depth", desc: "Lower sheet recedes in place.", el: <DepthSheet /> },
  { id: "lightbox", title: "Lightbox", desc: "Photo zooms open on a dark scrim.", el: <Lightbox /> },
  { id: "parallax", title: "Parallax Page", desc: "Cover image trails the page.", el: <ParallaxPage /> },
  { id: "page", title: "Page", desc: "Full-screen push from the side.", el: <Page /> },
  { id: "keyboard", title: "Sheet with Keyboard", desc: "Composer stays above the keyboard.", el: <KeyboardSheet /> },
  { id: "card", title: "Card", desc: "Tap-to-expand, scales from a card.", el: <Card /> },
  { id: "persistent", title: "Persistent Sheet", desc: "Mini-player detent, never dismisses.", el: <PersistentSheet /> },
];

const TABS = [
  { id: "sheets", label: "Sheets" },
  { id: "toasts", label: "Toasts" },
  { id: "docs", label: "Docs" },
];

export const App = () => {
  const [view, setView] = useState("sheets");
  return (
    <>
      <nav className="Nav">
        <div className="Nav-left" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <button
              key={t.id}
              className="Nav-tab"
              role="tab"
              aria-selected={view === t.id}
              data-view={t.id}
              onClick={() => setView(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="Nav-brand">Velvet</div>
        <div className="Nav-right">
          <button className="Nav-cta" onClick={() => setView("docs")}>
            Get the code <Chevron />
          </button>
        </div>
      </nav>

      <div className={`Page${view === "docs" ? " Page--docs" : ""}`}>
        {view === "docs" ? (
          <Docs />
        ) : (
          <>
            <header className="Hero">
              <div className="Hero-glow" aria-hidden />
              <div className="Hero-wash" aria-hidden />
              <div className="Hero-eyebrow">Sheets, toasts, and motion</div>
              <h1 className="Hero-title">
                Swipeable sheets that feel <em>native</em>
              </h1>
              <p className="Hero-sub">
                <strong>Spring physics, real momentum, and native scroll-snap gestures</strong>,
                driven by the Web Animations API and composed like building blocks.
              </p>
              <div className="Hero-actions">
                <button className="Btn Btn--primary Btn--pill" onClick={() => setView("docs")}>
                  Read the docs <Chevron />
                </button>
                <button
                  className="Btn Btn--soft Btn--pill"
                  onClick={() => setView(view === "toasts" ? "sheets" : "toasts")}
                >
                  {view === "toasts" ? "Browse sheets" : "Try the toasts"} <Chevron />
                </button>
              </div>
            </header>

            {view === "toasts" ? (
              <ToastPlayground />
            ) : (
              <main className="Gallery">
                {cards.map((c) => (
                  <section className="Card" data-shot={c.id} key={c.id}>
                    <div className="Card-preview" aria-hidden>
                      <div className="Card-mockSheet" />
                    </div>
                    <div className="Card-meta">
                      <h3 className="Card-title">{c.title}</h3>
                      <p className="Card-desc">{c.desc}</p>
                    </div>
                    <div className="Card-action">{c.el}</div>
                  </section>
                ))}
              </main>
            )}
          </>
        )}

        <footer className="Footer">Velvet UI, a clean-room reimplementation built for the craft.</footer>
      </div>
    </>
  );
};
