import React, { useEffect, useRef, useState } from "react";
import { Sheet } from "@velvetui/react/sheet";
import { Scroll } from "@velvetui/react/utilities";

const chapters = [
  {
    eyebrow: "Before launch",
    title: "Make the first minute feel inevitable",
    copy: "A calm checklist for the final pass: remove uncertainty, protect the happy path, and let the product explain itself.",
    tint: "bg-[#e6eee8]",
  },
  {
    eyebrow: "Interaction notes",
    title: "Design for the second touch",
    copy: "Small rules for responsive controls, interruptible motion, and interfaces that stay quick after the novelty fades.",
    tint: "bg-[#e8edf0]",
  },
  {
    eyebrow: "Release ritual",
    title: "Ship without the launch-day theatre",
    copy: "A practical rhythm for screenshots, support, measurement, and the quiet hour after a release goes live.",
    tint: "bg-[#eee9f0]",
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

const focusRing = "focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-[#276f66]";
const pillButton = `motion-control mt-9 inline-flex min-h-12 items-center justify-center gap-2.5 rounded-full border border-black/10 bg-[#292721] px-[19px] text-[#fffefb] shadow-[0_10px_30px_-18px_rgba(0,0,0,0.55)] transition-[transform,background-color] duration-150 ease-soft hover:bg-[#161510] active:scale-[0.96] ${focusRing}`;
const circleButton = `motion-control grid size-11 shrink-0 place-items-center rounded-full border border-black/10 bg-[#f5f3ef] text-ink transition-[transform,background-color,border-color] duration-150 ease-soft hover:bg-[#ece9e3] active:scale-[0.94] ${focusRing}`;
const detailControl = `motion-control grid size-[42px] place-items-center rounded-full border border-black/10 bg-[#f3f0ea] p-0 text-[#35312b] shadow-[0_1px_1px_rgba(28,25,21,0.04)] transition-[transform,background-color,border-color] duration-150 ease-soft hover:border-black/15 hover:bg-[#eae6de] active:scale-[0.94] ${focusRing}`;
const scrollRoot = "flex min-h-0 w-full flex-1 flex-col overflow-hidden";
const scrollView = "native-scrollbar h-full min-h-0 w-full overflow-y-auto overscroll-y-contain [scrollbar-color:rgba(78,73,65,0.36)_transparent] [scrollbar-gutter:stable] [scrollbar-width:thin] [-webkit-overflow-scrolling:touch]";
const headerSurface = "relative z-[5] grid shrink-0 items-center border-b border-black/10 bg-[rgba(255,254,252,0.94)] backdrop-blur-[18px] backdrop-saturate-[1.1]";

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
      <header className={`${headerSurface} min-h-[70px] grid-cols-[44px_minmax(0,1fr)_44px] gap-5 px-4 py-2.5 max-[700px]:min-h-[62px] max-[700px]:px-2.5 max-[700px]:pb-[7px] max-[700px]:pt-[max(7px,env(safe-area-inset-top))]`}>
        <Sheet.Close className={`${detailControl} justify-self-start`} type="button" aria-label="Back to the library">
          <Arrow direction="left" />
        </Sheet.Close>
        <Sheet.Title className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-sm font-bold">Launch notes</Sheet.Title>
        <button className={`${detailControl} justify-self-end`} type="button" aria-label="Close the library" onClick={closeAll}>
          <CloseIcon />
        </button>
      </header>

      <Scroll.Root className={scrollRoot}>
        <Scroll.View className={scrollView} data-testid="detail-scroll">
          <Scroll.Content className="min-h-full w-full">
            <article className="min-h-full bg-paper">
              <div className="mx-auto w-[min(100%,760px)] px-9 pb-[72px] pt-[92px] max-[700px]:px-[22px] max-[700px]:pb-[54px] max-[700px]:pt-[68px]">
                <p className="mb-6 mt-0 text-xs font-[680] uppercase tracking-[0.09em] text-[#777168]">Field guide · 8 minute read</p>
                <h2 className="m-0 text-balance text-[clamp(48px,7vw,84px)] font-[560] leading-[0.98] tracking-[-0.065em]">Make the first minute feel inevitable.</h2>
                <p className="mt-8 max-w-[600px] text-pretty text-[clamp(19px,2.4vw,25px)] leading-[1.45] text-muted">A launch checklist for products that want to feel composed—not louder.</p>
                <div className="mt-11 flex gap-[22px] text-xs text-[#8a857c]"><span>Atlas Studio</span><span>Updated today</span></div>
              </div>

              <div className="mx-auto w-[min(100%,820px)] px-9 max-[700px]:px-[22px]">
                {sections.map((section) => (
                  <section className="grid grid-cols-[54px_minmax(0,1fr)] gap-[18px] border-t border-black/10 py-[68px] max-[700px]:grid-cols-1 max-[700px]:gap-3 max-[700px]:py-[52px]" key={section.number}>
                    <span className="pt-[9px] text-[11px] text-[#918b81] max-[700px]:pt-0">{section.number}</span>
                    <div>
                      <h3 className="m-0 text-balance text-[clamp(30px,4vw,44px)] font-[580] leading-[1.05] tracking-[-0.045em]">{section.title}</h3>
                      <p className="mt-[25px] max-w-[650px] text-pretty text-[17px] leading-[1.75] text-[#5d5952] max-[700px]:text-base max-[700px]:leading-[1.7]">{section.body}</p>
                      <aside className="mt-9 rounded-[18px] bg-[#eef1ec] px-[26px] py-6 max-[700px]:p-[22px]">
                        <strong className="text-[13px]">{section.note}</strong>
                        <ul className="mt-4 grid list-none gap-[11px] p-0">
                          {section.points.map((point) => (
                            <li className="note-dot relative pl-5 text-sm leading-[1.45] text-[#67625a]" key={point}>{point}</li>
                          ))}
                        </ul>
                      </aside>
                    </div>
                  </section>
                ))}
              </div>

              <footer className="grid min-h-[300px] place-items-center px-6 pb-[calc(80px_+_env(safe-area-inset-bottom))] pt-20 text-center">
                <div>
                  <p className="m-0 text-[clamp(28px,5vw,46px)] font-[560] tracking-[-0.04em]">That is enough for today.</p>
                  <Sheet.Close className={`${pillButton} mt-[26px]`} type="button">Back to the library <Arrow /></Sheet.Close>
                </div>
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
    <main className="min-h-[150vh]">
      <nav className="mx-auto flex min-h-20 w-[min(1180px,calc(100%_-_48px))] items-center justify-between max-[700px]:w-[calc(100%_-_32px)]" aria-label="Primary">
        <a className={`font-[760] tracking-[-0.04em] no-underline ${focusRing}`} href="#top">Atlas</a>
        <div className="flex gap-[26px] max-[700px]:gap-4">
          <a className={`text-sm text-muted no-underline ${focusRing}`} href="#work">Work</a>
          <a className={`text-sm text-muted no-underline ${focusRing}`} href="#thinking">Thinking</a>
        </div>
      </nav>

      <section className="mx-auto flex min-h-[610px] w-[min(1180px,calc(100%_-_48px))] flex-col items-start justify-center py-[68px] pb-[84px] max-[700px]:min-h-[590px] max-[700px]:w-[calc(100%_-_32px)] max-[700px]:pt-12" id="top">
        <p className="mb-6 mt-0 text-xs font-[680] uppercase tracking-[0.09em] text-[#777168]">A small studio for useful software.</p>
        <h1 className="m-0 max-w-[850px] text-balance text-[clamp(62px,10vw,136px)] font-[560] leading-[0.86] tracking-[-0.075em] max-[700px]:text-[clamp(58px,19vw,92px)]">Quiet tools for<br />busy days.</h1>
        <p className="mb-0 mt-[42px] max-w-[540px] text-pretty text-[clamp(18px,2vw,22px)] leading-normal text-muted">We design and build digital products that make complicated work feel considered.</p>

        <Sheet.Root open={libraryOpen} onOpenChange={setLibraryOpen}>
          <Sheet.Trigger className={pillButton} type="button">Open the studio library <Arrow /></Sheet.Trigger>

          <Sheet.Portal>
            <Sheet.View className="[--modal-pad:20px]" side="center" tracks="auto" swipeOvershoot={false} nativeEdgeSwipePrevention onClickOutside={{ dismiss: false }}>
              <Sheet.Backdrop className="bg-[#27251f]" travelAnimation={{ opacity: [0, 0.24] }} />
              <Sheet.Content className="relative isolate flex h-[min(760px,calc(var(--velvet-100lvh)_-_40px))] min-h-0 w-[min(1020px,calc(100vw_-_40px))] flex-col overflow-hidden rounded-[28px] border border-black/10 text-ink shadow-[0_44px_100px_-38px_rgba(25,22,18,0.42)] max-[700px]:h-[var(--velvet-100lvh)] max-[700px]:w-screen max-[700px]:rounded-none max-[700px]:border-0">
                <Sheet.BleedingBackground className="rounded-[inherit] bg-paper" />

                <header className={`${headerSurface} min-h-[76px] grid-cols-[1fr_auto] gap-5 px-[18px] py-3 pl-7 max-[700px]:min-h-[68px] max-[700px]:py-2 max-[700px]:pl-5 max-[700px]:pr-3 max-[700px]:pt-[max(8px,env(safe-area-inset-top))]`}>
                  <div>
                    <Sheet.Title className="m-0 text-base tracking-[-0.02em]">Studio library</Sheet.Title>
                    <Sheet.Description className="mt-1 text-xs text-muted max-[700px]:hidden">Notes for making and releasing thoughtful software.</Sheet.Description>
                  </div>
                  <Sheet.Close className={circleButton} type="button" aria-label="Close library"><CloseIcon /></Sheet.Close>
                </header>

                <Sheet.Root open={articleOpen} onOpenChange={setArticleOpen}>
                  <Scroll.Root className={scrollRoot}>
                    <Scroll.View className={scrollView} data-testid="library-scroll">
                      <Scroll.Content className="min-h-full w-full">
                        <div className="mx-auto w-[min(100%,780px)] px-[34px] pb-[50px] pt-[72px] text-center max-[700px]:px-[22px] max-[700px]:pb-[38px] max-[700px]:pt-14">
                          <p className="mb-6 mt-0 text-xs font-[680] uppercase tracking-[0.09em] text-[#777168]">Three notes from the desk</p>
                          <h2 className="m-0 text-balance text-[clamp(38px,6vw,66px)] font-[560] leading-none tracking-[-0.055em]">Useful things we want to remember.</h2>
                        </div>

                        <div className="grid gap-2.5 px-[22px] pb-[22px] max-[700px]:px-2.5 max-[700px]:pb-2.5">
                          {chapters.map((chapter, index) => (
                            <button className={`motion-control grid min-h-[146px] w-full grid-cols-[42px_minmax(0,1fr)_44px] items-center gap-4 rounded-[20px] border-0 p-6 text-left text-ink transition-[transform,filter] duration-150 ease-soft hover:-translate-y-px hover:brightness-[0.985] active:scale-[0.99] max-[700px]:min-h-[154px] max-[700px]:grid-cols-[32px_minmax(0,1fr)] max-[700px]:p-[21px] ${chapter.tint} ${focusRing}`} type="button" key={chapter.title} onClick={() => setArticleOpen(true)}>
                              <span className="self-start text-[11px] text-black/50">0{index + 1}</span>
                              <span className="grid gap-[7px]">
                                <small className="text-[11px] font-[680] uppercase tracking-[0.07em] text-[#706b63]">{chapter.eyebrow}</small>
                                <strong className="text-[clamp(21px,3vw,30px)] font-[580] leading-[1.05] tracking-[-0.04em]">{chapter.title}</strong>
                                <span className="max-w-[660px] text-pretty text-sm leading-[1.45] text-[#69645c]">{chapter.copy}</span>
                              </span>
                              <span className="grid size-10 place-items-center rounded-full bg-white/70 max-[700px]:hidden"><Arrow /></span>
                            </button>
                          ))}
                        </div>

                        <div className="mx-6 mt-8 flex items-center justify-between gap-4 border-t border-black/10 px-1 pb-8 pt-6 text-xs text-muted max-[700px]:mx-[18px] max-[700px]:flex-col max-[700px]:items-start">
                          <span>Built with the published package + Tailwind CSS v4</span>
                          <code className="rounded-lg bg-[#efede8] px-2.5 py-[7px] text-[#45413b]">@velvetui/react@0.2.0</code>
                        </div>
                      </Scroll.Content>
                    </Scroll.View>
                  </Scroll.Root>

                  <div className="pointer-events-none absolute inset-0 z-20 overflow-hidden rounded-[inherit] max-[700px]:rounded-none" ref={portalHostRef} />

                  <Sheet.Portal container={portalHostRef}>
                    <Sheet.View className="!absolute" side="right" nativeEdgeSwipePrevention swipeOvershoot={false} onClickOutside={{ dismiss: false }}>
                      <Sheet.Backdrop className="bg-[#302c26]" travelAnimation={{ opacity: [0, 0.12] }} />
                      <Sheet.Content className="relative isolate flex h-full min-h-0 w-full flex-col overflow-hidden rounded-[inherit] text-ink shadow-[-20px_0_60px_-44px_rgba(34,30,24,0.45)]">
                        <Sheet.BleedingBackground className="rounded-[inherit] bg-paper" />
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

      <section className="mx-auto grid w-[min(1180px,calc(100%_-_48px))] grid-cols-2 gap-3.5 pb-[130px] max-[700px]:w-[calc(100%_-_32px)] max-[700px]:grid-cols-1" id="work" aria-label="Selected work">
        <article className="col-span-full min-h-[410px] rounded-[26px] bg-[#ded8cd] p-7 max-[700px]:col-auto"><span className="text-xs text-[#7c776d]">01</span><h2 className="mb-2 mt-[120px] text-[26px] tracking-[-0.04em]">Common Thread</h2><p className="m-0 text-muted">A calmer way to coordinate field teams.</p></article>
        <article className="min-h-[280px] rounded-[26px] bg-[#e5e7df] p-7" id="thinking"><span className="text-xs text-[#7c776d]">02</span><h2 className="mb-2 mt-[120px] text-[26px] tracking-[-0.04em]">Soft Systems</h2><p className="m-0 text-muted">Notes on humane operational software.</p></article>
        <article className="min-h-[280px] rounded-[26px] bg-[#e5e1e8] p-7"><span className="text-xs text-[#7c776d]">03</span><h2 className="mb-2 mt-[120px] text-[26px] tracking-[-0.04em]">Weekend Index</h2><p className="m-0 text-muted">A private place for loose plans.</p></article>
      </section>
    </main>
  );
}
