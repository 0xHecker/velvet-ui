import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Sheet, SheetStack } from "../velvet/index.js";
import { SheetPreviewEnvironment } from "../velvet/Sheet.jsx";
import { px } from "./px.js";
import {
  IconBag,
  IconBell,
  IconBook,
  IconCalendar,
  IconChevronR,
  IconClock,
  IconCompass,
  IconFlame,
  IconFolder,
  IconGear,
  IconImage,
  IconMessage,
  IconMusic,
  IconPlay,
  IconPlus,
  IconSparkle,
  IconUsers,
} from "./icons.jsx";
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
import "./preview.css";

const cards = [
  { id: "bottom-sheet", title: "Bottom Sheet", desc: "A bottom-aligned sheet with swipe dismissal.", icon: IconCalendar, Component: BottomSheet },
  { id: "modal", title: "Modal Dialog", desc: "A centered modal surface for focused tasks.", icon: IconUsers, Component: Modal },
  { id: "sidebar", title: "Navigation Drawer", desc: "A sheet presented from the left edge.", icon: IconFolder, Component: Sidebar },
  { id: "detent", title: "Detent Sheet", desc: "A bottom sheet with multiple snap points.", icon: IconMusic, Component: DetentSheet },
  { id: "top-sheet", title: "Top Sheet", desc: "A sheet presented from the top edge.", icon: IconBell, Component: TopSheet },
  { id: "long-sheet", title: "Scrollable Sheet", desc: "Long content with coordinated scroll and drag.", icon: IconFlame, Component: LongSheet },
  { id: "stacked", title: "Stacked Sheets", desc: "A sheet that presents a second sheet.", icon: IconBag, Component: StackedSheets },
  { id: "detached", title: "Detached Sheet", desc: "A floating sheet detached from viewport edges.", icon: IconClock, Component: DetachedSheet },
  { id: "page-from-bottom", title: "Full-Screen Sheet", desc: "A bottom-presented sheet that fills the viewport.", icon: IconPlus, Component: PageFromBottom },
  { id: "depth", title: "Depth Sheet", desc: "A full-width sheet that scales the page behind it.", icon: IconCompass, Component: DepthSheet },
  { id: "lightbox", title: "Lightbox", desc: "A full-screen modal surface for media.", icon: IconImage, Component: Lightbox },
  { id: "parallax", title: "Parallax Sheet", desc: "A full-screen sheet with a parallax cover.", icon: IconCompass, Component: ParallaxPage },
  { id: "page", title: "Side Sheet", desc: "A full-height sheet presented from the right edge.", icon: IconGear, Component: Page },
  { id: "keyboard", title: "Keyboard-Aware Sheet", desc: "A sheet that follows the virtual keyboard.", icon: IconMessage, Component: KeyboardSheet },
  { id: "card", title: "Card Expansion", desc: "A modal card with bidirectional swipe dismissal.", icon: IconBook, Component: Card },
  { id: "persistent", title: "Persistent Sheet", desc: "A non-modal sheet with a persistent collapsed state.", icon: IconPlay, Component: PersistentSheet },
];

const TABS = [
  { id: "sheets", label: "Sheets", href: "/" },
  { id: "toasts", label: "Toasts", href: "/toasts" },
  { id: "docs", label: "Docs", href: "/docs" },
];

const VIEW_PATHS = Object.fromEntries(TABS.map(({ id, href }) => [id, href]));
const PATH_VIEWS = Object.fromEntries(TABS.map(({ id, href }) => [href, id]));
const SCROLL_STATE_KEY = "velvetScrollTop";

const viewFromLocation = () => {
  const pathname = window.location.pathname.replace(/\/+$/, "") || "/";
  return PATH_VIEWS[pathname] || "sheets";
};

const getScrollState = (state = window.history.state) =>
  typeof state?.[SCROLL_STATE_KEY] === "number" ? state[SCROLL_STATE_KEY] : 0;

const saveScrollPosition = () => {
  const scrollTop = document.querySelector(".App-surface")?.scrollTop ?? 0;
  const state = window.history.state;
  window.history.replaceState(
    {
      ...(state && typeof state === "object" ? state : {}),
      [SCROLL_STATE_KEY]: scrollTop,
    },
    "",
  );
};

