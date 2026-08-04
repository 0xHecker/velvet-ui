# Depth Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
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
  return (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      View profile <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className={`Depth-view${preview ? " Depth-view--preview" : ""}`}
        side="center"
        tracks="auto"
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        enteringAnimationSettings={{ easing: "spring", stiffness: 420, damping: 42, mass: 1.2 }}
      >
        <Sheet.Backdrop
          className="Depth-backdrop"
          travelAnimation={{ opacity: ({ progress }) => Math.min(progress * 0.28, 0.28) }}
        />
        <Sheet.Content className="Depth-content">
          <Sheet.BleedingBackground className="Depth-bg" />
          <Scroll.Root className="Depth-scrollRoot">
            <Scroll.View className="Depth-scrollView">
              <Scroll.Content className="Depth-scrollContent">
                <article className="Depth-profile">
                  <div className="Depth-cover">
                    <img src={px(417074, 1600, 900)} alt="An alpine lake surrounded by mountains" />
                    <div className="Depth-coverShade" />
                    <Sheet.Handle className="Depth-handle" />
                    <Sheet.Trigger action="close" className="Depth-close" aria-label="Close profile">
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
```

## CSS

```css
.Depth-view {
  height: var(--velvet-100lvh);
}

.Depth-backdrop {
  background: #020806;
}

.Depth-content {
  box-sizing: border-box;
  width: 100%;
  max-width: none;
  height: 100%;
  background: transparent;
}

.Depth-bg {
  top: max(28px, env(safe-area-inset-top));
  border-radius: 28px 28px 0 0;
  background: #f8faf8;
}

.Depth-view--preview .Depth-content {
  width: 100%;
}

.Depth-scrollRoot,
.Depth-scrollView {
  width: 100%;
}

.Depth-scrollRoot {
  height: 100%;
}

.Depth-scrollView {
  height: calc(100% - max(28px, env(safe-area-inset-top)));
  margin-top: max(28px, env(safe-area-inset-top));
  border-radius: 28px 28px 0 0;
  background: #f8faf8;
  -webkit-overflow-scrolling: touch;
}

.Depth-scrollContent {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  height: auto;
}

.Depth-profile {
  min-height: 100%;
  color: #10201c;
  background: #f8faf8;
  box-shadow:
    0 -1px 0 rgba(255, 255, 255, 0.8),
    0 -24px 70px -34px rgba(0, 0, 0, 0.5);
}

.Depth-cover {
  position: relative;
  width: calc(100% + 16px);
  height: clamp(230px, 38vh, 370px);
  overflow: hidden;
  border-radius: 28px 28px 0 0;
  background: #cad5d1;
}

.Depth-cover > img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  object-position: center 48%;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}

.Depth-coverShade {
  position: absolute;
  inset: 0;
  background:
    linear-gradient(180deg, rgba(5, 16, 14, 0.18), transparent 34%),
    linear-gradient(0deg, rgba(5, 16, 14, 0.42), transparent 36%);
}

.Depth-handle {
  position: absolute;
  z-index: 2;
  top: 12px;
  left: 50%;
  margin: 0;
  translate: -50% 0;
  background: rgba(255, 255, 255, 0.74);
  box-shadow: 0 1px 5px rgba(0, 0, 0, 0.15);
}

.Depth-close {
  position: absolute;
  z-index: 2;
  top: 18px;
  left: clamp(16px, 3vw, 30px);
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  appearance: none;
  border: none;
  border-radius: 999px;
  color: #fff;
  background: rgba(8, 24, 20, 0.42);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  box-shadow: 0 8px 24px -12px rgba(0, 0, 0, 0.72);
  cursor: pointer;
  transition: transform 160ms var(--ease), background-color 160ms ease;
}

.Depth-close svg {
  transform: rotate(180deg);
}

.Depth-close:hover {
  background: rgba(8, 24, 20, 0.58);
}

.Depth-close:active,
.Depth-iconBtn:active,
.Depth-follow:active,
.Depth-sectionHead button:active,
.Depth-dispatch button:active,
.Depth-join button:active {
  transform: scale(0.96);
}

.Depth-coverTag {
  position: absolute;
  z-index: 1;
  left: clamp(20px, 5vw, 70px);
  bottom: 22px;
  display: inline-flex;
  align-items: center;
  gap: 7px;
  padding: 8px 11px;
  border-radius: 999px;
  color: rgba(255, 255, 255, 0.92);
  background: rgba(8, 24, 20, 0.34);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 11.5px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.Depth-profileIntro {
  box-sizing: border-box;
  width: 100%;
  max-width: 1080px;
  margin: 0 auto;
  padding: 0 clamp(20px, 5vw, 70px) 44px;
}

.Depth-avatarRow {
  position: relative;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  margin-top: -36px;
}

.Depth-avatar {
  flex: none;
  width: 104px;
  height: 104px;
  border: 5px solid #f8faf8;
  border-radius: 999px;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  box-shadow: 0 12px 34px -18px rgba(6, 25, 20, 0.46);
}

.Depth-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 8px;
}

