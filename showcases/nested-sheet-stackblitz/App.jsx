import React, { useEffect, useRef, useState } from "react";
import { Sheet } from "@velvetui/react/sheet";
import { Scroll } from "@velvetui/react/utilities";

const chapters = [
  {
    eyebrow: "Before launch",
    title: "Make the first minute feel inevitable",
    copy: "A calm checklist for the final pass: remove uncertainty, protect the happy path, and let the product explain itself.",
    tint: "sage",
  },
  {
    eyebrow: "Interaction notes",
    title: "Design for the second touch",
    copy: "Small rules for responsive controls, interruptible motion, and interfaces that stay quick after the novelty fades.",
    tint: "blue",
  },
  {
    eyebrow: "Release ritual",
    title: "Ship without the launch-day theatre",
    copy: "A practical rhythm for screenshots, support, measurement, and the quiet hour after a release goes live.",
    tint: "lilac",
  },
];

const sections = [
  {
    number: "01",
    title: "Start with the promise",
    body: "Write the one sentence a new visitor should understand before they touch anything. Put it beside the first meaningful action. If the interface needs a tour before it can be useful, the tour is covering for the interface.",
    note: "Quick check",
    points: [
      "Can someone say what this is in five seconds?",
      "Is the primary action visually obvious without shouting?",
      "Does the empty state show a real next step?",
    ],
  },
  {
    number: "02",
    title: "Protect the first interaction",
    body: "The first tap sets the emotional baseline. Preload what is expensive, keep handlers synchronous, and let every pressed state appear immediately. Motion can finish later; acknowledgement cannot.",
    note: "Feel, then measure",
    points: [
      "Warm the code path before the first visible interaction.",
      "Keep active feedback under one frame whenever possible.",
      "Test on a phone after a cold reload, not only a warm desktop tab.",
    ],
  },
  {
    number: "03",
    title: "Keep navigation reversible",
    body: "Every deeper view should make the way back feel obvious. Preserve the parent state, retain its scroll position, and use the same spatial direction for entering and leaving. A nested sheet should feel like a place, not a replacement page.",
    note: "For this demo",
    points: [
      "Scroll this article without moving the library behind it.",
      "Swipe right anywhere in the article to return.",
      "Use Back to keep the modal, or Close to leave it entirely.",
    ],
  },
  {
    number: "04",
    title: "Leave room around the answer",
    body: "Density should follow urgency. Launch screens benefit from fewer decisions, stronger grouping, and generous blank space. Quiet surfaces make the important parts easier to trust.",
    note: "Edit once more",
    points: [
      "Remove labels that only repeat the heading.",
      "Replace decorative borders with spacing where you can.",
      "Read every sentence aloud and cut the mechanical ones.",
    ],
  },
  {
    number: "05",
    title: "Watch the release breathe",
    body: "After launch, spend an hour observing instead of immediately changing things. Look for hesitation, repeated taps, abandoned flows, and questions that arrive in support. Those are product signals, not interruptions.",
    note: "The quiet hour",
    points: [
      "Keep one person available for real user questions.",
      "Record friction before proposing a solution.",
      "Fix blockers now; collect preferences for the next pass.",
    ],
  },
];