const applyScrollPosition = (scrollTop = 0) => {
  const hash = window.location.hash.slice(1);
  const target = hash && document.getElementById(decodeURIComponent(hash));

  if (target) {
    target.scrollIntoView({ block: "start" });
    return;
  }

  document.querySelector(".App-surface")?.scrollTo({ top: scrollTop });
};

const FEATURES = [
  { title: "Spring physics", desc: "Fixed-timestep integrator, six presets" },
  { title: "Native scroll-snap", desc: "OS-true momentum on every swipe" },
  { title: "Compound API", desc: "Compose parts like building blocks" },
  { title: "Zero dependencies", desc: "WAAPI + CSS, nothing else" },
];

const APP_DEPTH = {
  translateY: ({ progress }) => `${Math.min(progress, 1) * 14}px`,
  scale: ({ progress }) => 1 - Math.min(progress, 1) * 0.06,
  borderRadius: ({ progress }) => `${Math.min(progress, 1) * 28}px`,
  filter: ({ progress }) => `brightness(${1 - Math.min(progress, 1) * 0.1})`,
  transformOrigin: "50% 0",
};

const PREVIEW_SCENES = {
  "bottom-sheet": {
    app: "Velvet Escapes",
    eyebrow: "Upcoming stay",
    title: "Five nights in Tulum",
    detail: "Nov 12–17 · 4 guests",
    image: px(248797, 720, 420),
  },
  modal: {
    app: "Velvet Studio",
    eyebrow: "Design workspace",
    title: "Atlas Redesign",
    detail: "12 teammates · 38 files",
    image: px(3183150, 720, 420),
  },
  sidebar: {
    app: "Velvet Studio",
    eyebrow: "Product workspace",
    title: "Today’s priorities",
    detail: "7 tasks ready for review",
    image: px(196644, 720, 420),
  },
  detent: {
    app: "Velvet Music",
    eyebrow: "Now playing",
    title: "Midnight Drive",
    detail: "The Velvets · Evening queue",
    image: px(1763075, 720, 420),
    theme: "dark",
  },
  "top-sheet": {
    app: "Velvet Messages",
    eyebrow: "Team inbox",
    title: "A focused afternoon",
    detail: "2 unread conversations",
    image: px(3184465, 720, 420),
  },
  "long-sheet": {
    app: "Sunday Table",
    eyebrow: "Saved collection",
    title: "Weekend brunch",
    detail: "4 recipes · 1 shopping list",
    image: px(376464, 720, 420),
  },
  stacked: {
    app: "Velvet Store",
    eyebrow: "New release",
    title: "Retro High OG",
    detail: "University Gold · $180",
    image: px(1598505, 720, 420),
  },
  detached: {
    app: "Meridian",
    eyebrow: "Heritage collection",
    title: "Precision, refined",
    detail: "Eight hand-finished pieces",
    image: px(190819, 720, 420),
  },
  "page-from-bottom": {
    app: "Velvet Notes",
    eyebrow: "Today",
    title: "Launch planning",
    detail: "12 notes · Edited 18 min ago",
    image: px(3184465, 720, 420),
  },
  depth: {
    app: "Field Atlas",
    eyebrow: "Creator profile",
    title: "Mara Vale",
    detail: "Alpine stories · 12.8k readers",
    image: px(1287145, 720, 420),
  },
  lightbox: {
    app: "Velvet Photos",
    eyebrow: "Summer archive",
    title: "Golden hour",
    detail: "24 photographs · July 18",
    image: px(1108099, 720, 420),
  },
  parallax: {
    app: "Field Notes",
    eyebrow: "68° north",
    title: "Chasing the Aurora",
    detail: "Tromsø · 8 minute read",
    image: px(3408744, 720, 420),
    theme: "dark",
  },
  page: {
    app: "Velvet",
    eyebrow: "Personal account",
    title: "Marcus Reid",
    detail: "Pro workspace · 12 collaborators",
    image: px(614810, 720, 420),
  },
  keyboard: {
    app: "Velvet Chat",
    eyebrow: "Direct message",
    title: "Ava Laurent",
    detail: "Online now · Last reply 9:38",
    image: px(733872, 720, 420),
  },
  card: {
    app: "Velvet Journal",
    eyebrow: "Curated daily",
    title: "Designing motion that feels real",
    detail: "Hana Yuki · 6 minute read",
    image: px(3408744, 720, 420),
  },
  persistent: {
    app: "Velvet Music",
    eyebrow: "Your library",
    title: "Made for focus",
    detail: "27 tracks · 2 hr 18 min",
    image: px(1763075, 720, 420),
    theme: "dark",
  },
};

