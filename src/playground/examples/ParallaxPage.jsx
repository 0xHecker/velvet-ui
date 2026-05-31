import { Sheet } from "../../velvet/index.js";
import "./ParallaxPage.css";

export const ParallaxPage = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">Open Parallax Page</Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Parallax-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.25 }} />
        <Sheet.Content className="Parallax-content">
          <div className="Parallax-hero">
            <Sheet.Outlet
              className="Parallax-heroImg"
              travelAnimation={{ transform: ({ tween }) => `translateY(${tween(70, 0)}px)` }}
            />
            <Sheet.Handle className="Parallax-handle" />
            <Sheet.Title className="Parallax-title">Mountain Pass</Sheet.Title>
          </div>
          <div className="Parallax-body">
            <Sheet.Description className="Parallax-desc">
              As the page rises, the cover image trails behind it — a slower parallax layer driven by
              the same travel progress, giving the page real depth.
            </Sheet.Description>
            <Sheet.Trigger action="dismiss" className="Btn Btn--soft">
              Close
            </Sheet.Trigger>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
