# Bottom Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Sheet, ThemeBackdrop } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconCalendar, IconChevronR, IconHeart, IconPin, IconShare, IconStar, IconUsers } from "../icons.jsx";
import "./BottomSheet.css";

export const BottomSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      View stay <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Booking-view" nativeEdgeSwipePrevention>
        <ThemeBackdrop themeColor="auto" travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Booking-content">
          <Sheet.BleedingBackground className="Booking-bg" />
          <Sheet.Handle className="Booking-handle" />
          <div className="Booking-scroll">
            <div className="Booking-hero">
              <img className="Booking-img" src={px(248797, 1080, 620)} alt="Kaelani Beach House" />
              <span className="Booking-badge">Guest favorite</span>
              <div className="Booking-heroActions">
                <button className="Booking-roundBtn" aria-label="Share">
                  <IconShare size={16} />
                </button>
                <button className="Booking-roundBtn" aria-label="Save to wishlist">
                  <IconHeart size={16} />
                </button>
              </div>
            </div>

            <div className="Booking-body">
              <div className="Booking-titleRow">
                <Sheet.Title className="Booking-title">Kaelani Beach House</Sheet.Title>
                <span className="Booking-rating">
                  <IconStar size={14} /> 4.97
                </span>
              </div>
              <Sheet.Description className="Booking-loc">
                <IconPin size={14} /> Tulum, Mexico · Entire villa hosted by Marisol
              </Sheet.Description>

              <div className="Booking-facts">
                <div className="Booking-fact">
                  <IconCalendar size={16} />
                  <div>
                    <strong>Nov 12 – 17</strong>
                    <span>5 nights</span>
                  </div>
                </div>
                <div className="Booking-fact">
                  <IconUsers size={16} />
                  <div>
                    <strong>4 guests</strong>
                    <span>2 bedrooms</span>
                  </div>
                </div>
              </div>

              <div className="Booking-priceRow">
                <div className="Booking-price">
                  <strong>$248</strong> night
                  <span className="Booking-total">$1,412 total after taxes</span>
                </div>
                <Sheet.Trigger action="close" className="Btn Btn--primary Booking-reserve">
                  Reserve
                </Sheet.Trigger>
              </div>
              <p className="Booking-note">Free cancellation for 48 hours — swipe down anytime to keep browsing.</p>
            </div>
          </div>
        </Sheet.Content>
      </Sheet.View>
    </Sheet.Portal>
  </Sheet.Root>
);
```

## CSS

```css
.Booking-view {
  height: var(--velvet-100lvh);
}
.Booking-content {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  padding: 10px 0 calc(20px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
}
.Booking-bg {
  border-radius: 28px 28px 0 0;
  background: var(--cream-surface);
  box-shadow:
    0 -0.5px 0 0 rgba(60, 50, 38, 0.06),
    0 -20px 50px -20px rgba(60, 45, 30, 0.18);
}
.Booking-handle {
  margin: 8px auto 14px;
  background: #d8dce2;
}
.Booking-scroll {
  /* No inner scroller — the sheet's own unified scroll carries both the
     content and the swipe-to-dismiss gesture. */
}
.Booking-hero {
  position: relative;
  margin: 0 16px;
  border-radius: 20px;
  overflow: hidden;
}
.Booking-img {
  display: block;
  width: 100%;
  height: 218px;
  object-fit: cover;
}
.Booking-badge {
  position: absolute;
  left: 12px;
  top: 12px;
  font-size: 12px;
  font-weight: 700;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  padding: 6px 11px;
  border-radius: 999px;
  box-shadow: 0 4px 14px -4px rgba(2, 6, 23, 0.25);
}
.Booking-heroActions {
  position: absolute;
  right: 12px;
  top: 12px;
  display: flex;
  gap: 8px;
}
.Booking-roundBtn {
  appearance: none;
  border: none;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  color: var(--ink);
  background: rgba(255, 255, 255, 0.92);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
  box-shadow: 0 4px 14px -4px rgba(2, 6, 23, 0.25);
  cursor: pointer;
  transition: transform 160ms var(--ease);
}
.Booking-roundBtn:active {
  transform: scale(0.9);
}
.Booking-body {
  padding: 18px 24px 0;
}
.Booking-titleRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}
.Booking-title {
  margin: 0;
  font-size: 21px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Booking-rating {
  flex: none;
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  font-weight: 700;
  color: var(--ink);
}
.Booking-rating svg {
  color: #f59e0b;
}
.Booking-loc {
  display: flex;
  align-items: center;
  gap: 5px;
  margin: 6px 0 0;
  font-size: 14px;
  color: var(--ink-soft);
}
.Booking-facts {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 10px;
  margin-top: 16px;
}
.Booking-fact {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid var(--cream-line);
  border-radius: 14px;
  color: var(--ink);
}
.Booking-fact div {
  display: flex;
  flex-direction: column;
  min-width: 0;
}
.Booking-fact strong {
  font-size: 14px;
  font-weight: 700;
}
.Booking-fact span {
  font-size: 12.5px;
  color: var(--ink-soft);
}
.Booking-priceRow {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-top: 18px;
  padding-top: 16px;
  border-top: 1px solid var(--cream-line);
}
.Booking-price {
  font-size: 14px;
  color: var(--ink-soft);
}
.Booking-price strong {
  font-size: 20px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
  margin-right: 4px;
}
.Booking-total {
  display: block;
  font-size: 12.5px;
  text-decoration: underline;
  margin-top: 2px;
}
.Booking-reserve {
  flex: none;
  padding: 13px 34px;
  border-radius: 14px;
  font-size: 16px;
}
.Booking-note {
  margin: 12px 0 4px;
  font-size: 13px;
  text-align: center;
  color: var(--ink-soft);
}
```