const PreviewBackdrop = ({ id }) => {
  const scene = PREVIEW_SCENES[id];
  return (
    <div className="DemoBackdrop" data-theme={scene.theme || "light"}>
      <div className="DemoBackdrop-body">
        <section className="DemoBackdrop-copy">
          <div className="DemoBackdrop-app">
            <span className="DemoBackdrop-mark">V</span>
            <strong>{scene.app}</strong>
            <span className="DemoBackdrop-people">
              {[733872, 614810, 1239291].map((person) => (
                <i key={person} style={{ backgroundImage: `url(${px(person, 72, 72)})` }} />
              ))}
            </span>
          </div>
          <span>{scene.eyebrow}</span>
          <h4>{scene.title}</h4>
          <p>{scene.detail}</p>
          <div className="DemoBackdrop-actions">
            <strong>Open overview</strong>
            <span>Share</span>
          </div>
        </section>
        <section className="DemoBackdrop-feature">
          <img
            src={scene.image}
            alt=""
            width="720"
            height="420"
            loading="lazy"
            decoding="async"
          />
          <div><strong>{scene.title}</strong><span>{scene.detail}</span></div>
        </section>
        <aside className="DemoBackdrop-rail">
          <span>Today</span>
          <strong>3 updates</strong>
          <div className="DemoBackdrop-update">
            <i style={{ backgroundImage: `url(${px(733872, 72, 72)})` }} />
            <span><b>Ava Laurent</b><small>Shared an update</small></span>
            <time>9:41</time>
          </div>
          <div className="DemoBackdrop-update">
            <i style={{ backgroundImage: `url(${px(614810, 72, 72)})` }} />
            <span><b>Marcus Reid</b><small>Left feedback</small></span>
            <time>8:17</time>
          </div>
          <div className="DemoBackdrop-update">
            <i style={{ backgroundImage: `url(${px(1239291, 72, 72)})` }} />
            <span><b>Sofia Nguyen</b><small>Marked it ready</small></span>
            <time>7:52</time>
          </div>
        </aside>
      </div>
    </div>
  );
};

const NESTED_PREVIEWS = new Set(["stacked"]);