.Depth-iconBtn,
.Depth-follow,
.Depth-sectionHead button {
  appearance: none;
  font: inherit;
  cursor: pointer;
  transition: transform 160ms var(--ease), background-color 160ms ease, color 160ms ease;
}

.Depth-sectionCount {
  padding-bottom: 8px;
  color: #87948f;
  font-size: 11px;
  font-weight: 750;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.06em;
}

.Depth-iconBtn {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  padding: 0;
  border: none;
  border-radius: 999px;
  color: #17372f;
  background: #e6ede9;
  box-shadow: inset 0 0 0 1px rgba(5, 30, 23, 0.06);
}

.Depth-iconBtn:hover {
  background: #dce7e2;
}

.Depth-follow {
  min-height: 44px;
  padding: 0 19px;
  border: none;
  border-radius: 999px;
  color: #f4fff9;
  background: #143e33;
  box-shadow: 0 9px 22px -13px rgba(7, 55, 43, 0.72);
  font-size: 14px;
  font-weight: 750;
}

.Depth-follow:hover {
  background: #0d332a;
}

.Depth-heading {
  margin-top: 14px;
  display: flex;
  align-items: baseline;
  gap: 10px;
  flex-wrap: wrap;
}

.Depth-title {
  margin: 0;
  color: #10201c;
  font-size: clamp(30px, 5vw, 46px);
  font-weight: 800;
  line-height: 1;
  letter-spacing: -0.045em;
  text-wrap: balance;
}

.Depth-handleName {
  color: #75837f;
  font-size: 15px;
  font-weight: 650;
}

.Depth-bio {
  max-width: 650px;
  margin: 14px 0 0;
  color: #536661;
  font-size: 15px;
  line-height: 1.55;
  text-wrap: pretty;
}

.Depth-stats {
  margin-top: 18px;
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 9px 18px;
  color: #687a75;
  font-size: 13px;
  font-variant-numeric: tabular-nums;
}