function Arrow({ direction = "right" }) {
  const path = direction === "left" ? "m15 18-6-6 6-6" : "m9 18 6-6-6-6";
  return (
    <svg viewBox="0 0 24 24" width="19" height="19" aria-hidden="true">
      <path d={path} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path d="m7 7 10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function Article({ closeAll }) {
  return (
    <>
      <header className="detail-header">
        <Sheet.Close
          className="detail-control back-button"
          type="button"
          aria-label="Back to the library"
        >
          <Arrow direction="left" />
        </Sheet.Close>
        <Sheet.Title className="detail-title">Launch notes</Sheet.Title>
        <button
          className="detail-control close-button"
          type="button"
          aria-label="Close the library"
          onClick={closeAll}
        >
          <CloseIcon />
        </button>
      </header>

      <Scroll.Root className="detail-scroll-root">
        <Scroll.View className="detail-scroll-view" data-testid="detail-scroll">
          <Scroll.Content className="detail-scroll-content">
            <article className="article">
              <div className="article-hero">
                <p className="kicker">Field guide · 8 minute read</p>
                <h2>Make the first minute feel inevitable.</h2>
                <p className="standfirst">
                  A launch checklist for products that want to feel composed—not louder.
                </p>
                <div className="article-meta">
                  <span>Atlas Studio</span>
                  <span>Updated today</span>
                </div>
              </div>

              <div className="article-body">
                {sections.map((section) => (
                  <section className="article-section" key={section.number}>
                    <span className="section-number">{section.number}</span>
                    <div>
                      <h3>{section.title}</h3>
                      <p>{section.body}</p>
                      <aside className="note-card">
                        <strong>{section.note}</strong>
                        <ul>
                          {section.points.map((point) => (
                            <li key={point}>{point}</li>
                          ))}
                        </ul>
                      </aside>
                    </div>
                  </section>
                ))}
              </div>

              <footer className="article-footer">
                <p>That is enough for today.</p>
                <Sheet.Close className="finish-button" type="button">
                  Back to the library <Arrow />
                </Sheet.Close>
              </footer>
            </article>
          </Scroll.Content>
        </Scroll.View>
      </Scroll.Root>
    </>
  );
}

export default function App() {
  const [libraryOpen, setLibraryOpen] = useState(false);
  const [articleOpen, setArticleOpen] = useState(false);
  const portalHostRef = useRef(null);

  useEffect(() => {
    if (!libraryOpen) setArticleOpen(false);
  }, [libraryOpen]);

  const closeAll = () => {
    setArticleOpen(false);
    setLibraryOpen(false);
  };

  return (
    <main className="site-shell">
      <nav className="site-nav" aria-label="Primary">
        <a className="wordmark" href="#top">Atlas</a>
        <div className="nav-links">
          <a href="#work">Work</a>
          <a href="#thinking">Thinking</a>
        </div>
      </nav>

      <section className="landing" id="top">
        <p className="landing-kicker">A small studio for useful software.</p>
        <h1>Quiet tools for<br />busy days.</h1>
        <p className="landing-copy">
          We design and build digital products that make complicated work feel considered.
        </p>

        <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen}>
          <Sheet.Trigger className="open-button" type="button">
            Open the studio library <Arrow />
          </Sheet.Trigger>

          <Sheet.Portal>
            <Sheet.View
              className="library-view"
              side="center"
              tracks="auto"
              swipeOvershoot={false}
              nativeEdgeSwipePrevention
              onClickOutside={{ dismiss: false }}
            >
              <Sheet.Backdrop className="library-backdrop" travelAnimation={{ opacity: [0, 0.24] }} />
              <Sheet.Content className="library-panel">
                <Sheet.BleedingBackground className="panel-surface" />

                <header className="library-header">
                  <div>
                    <Sheet.Title>Studio library</Sheet.Title>
                    <Sheet.Description>Notes for making and releasing thoughtful software.</Sheet.Description>
                  </div>
                  <Sheet.Close className="icon-button" type="button" aria-label="Close library">
                    <CloseIcon />
                  </Sheet.Close>
                </header>

                <Sheet.Root open={articleOpen} onOpenChange={setArticleOpen}>
                  <Scroll.Root className="library-scroll-root">
                    <Scroll.View className="library-scroll-view" data-testid="library-scroll">
                      <Scroll.Content className="library-scroll-content">
                        <div className="library-intro">
                          <p className="kicker">Three notes from the desk</p>
                          <h2>Useful things we want to remember.</h2>
                        </div>

                        <div className="chapter-list">
                          {chapters.map((chapter, index) => (
                            <button
                              className="chapter"
                              data-tint={chapter.tint}
                              type="button"
                              key={chapter.title}
                              onClick={() => setArticleOpen(true)}
                            >
                              <span className="chapter-index">0{index + 1}</span>
                              <span className="chapter-copy">
                                <small>{chapter.eyebrow}</small>
                                <strong>{chapter.title}</strong>
                                <span>{chapter.copy}</span>
                              </span>
                              <span className="chapter-arrow"><Arrow /></span>
                            </button>
                          ))}
                        </div>

                        <div className="library-footnote">
                          <span>Built with the published package</span>
                          <code>@velvetui/react@0.2.0</code>
                        </div>
                      </Scroll.Content>
                    </Scroll.View>
                  </Scroll.Root>

                  <div className="nested-portal-host" ref={portalHostRef} />

                  <Sheet.Portal container={portalHostRef}>
                    <Sheet.View
                      className="detail-view"
                      side="right"
                      nativeEdgeSwipePrevention
                      swipeOvershoot={false}
                      onClickOutside={{ dismiss: false }}
                    >
                      <Sheet.Backdrop className="detail-backdrop" travelAnimation={{ opacity: [0, 0.12] }} />
                      <Sheet.Content className="detail-panel">
                        <Sheet.BleedingBackground className="panel-surface" />
                        <Article closeAll={closeAll} />
                      </Sheet.Content>
                    </Sheet.View>
                  </Sheet.Portal>
                </Sheet.Root>
              </Sheet.Content>
            </Sheet.View>
          </Sheet.Portal>
        </Sheet.Root>
      </section>

      <section className="page-grid" id="work" aria-label="Selected work">
        <article className="page-card page-card-wide">
          <span>01</span><h2>Common Thread</h2><p>A calmer way to coordinate field teams.</p>
        </article>
        <article className="page-card" id="thinking">
          <span>02</span><h2>Soft Systems</h2><p>Notes on humane operational software.</p>
        </article>
        <article className="page-card">
          <span>03</span><h2>Weekend Index</h2><p>A private place for loose plans.</p>
        </article>
      </section>
    </main>
  );
}