const GalleryCard = ({ card }) => {
  const { id, title, desc, icon: CardIcon, Component } = card;
  const cardRef = useRef(null);
  const [portalHost, setPortalHost] = useState(null);
  const [layers, setLayers] = useState([false, false]);
  const openTimer = useRef(0);
  const closeTimer = useRef(0);
  const nestedActivated = useRef(false);
  const previewLocked = useRef(false);
  const nested = NESTED_PREVIEWS.has(id);

  const clearTimers = useCallback(() => {
    window.clearTimeout(openTimer.current);
    window.clearTimeout(closeTimer.current);
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const showPreview = useCallback(() => {
    clearTimers();
    if (nested && nestedActivated.current) {
      setLayers([true, true]);
      return;
    }
    setLayers([true, false]);
    if (nested) {
      openTimer.current = window.setTimeout(() => {
        nestedActivated.current = true;
        setLayers([true, true]);
      }, 460);
    }
  }, [clearTimers, nested]);

  const hidePreview = useCallback(() => {
    clearTimers();
    if (!nested) {
      setLayers([false, false]);
      return;
    }
    setLayers((current) => [current[0], false]);
    closeTimer.current = window.setTimeout(() => {
      nestedActivated.current = false;
      setLayers([false, false]);
    }, 420);
  }, [clearTimers, nested]);

  const updateLayer = useCallback((depth, presented) => {
    setLayers((current) => current.map((value, index) => (index === depth ? presented : value)));
  }, []);

  const lockPreview = useCallback(() => {
    previewLocked.current = true;
    hidePreview();
  }, [hidePreview]);

  const openCardDemo = useCallback((event) => {
    lockPreview();
    openDemo(event);
  }, [lockPreview]);

  const openCardDemoKey = useCallback((event) => {
    if (event.key !== "Enter" && event.key !== " ") return;
    event.preventDefault();
    lockPreview();
    openDemo(event);
  }, [lockPreview]);

  useEffect(() => {
    const unlockAfterRealDemo = (event) => {
      if (!previewLocked.current || event.pointerType === "touch") return;
      if (document.querySelector('[data-velvet="view"]:not([data-velvet-preview])')) return;

      previewLocked.current = false;
      if (cardRef.current?.matches(":hover")) showPreview();
    };

    document.addEventListener("pointermove", unlockAfterRealDemo, { passive: true });
    return () => document.removeEventListener("pointermove", unlockAfterRealDemo);
  }, [showPreview]);

  return (
    <section
      ref={cardRef}
      className="Card"
      data-shot={id}
      data-preview-open={layers[0] || undefined}
      onPointerEnter={(event) => {
        if (event.pointerType !== "touch" && !previewLocked.current) showPreview();
      }}
      onPointerLeave={(event) => {
        if (event.pointerType !== "touch" && !previewLocked.current) hidePreview();
      }}
      onFocusCapture={(event) => {
        // Touching a focusable card also fires focus before click. Opening the
        // hover preview from that focus used to mount one sheet here, then the
        // click immediately mounted the real sheet as well. Mobile paid for
        // both first-open layouts and animations at once; later taps appeared
        // smooth only because this card was already focused. Keep previews for
        // keyboard navigation, where focus-visible represents real intent.
        if (
          !previewLocked.current &&
          event.target instanceof Element &&
          event.target.matches(":focus-visible")
        ) {
          showPreview();
        }
      }}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) hidePreview();
      }}
    >
      <div
        className="Card-preview"
        role="button"
        tabIndex={0}
        aria-label={`Open the ${title} demo`}
        onClick={openCardDemo}
        onKeyDown={openCardDemoKey}
      >
        <div className="DemoPreview" aria-hidden="true">
          <div className="DemoPreview-canvas" ref={setPortalHost}>
            <PreviewBackdrop id={id} />
            {portalHost && (
              <SheetPreviewEnvironment
                container={portalHost}
                layers={layers}
                onLayerPresentedChange={updateLayer}
              >
                <SheetStack.Root className="Card-localStack">
                  <Component preview />
                </SheetStack.Root>
              </SheetPreviewEnvironment>
            )}
          </div>
        </div>
        <div
          className="Card-trigger"
          onClick={(event) => {
            event.stopPropagation();
            lockPreview();
          }}
        >
          <CardIcon className="Card-triggerIcon" size={14} />
          {id === "depth" ? (
            <Component />
          ) : (
            <SheetStack.Root className="Card-localStack">
              <Component />
            </SheetStack.Root>
          )}
        </div>
      </div>
      <div className="Card-meta">
        <h3 className="Card-title">{title}</h3>
        <p className="Card-desc">{desc}</p>
      </div>
    </section>
  );
};

// Clicking anywhere on a card preview fires that card's demo trigger.
const openDemo = (e) => {
  const card = e.currentTarget.closest(".Card");
  card?.querySelector(".Card-trigger [data-velvet-trigger]")?.click();
};