.Depth-stats span {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.Depth-stats strong {
  color: #17332b;
  font-weight: 800;
}

.Depth-sectionHead {
  margin-top: 30px;
  padding-top: 24px;
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 18px;
  box-shadow: inset 0 1px rgba(0, 0, 0, 0.08);
}

.Depth-sectionHead > div {
  display: flex;
  flex-direction: column;
}

.Depth-sectionHead span {
  color: #7b8985;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.Depth-sectionHead strong {
  margin-top: 4px;
  font-family: var(--font-serif);
  font-size: 24px;
  font-weight: 600;
  letter-spacing: -0.03em;
}

.Depth-sectionHead button {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  gap: 5px;
  padding: 0 2px 0 12px;
  border: none;
  color: #315a50;
  background: transparent;
  font-size: 13px;
  font-weight: 750;
}

.Depth-stories {
  margin-top: 14px;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.Depth-story {
  min-width: 0;
  padding: 8px;
  display: grid;
  grid-template-columns: 84px minmax(0, 1fr) auto;
  align-items: center;
  gap: 12px;
  border-radius: 18px;
  background: #eef3f0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.045);
}

.Depth-story img {
  width: 84px;
  height: 72px;
  display: block;
  border-radius: 12px;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}

.Depth-story > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.Depth-story strong {
  color: #18352d;
  font-size: 14px;
  line-height: 1.25;
  letter-spacing: -0.015em;
  text-wrap: pretty;
}

.Depth-story span {
  margin-top: 5px;
  color: #74847f;
  font-size: 11.5px;
}

.Depth-storyChevron {
  color: #789087;
}

.Depth-photoGrid {
  margin-top: 14px;
  display: grid;
  grid-template-columns: minmax(0, 1.45fr) minmax(180px, 0.75fr);
  grid-template-rows: repeat(2, 148px);
  gap: 10px;
}

.Depth-photoGrid figure {
  position: relative;
  min-width: 0;
  min-height: 0;
  margin: 0;
  overflow: hidden;
  border-radius: 18px;
  background: #d5ded9;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}

.Depth-photoGrid figure:first-child {
  grid-row: 1 / 3;
}

.Depth-photoGrid img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  transition: transform 500ms cubic-bezier(0.22, 1, 0.36, 1);
}

.Depth-photoGrid figure:hover img {
  transform: scale(1.025);
}

.Depth-photoGrid figcaption {
  position: absolute;
  right: 10px;
  bottom: 10px;
  left: 10px;
  padding: 8px 10px;
  border-radius: 10px;
  overflow: hidden;
  color: rgba(255, 255, 255, 0.94);
  background: rgba(7, 22, 18, 0.42);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Depth-dispatch {
  margin-top: 30px;
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(250px, 0.95fr);
  min-height: 330px;
  overflow: hidden;
  border-radius: 24px;
  color: #f0faf5;
  background: #123b31;
  box-shadow: 0 22px 44px -34px rgba(6, 37, 29, 0.8);
}

.Depth-dispatchCopy {
  align-self: center;
  padding: clamp(26px, 5vw, 52px);
}

.Depth-dispatchCopy > span,
.Depth-join > div > span {
  color: #9fc9bb;
  font-size: 10.5px;
  font-weight: 800;
  letter-spacing: 0.1em;
  text-transform: uppercase;
}

.Depth-dispatch h2 {
  max-width: 520px;
  margin: 12px 0 0;
  font-family: var(--font-serif);
  font-size: clamp(27px, 4vw, 42px);
  font-weight: 550;
  line-height: 1.04;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.Depth-dispatch p {
  max-width: 460px;
  margin: 16px 0 0;
  color: rgba(231, 246, 239, 0.72);
  font-size: 13px;
  line-height: 1.55;
  text-wrap: pretty;
}

.Depth-dispatch button,
.Depth-join button {
  min-height: 44px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
  appearance: none;
  border: none;
  border-radius: 999px;
  font: inherit;
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition: transform 160ms var(--ease), background-color 160ms ease;
}

.Depth-dispatch button {
  margin-top: 24px;
  padding: 0 17px;
  color: #123b31;
  background: #e1f2e9;
}

.Depth-dispatch button:hover {
  background: #fff;
}

.Depth-dispatch > img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: cover;
  outline: 1px solid rgba(0, 0, 0, 0.1);
  outline-offset: -1px;
}

.Depth-routes {
  margin-top: 14px;
  border-radius: 20px;
  background: #eef3f0;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.045);
}

.Depth-route {
  min-width: 0;
  min-height: 78px;
  padding: 12px 16px;
  display: grid;
  grid-template-columns: 48px minmax(0, 1fr) auto auto;
  align-items: center;
  gap: 14px;
}

.Depth-route + .Depth-route {
  box-shadow: inset 0 1px rgba(0, 0, 0, 0.07);
}

.Depth-route time {
  width: 48px;
  height: 52px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 13px;
  color: #f3fff9;
  background: #1b4a3e;
  font-variant-numeric: tabular-nums;
}

.Depth-route time span {
  font-size: 8px;
  font-weight: 800;
  letter-spacing: 0.08em;
}

.Depth-route time strong {
  margin-top: 1px;
  font-size: 18px;
  line-height: 1;
}

.Depth-route > div {
  min-width: 0;
  display: flex;
  flex-direction: column;
}

.Depth-route > div strong {
  color: #18352d;
  font-size: 13.5px;
}

.Depth-route > div span {
  margin-top: 4px;
  overflow: hidden;
  color: #71817c;
  font-size: 11.5px;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.Depth-routeStatus {
  padding: 6px 9px;
  border-radius: 999px;
  color: #477066;
  background: #dfe9e4;
  font-size: 10px;
  font-weight: 750;
  white-space: nowrap;
}

.Depth-routeChevron {
  color: #789087;
}

.Depth-join {
  margin-top: 30px;
  padding: clamp(24px, 4vw, 38px);
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: 28px;
  border-radius: 24px;
  color: #17372f;
  background: #dcebe4;
  box-shadow: inset 0 0 0 1px rgba(7, 45, 35, 0.06);
}

.Depth-join > div {
  display: flex;
  flex-direction: column;
}

.Depth-join > div > strong {
  margin-top: 7px;
  font-family: var(--font-serif);
  font-size: clamp(24px, 3.5vw, 34px);
  font-weight: 600;
  letter-spacing: -0.035em;
  text-wrap: balance;
}

.Depth-join p {
  max-width: 530px;
  margin: 8px 0 0;
  color: #5b716a;
  font-size: 12.5px;
  line-height: 1.5;
  text-wrap: pretty;
}

.Depth-join button {
  flex: none;
  padding: 0 18px;
  color: #f4fff9;
  background: #143e33;
}

.Depth-join button:hover {
  background: #0d332a;
}

@media (max-width: 700px) {
  .Depth-cover {
    height: 238px;
  }

  .Depth-profileIntro {
    padding-inline: 20px;
  }

  .Depth-avatar {
    width: 92px;
    height: 92px;
  }

  .Depth-avatarRow {
    margin-top: -30px;
  }

  .Depth-iconBtn {
    display: none;
  }

  .Depth-stories {
    grid-template-columns: 1fr;
  }

  .Depth-photoGrid {
    grid-template-columns: minmax(0, 1.25fr) minmax(110px, 0.75fr);
    grid-template-rows: repeat(2, 112px);
  }

  .Depth-dispatch {
    grid-template-columns: 1fr;
  }

  .Depth-dispatch > img {
    height: 220px;
    grid-row: 1;
  }

  .Depth-dispatchCopy {
    grid-row: 2;
  }

  .Depth-route {
    grid-template-columns: 48px minmax(0, 1fr) auto;
    gap: 12px;
  }

  .Depth-routeStatus {
    display: none;
  }

  .Depth-join {
    align-items: flex-start;
    flex-direction: column;
  }

  .Depth-join button {
    width: 100%;
  }
}
```
