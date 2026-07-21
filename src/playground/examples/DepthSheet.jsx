import { useCallback, useState } from "react";
import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import {
  IconChevronR,
  IconChevronUp,
  IconHeart,
  IconPin,
  IconShare,
  IconSparkle,
} from "../icons.jsx";
import "./DepthSheet.css";

const FIELD_NOTES = [
  {
    title: "Blue hour above Senja",
    meta: "Norway · 6 min read",
    image: px(3408744, 720, 520),
  },
  {
    title: "Weather moving through",
    meta: "Dolomites · 4 min read",
    image: px(1366919, 720, 520),
  },
  {
    title: "A cabin above the clouds",
    meta: "Svalbard · 8 min read",
    image: px(572897, 720, 520),
  },
  {
    title: "Last light on the ridge",
    meta: "Lofoten · 5 min read",
    image: px(1287145, 720, 520),
  },
];

const SELECTED_FRAMES = [
  {
    src: px(417074, 1200, 900),
    alt: "A mountain lake surrounded by alpine peaks",
    caption: "Western Norway · 06:42",
  },
  {
    src: px(572897, 720, 520),
    alt: "A snow-covered mountain beneath a starry sky",
    caption: "Svalbard · Night watch",
  },
  {
    src: px(1366919, 720, 520),
    alt: "Clouds moving across a mountain ridge",
    caption: "Dolomites · Storm front",
  },
];

const UPCOMING_ROUTES = [
  {
    month: "AUG",
    day: "18",
    place: "Senja, Norway",
    detail: "Seven days following the northern coast",
    status: "Packing",
  },
  {
    month: "SEP",
    day: "09",
    place: "Cairngorms, Scotland",
    detail: "Bothy portraits and the first autumn rain",
    status: "Planned",
  },
  {
    month: "OCT",
    day: "03",
    place: "Westfjords, Iceland",
    detail: "A slow loop through the shoulder season",
    status: "Open route",
  },
];