// The server-rendered site imports this focused page component. The legacy App
// below remains only for the local visual harnesses that still import it.
export const SheetGallery = () => (
  <>
    <header className="Hero">
      <div className="Hero-glow" aria-hidden />
      <div className="Hero-wash" aria-hidden />
      <div className="Hero-eyebrow">
        <IconSparkle size={13} />
        Sheets, toasts, and motion for React
      </div>
      <h1 className="Hero-title">
        Swipeable sheets that feel <em>native</em>
      </h1>
      <p className="Hero-sub">
        <strong>Spring physics, real momentum, and native scroll-snap gestures</strong>,
        driven by the Web Animations API and composed like building blocks.
      </p>
      <div className="Hero-actions">
        <a className="Btn Btn--primary Btn--pill" href="/docs">
          Read the docs <IconChevronR size={16} />
        </a>
        <a className="Btn Btn--soft Btn--pill" href="/toasts">
          Try the toasts <IconChevronR size={16} />
        </a>
      </div>
      <dl className="Hero-features">
        {FEATURES.map((feature) => (
          <div className="Hero-feature" key={feature.title}>
            <dt>{feature.title}</dt>
            <dd>{feature.desc}</dd>
          </div>
        ))}
      </dl>
    </header>

    <div className="GalleryHead">
      <div>
        <div className="GalleryHead-eyebrow">The gallery</div>
        <h2 className="GalleryHead-title">
          Explore every <em>sheet pattern</em>
        </h2>
        <p className="GalleryHead-sub">
          Hover a card to preview its motion. Open it to drag, scroll, stack, and
          dismiss the real component.
        </p>
      </div>
      <span className="GalleryHead-count">{cards.length} interactive examples</span>
    </div>

    <main className="Gallery">
      {cards.map((card) => <GalleryCard card={card} key={card.id} />)}
    </main>

    <footer className="Footer">
      Velvet UI — a clean-room reimplementation built for the craft. Photos by Pexels.
    </footer>
  </>
);

