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