export const DepthSheet = ({ preview = false }) => {
  const [presented, setPresented] = useState(false);
  const [track, setTrack] = useState("bottom");

  const handleScroll = useCallback(
    ({ progress }) => {
      if (!presented) return;
      setTrack(progress < 0.5 ? "bottom" : "top");
    },
    [presented]
  );

  const handleTravelStatus = useCallback((status) => {
    if (status === "idleOutside") setTrack("bottom");
  }, []);

  return (
  <Sheet.Root presented={presented} onPresentedChange={setPresented}>
    <Sheet.Trigger className="Btn">
      View profile <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className={`Depth-view${preview ? " Depth-view--preview" : ""}`}
        contentPlacement="center"
        tracks={track}
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        onTravelStatusChange={handleTravelStatus}
        enteringAnimationSettings={{ easing: "spring", stiffness: 420, damping: 42, mass: 1.2 }}
      >
        <Sheet.Backdrop
          className="Depth-backdrop"
          travelAnimation={{ opacity: ({ progress }) => Math.min(progress * 0.28, 0.28) }}
        />
        <Sheet.Content className="Depth-content">
          <Scroll.Root className="Depth-scrollRoot">
            <Scroll.View className="Depth-scrollView" onScrollProgress={handleScroll}>
              <Scroll.Content className="Depth-scrollContent">
                <article className="Depth-profile">
                  <div className="Depth-cover">
                    <img src={px(1287145, 1600, 900)} alt="Snow-covered mountains at dusk" />
                    <div className="Depth-coverShade" />
                    <Sheet.Handle className="Depth-handle" />
                    <Sheet.Trigger action="dismiss" className="Depth-close" aria-label="Close profile">
                      <IconChevronUp size={20} />
                    </Sheet.Trigger>
                    <span className="Depth-coverTag">
                      <IconSparkle size={12} /> Independent field journal
                    </span>
                  </div>

                  <div className="Depth-profileIntro">
                    <div className="Depth-avatarRow">
                      <img
                        className="Depth-avatar"
                        src={px(1239291, 240, 240)}
                        alt="Mara Vale"
                      />
                      <div className="Depth-actions">
                        <button className="Depth-iconBtn" aria-label="Save Mara Vale’s profile">
                          <IconHeart size={18} />
                        </button>
                        <button className="Depth-iconBtn" aria-label="Share Mara Vale’s profile">
                          <IconShare size={18} />
                        </button>
                        <button className="Depth-follow">Follow</button>
                      </div>
                    </div>

                    <div className="Depth-heading">
                      <Sheet.Title className="Depth-title">Mara Vale</Sheet.Title>
                      <span className="Depth-handleName">@maravale</span>
                    </div>

                    <Sheet.Description className="Depth-bio">
                      Photographer and trail writer documenting remote landscapes, small shelters,
                      and the weather between them.
                    </Sheet.Description>

                    <div className="Depth-stats">
                      <span><strong>38</strong> field notes</span>
                      <span><strong>12.8k</strong> readers</span>
                      <span><strong>17</strong> countries</span>
                      <span><IconPin size={13} /> Bergen, Norway</span>
                    </div>

                    <section className="Depth-section" aria-labelledby="depth-field-notes">
                      <div className="Depth-sectionHead">
                        <div>
                          <span>Latest from the trail</span>
                          <strong id="depth-field-notes">Field notes</strong>
                        </div>
                        <button>See all <IconChevronR size={14} /></button>
                      </div>

                      <div className="Depth-stories">
                        {FIELD_NOTES.map((note) => (
                          <article className="Depth-story" key={note.title}>
                            <img src={note.image} alt="" />
                            <div>
                              <strong>{note.title}</strong>
                              <span>{note.meta}</span>
                            </div>
                            <IconChevronR className="Depth-storyChevron" size={16} />
                          </article>
                        ))}
                      </div>
                    </section>

                    <section className="Depth-section" aria-labelledby="depth-selected-frames">
                      <div className="Depth-sectionHead">
                        <div>
                          <span>From the archive</span>
                          <strong id="depth-selected-frames">Selected frames</strong>
                        </div>
                        <span className="Depth-sectionCount">03 / 38</span>
                      </div>

                      <div className="Depth-photoGrid">
                        {SELECTED_FRAMES.map((frame) => (
                          <figure key={frame.caption}>
                            <img src={frame.src} alt={frame.alt} />
                            <figcaption>{frame.caption}</figcaption>
                          </figure>
                        ))}
                      </div>
                    </section>

                    <section className="Depth-dispatch" aria-labelledby="depth-dispatch-title">
                      <div className="Depth-dispatchCopy">
                        <span>Dispatch 038 · Svalbard</span>
                        <h2 id="depth-dispatch-title">The kind of silence you have to walk toward.</h2>
                        <p>
                          Four nights, one weather window, and a small red shelter at the edge of
                          the map.
                        </p>
                        <button>Read the dispatch <IconChevronR size={14} /></button>
                      </div>
                      <img src={px(3408744, 900, 760)} alt="Northern lights over snowy peaks" />
                    </section>

                    <section className="Depth-section" aria-labelledby="depth-upcoming-routes">
                      <div className="Depth-sectionHead">
                        <div>
                          <span>Next on the map</span>
                          <strong id="depth-upcoming-routes">Upcoming routes</strong>
                        </div>
                      </div>

                      <div className="Depth-routes">
                        {UPCOMING_ROUTES.map((route) => (
                          <article className="Depth-route" key={route.place}>
                            <time>
                              <span>{route.month}</span>
                              <strong>{route.day}</strong>
                            </time>
                            <div>
                              <strong>{route.place}</strong>
                              <span>{route.detail}</span>
                            </div>
                            <span className="Depth-routeStatus">{route.status}</span>
                            <IconChevronR className="Depth-routeChevron" size={16} />
                          </article>
                        ))}
                      </div>
                    </section>

                    <footer className="Depth-join">
                      <div>
                        <span>Twice a month, no noise</span>
                        <strong>Notes worth carrying home.</strong>
                        <p>New photographs, trail stories, and practical route notes from Mara.</p>
                      </div>
                      <button>Join 12.8k readers <IconChevronR size={15} /></button>
                    </footer>
                  </div>
                </article>
              </Scroll.Content>
            </Scroll.View>
          </Scroll.Root>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
  );
};