export const App = () => {
  const [view, setView] = useState(viewFromLocation);
  const viewRef = useRef(view);
  const pendingScrollRef = useRef(getScrollState());
  const scrollRestoreFrameRef = useRef(0);
  viewRef.current = view;

  const scheduleScrollPosition = useCallback((scrollTop) => {
    window.cancelAnimationFrame(scrollRestoreFrameRef.current);
    scrollRestoreFrameRef.current = window.requestAnimationFrame(() => {
      scrollRestoreFrameRef.current = window.requestAnimationFrame(() => {
        applyScrollPosition(scrollTop);
      });
    });
  }, []);

  useLayoutEffect(() => {
    const scrollTop = pendingScrollRef.current ?? getScrollState();
    pendingScrollRef.current = null;
    scheduleScrollPosition(scrollTop);
    return () => window.cancelAnimationFrame(scrollRestoreFrameRef.current);
  }, [scheduleScrollPosition, view]);

  useEffect(() => {
    const scroller = document.querySelector(".App-surface");
    const previousScrollRestoration = window.history.scrollRestoration;
    let scrollFrame = 0;

    window.history.scrollRestoration = "manual";

    const syncView = (event) => {
      const nextView = viewFromLocation();
      const scrollTop = getScrollState(event.state);

      if (viewRef.current === nextView) {
        scheduleScrollPosition(scrollTop);
        return;
      }

      pendingScrollRef.current = scrollTop;
      setView(nextView);
    };
    const syncHash = () => {
      if (viewRef.current === viewFromLocation()) {
        scheduleScrollPosition(getScrollState());
      }
    };
    const persistScroll = () => {
      window.cancelAnimationFrame(scrollFrame);
      scrollFrame = window.requestAnimationFrame(saveScrollPosition);
    };

    window.addEventListener("popstate", syncView);
    window.addEventListener("hashchange", syncHash);
    scroller?.addEventListener("scroll", persistScroll, { passive: true });

    return () => {
      window.removeEventListener("popstate", syncView);
      window.removeEventListener("hashchange", syncHash);
      scroller?.removeEventListener("scroll", persistScroll);
      window.cancelAnimationFrame(scrollFrame);
      window.cancelAnimationFrame(scrollRestoreFrameRef.current);
      window.history.scrollRestoration = previousScrollRestoration;
    };
  }, [scheduleScrollPosition]);

  const navigate = useCallback((nextView) => {
    const pathname = VIEW_PATHS[nextView] || VIEW_PATHS.sheets;
    saveScrollPosition();

    if (window.location.pathname !== pathname || window.location.hash) {
      window.history.pushState({ [SCROLL_STATE_KEY]: 0 }, "", pathname);
    }

    if (viewRef.current === nextView) {
      scheduleScrollPosition(0);
      return;
    }

    pendingScrollRef.current = 0;
    setView(nextView);
  }, [scheduleScrollPosition]);

  const followRoute = useCallback((event, nextView) => {
    if (
      event.button !== 0 ||
      event.metaKey ||
      event.ctrlKey ||
      event.shiftKey ||
      event.altKey
    ) return;

    event.preventDefault();
    navigate(nextView);
  }, [navigate]);

  return (
    <SheetStack.Root className="App-depthRoot">
      <SheetStack.Outlet asChild stackingAnimation={APP_DEPTH}>
        <div className="App-surface">
          <nav className="Nav">
        <div className="Nav-left" role="tablist" aria-label="Sections">
          {TABS.map((t) => (
            <a
              key={t.id}
              className="Nav-tab"
              role="tab"
              href={t.href}
              aria-selected={view === t.id}
              data-view={t.id}
              onClick={(event) => followRoute(event, t.id)}
            >
              {t.label}
            </a>
          ))}
        </div>
        <div className="Nav-brand">Velvet</div>
        <div className="Nav-right">
          <a className="Nav-cta" href="/docs" onClick={(event) => followRoute(event, "docs")}>
            Get the code <IconChevronR size={15} />
          </a>
        </div>
          </nav>

          <div className={`Page${view === "docs" ? " Page--docs" : ""}`}>
        {view === "docs" ? (
          <Docs />
        ) : (
          <>
            {view === "sheets" ? <header className="Hero">
              <div className="Hero-glow" aria-hidden />
              <div className="Hero-wash" aria-hidden />
              <div className="Hero-eyebrow">
                <IconSparkle size={13} />
                Sheets, toasts, and motion — for React
              </div>
              <h1 className="Hero-title">
                Swipeable sheets that feel <em>native</em>
              </h1>
              <p className="Hero-sub">
                <strong>Spring physics, real momentum, and native scroll-snap gestures</strong>,
                driven by the Web Animations API and composed like building blocks.
              </p>
              <div className="Hero-actions">
                <a
                  className="Btn Btn--primary Btn--pill"
                  href="/docs"
                  onClick={(event) => followRoute(event, "docs")}
                >
                  Read the docs <IconChevronR size={16} />
                </a>
                <a
                  className="Btn Btn--soft Btn--pill"
                  href={view === "toasts" ? "/" : "/toasts"}
                  onClick={(event) => followRoute(event, view === "toasts" ? "sheets" : "toasts")}
                >
                  {view === "toasts" ? "Browse sheets" : "Try the toasts"} <IconChevronR size={16} />
                </a>
              </div>
              <dl className="Hero-features">
                {FEATURES.map((f) => (
                  <div className="Hero-feature" key={f.title}>
                    <dt>{f.title}</dt>
                    <dd>{f.desc}</dd>
                  </div>
                ))}
              </dl>
            </header> : null}

            {view === "toasts" ? (
              <ToastPlayground />
            ) : (
              <>
                <div className="GalleryHead">
                  <div>
                    <div className="GalleryHead-eyebrow">The gallery</div>
                    <h2 className="GalleryHead-title">
                      Explore every <em>sheet pattern</em>
                    </h2>
                    <p className="GalleryHead-sub">
                      Hover a card to preview its motion. Open it to drag, scroll, stack, and
                      dismiss the real component.
                    </p>
                  </div>
                  <span className="GalleryHead-count">{cards.length} interactive examples</span>
                </div>

                <main className="Gallery">
                  {cards.map((card) => <GalleryCard card={card} key={card.id} />)}
                </main>
              </>
            )}
          </>
        )}

        <footer className="Footer">
          Velvet UI — a clean-room reimplementation built for the craft. Photos by Pexels.
        </footer>
          </div>
        </div>
      </SheetStack.Outlet>
    </SheetStack.Root>
  );
};
