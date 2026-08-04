# Parallax Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconChevronR, IconPin, IconStar, IconSun } from "../icons.jsx";
import "./ParallaxPage.css";

export const ParallaxPage = () => {
  return (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      Read the story <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View
        className="Parallax-view"
        side="center"
        tracks="auto"
        swipeOvershoot={false}
        nativeEdgeSwipePrevention
        enteringAnimationSettings={{
          easing: "spring",
          stiffness: 480,
          damping: 45,
          mass: 1.5,
        }}
      >
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.25 }} />
        <Sheet.Content className="Parallax-content" asChild>
          <Scroll.Root className="Parallax-scrollRoot" asChild>
            <Scroll.View className="Parallax-scrollView">
              <Sheet.BleedingBackground className="Parallax-bg" />
              <Scroll.Content className="Parallax-scrollContent">
                <div className="Parallax-innerContent">
                  <div className="Parallax-hero">
            <Sheet.Outlet
              className="Parallax-heroImg"
              style={{ backgroundImage: `url(${px(3408744, 1200, 800)})` }}
              travelAnimation={{ transform: ({ tween }) => `translateY(${tween(70, 0)}px)` }}
            />
            <div className="Parallax-heroScrim" />
            <Sheet.Handle className="Parallax-handle" />
            <div className="Parallax-heroText">
              <span className="Parallax-kicker">Field report · 68°N</span>
              <Sheet.Title className="Parallax-title">Chasing the Aurora</Sheet.Title>
            </div>
          </div>
                  <div className="Parallax-body">
            <div className="Parallax-facts">
              <span>
                <IconPin size={13} /> Tromsø, Norway
              </span>
              <span>
                <IconSun size={13} /> Best Sep – Mar
              </span>
              <span>
                <IconStar size={13} /> 4.9 · 212 trips
              </span>
            </div>
            <Sheet.Description className="Parallax-desc">
              As the page rises, the cover trails behind it — a slower layer driven by the same
              travel progress, so the hero breathes while the story scrolls on top.
            </Sheet.Description>
            <p className="Parallax-p">
              The lights arrive without warning. One moment the sky is a frozen lake of stars; the
              next, green ribbons unspool from horizon to horizon, folding over themselves like
              fabric in wind.
            </p>
            <p className="Parallax-p">
              Guides here read the solar wind like a tide chart. When the KP index climbs past
              four, they kill the van's headlights, hand out the last of the coffee, and let the
              sky do the rest.
            </p>
            <div className="Parallax-gallery">
              <img src={px(572897, 400, 300)} alt="Snowy peaks under a starry sky" />
              <img src={px(1366919, 400, 300)} alt="Mountain ridge in fog" />
              <img src={px(1287145, 400, 300)} alt="Pink dusk over the range" />
            </div>
            <blockquote className="Parallax-quote">
              “Nobody tells you the aurora has a sound — a low static hush, like the sky turning
              a page.”
            </blockquote>
            <p className="Parallax-p">
              By two in the morning the show is over as suddenly as it began. The group stands in
              the snow a while longer, thermoses empty, nobody quite ready to be the first to
              speak. Some things you don't photograph. You just stand in them.
            </p>
            <p className="Parallax-p">
              The season runs from late September to early April. Dress for standing still, not
              for walking — the cold finds seams you didn't know your jacket had.
            </p>
                    <Sheet.Trigger action="close" className="Btn Btn--soft Parallax-close">
                      Back to gallery
                    </Sheet.Trigger>
                  </div>
                </div>
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
.Parallax-view {
  height: var(--velvet-100lvh);
}
.Parallax-content {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  max-width: 560px;
  background: transparent;
}
.Parallax-bg {
  top: max(10px, env(safe-area-inset-top));
  border-radius: 14px 14px 0 0;
  background: var(--cream-surface);
}
.Parallax-scrollRoot,
.Parallax-scrollView {
  width: 100%;
  height: 100%;
  scroll-behavior: smooth;
}
.Parallax-scrollRoot.Parallax-scrollView {
  scrollbar-width: none;
}
.Parallax-scrollRoot.Parallax-scrollView::-webkit-scrollbar {
  display: none;
  width: 0;
  height: 0;
}
.Parallax-scrollContent {
  box-sizing: border-box;
  width: 100%;
  min-height: 100%;
  height: auto;
  padding-top: max(10px, env(safe-area-inset-top));
  display: grid;
  place-items: start center;
}
.Parallax-innerContent {
  box-sizing: border-box;
  position: relative;
  width: 100%;
  min-height: calc(var(--velvet-100lvh) - 28px);
  display: flex;
  flex-direction: column;
  background: var(--cream-surface);
  border-radius: 14px 14px 0 0;
  overflow: hidden;
  box-shadow: 0 -12px 40px -18px rgba(0, 0, 0, 0.3);
}
.Parallax-hero {
  position: relative;
  height: 250px;
  flex: none;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-end;
}
.Parallax-heroImg {
  position: absolute;
  left: 0;
  right: 0;
  top: -60px;
  height: calc(100% + 130px);
  background-size: cover;
  background-position: center 35%;
}
.Parallax-heroScrim {
  position: absolute;
  inset: 0;
  background: linear-gradient(rgba(0, 0, 0, 0.05) 40%, rgba(0, 0, 0, 0.55));
}
.Parallax-handle {
  position: relative;
  margin: 8px auto auto;
  background: rgba(255, 255, 255, 0.65);
}
.Parallax-heroText {
  position: relative;
  width: 100%;
  box-sizing: border-box;
  padding: 0 24px 18px;
  text-align: left;
}
.Parallax-kicker {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.8);
}
.Parallax-title {
  display: block;
  position: relative;
  margin: 4px 0 0;
  color: #fff;
  font-size: 30px;
  font-weight: 800;
  letter-spacing: -0.03em;
  text-shadow: 0 2px 12px rgba(0, 0, 0, 0.3);
}
.Parallax-body {
  padding: 20px 24px 28px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.Parallax-gallery {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}
.Parallax-gallery img {
  width: 100%;
  height: 96px;
  object-fit: cover;
  border-radius: 12px;
}
.Parallax-quote {
  margin: 0;
  padding: 4px 0 4px 16px;
  border-left: 3px solid #a7f3d0;
  font-family: var(--font-serif);
  font-style: italic;
  font-size: 19px;
  line-height: 1.5;
  color: var(--ink);
}
.Parallax-facts {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.Parallax-facts span {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-strong);
  background: var(--cream-bg-2);
  border: 1px solid var(--cream-line);
  padding: 6px 11px;
  border-radius: 999px;
}
.Parallax-desc {
  margin: 0;
  font-size: 15px;
  line-height: 1.6;
  color: var(--ink-strong);
  font-weight: 500;
}
.Parallax-p {
  margin: 0;
  font-size: 14.5px;
  line-height: 1.7;
  color: var(--ink-soft);
}
.Parallax-close {
  align-self: flex-start;
  margin-top: 4px;
}
```
