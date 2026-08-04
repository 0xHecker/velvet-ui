# Stacked Sheets homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
import { Sheet, SheetStack } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconBag, IconChevronR, IconHeart, IconStar } from "../icons.jsx";
import "./StackedSheets.css";

const SIZES = ["7", "7.5", "8", "8.5", "9", "9.5", "10", "10.5", "11", "12"];

export const StackedSheets = () => (
  <SheetStack.Root>
    <Sheet.Root>
      <Sheet.Trigger className="Btn">
        <IconBag /> Open product
      </Sheet.Trigger>
      <Sheet.Portal>
        <Sheet.View className="Stack-view">
          <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.2] }} />
          <Sheet.Content
            className="Stack-content"
            stackingAnimation={{
              translateY: ({ progress }) =>
                progress <= 1
                  ? `${progress * -10}px`
                  : `calc(-12.5px + 2.5px * ${progress})`,
              scale: [1, 0.933],
              transformOrigin: "50% 0",
            }}
          >
            <Sheet.BleedingBackground className="Stack-bg" />
            <Sheet.Handle className="Stack-handle" />
            <div className="Stack-hero">
              <img src={px(1598505, 900, 640)} alt="Retro high-top sneakers" />
              <button className="Stack-like" aria-label="Save to wishlist">
                <IconHeart size={16} />
              </button>
            </div>
            <div className="Stack-body">
              <div className="Stack-titleRow">
                <div>
                  <Sheet.Title className="Stack-title">Retro High OG</Sheet.Title>
                  <Sheet.Description className="Stack-sub">Sail / University Gold</Sheet.Description>
                </div>
                <div className="Stack-priceCol">
                  <span className="Stack-rating">
                    <IconStar size={13} /> 4.9
                  </span>
                  <strong className="Stack-price">$180</strong>
                </div>
              </div>
              <div className="Stack-colors" aria-label="Colorways">
                <i data-on="true" style={{ background: "#e8e4dc" }} />
                <i style={{ background: "#1f2937" }} />
                <i style={{ background: "#c4b5fd" }} />
                <i style={{ background: "#fca5a5" }} />
              </div>
              <p className="Stack-copy">
                The 1985 original, rebuilt with premium leather and a cushioned cupsole. Free
                shipping over $150 — returns within 30 days, no questions.
              </p>
              <Sheet.Root>
                <Sheet.Trigger className="Btn Btn--primary Stack-cta Stack-cta--bottom">
                  Select size <IconChevronR size={15} />
                </Sheet.Trigger>
                <Sheet.Portal>
                  <Sheet.View className="Stack-view">
                    <Sheet.Backdrop travelAnimation={{ opacity: [0, 0.2] }} />
                    <Sheet.Content className="Stack-content">
                      <Sheet.BleedingBackground className="Stack-bg" />
                      <Sheet.Handle className="Stack-handle" />
                      <div className="Stack-body Stack-body--fill">
                        <div className="Stack-sizeHead">
                          <div>
                            <Sheet.Title className="Stack-title">Select size</Sheet.Title>
                            <Sheet.Description className="Stack-sub">
                              US men’s — the product sheet waits behind this one.
                            </Sheet.Description>
                          </div>
                          <img className="Stack-sizeThumb" src={px(1598505, 160, 160)} alt="" />
                        </div>
                        <div className="Stack-sizes">
                          {SIZES.map((s, i) => (
                            <button key={s} className="Stack-size" data-suggested={i === 4 || undefined}>
                              {s}
                            </button>
                          ))}
                        </div>
                        <div className="Stack-fitRow">
                          <span className="Stack-fitLabel">Fit</span>
                          <span className="Stack-fitValue">True to size — order your usual</span>
                        </div>
                        <div className="Stack-fitRow">
                          <span className="Stack-fitLabel">Delivery</span>
                          <span className="Stack-fitValue">Free — arrives Thu, Nov 14</span>
                        </div>
                        <div className="Stack-fitNote">
                          <span data-dot="green">In stock — ships today</span>
                          <span>Size guide</span>
                        </div>
                        <Sheet.Trigger action="close" className="Btn Btn--primary Stack-cta Stack-cta--bottom">
                          Add to bag · $180
                        </Sheet.Trigger>
                      </div>
                    </Sheet.Content>
                  </Sheet.View>
                </Sheet.Portal>
              </Sheet.Root>
            </div>
          </Sheet.Content>
        </Sheet.View>
      </Sheet.Portal>
    </Sheet.Root>
  </SheetStack.Root>
);
```

## CSS

```css
.Stack-view {
  height: var(--velvet-100lvh);
}
.Stack-content {
  box-sizing: border-box;
  width: 100%;
  max-width: 520px;
  height: min(530px, calc(var(--velvet-100lvh) - 48px));
  padding: 10px 0 calc(22px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  transform-origin: 50% 0;
}
.Stack-bg {
  border-radius: 24px 24px 0 0;
  background: var(--cream-surface);
  box-shadow: 0 -20px 50px -20px rgba(60, 45, 30, 0.22);
}
.Stack-handle {
  margin: 8px auto 14px;
  background: #d8dce2;
}
.Stack-hero {
  position: relative;
  margin: 0 16px;
  border-radius: 18px;
  overflow: hidden;
  background: #f3f4f6;
}
.Stack-hero img {
  display: block;
  width: 100%;
  height: 228px;
  object-fit: cover;
}
.Stack-like {
  position: absolute;
  right: 12px;
  top: 12px;
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
.Stack-like:active {
  transform: scale(0.88);
}
.Stack-body {
  flex: 1;
  display: flex;
  flex-direction: column;
  padding: 16px 22px 0;
}
.Stack-cta--bottom {
  margin-top: auto;
}
.Stack-sizeHead {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}
.Stack-sizeThumb {
  flex: none;
  width: 56px;
  height: 56px;
  border-radius: 13px;
  object-fit: cover;
}
.Stack-fitRow {
  display: flex;
  gap: 14px;
  padding: 11px 2px;
  border-top: 1px solid var(--cream-line);
  font-size: 13.5px;
}
.Stack-sizes + .Stack-fitRow {
  margin-top: 16px;
}
.Stack-fitLabel {
  width: 64px;
  flex: none;
  font-weight: 700;
  color: var(--ink);
}
.Stack-fitValue {
  color: var(--ink-soft);
}
.Stack-titleRow {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 14px;
}
.Stack-title {
  margin: 0;
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Stack-sub {
  margin: 4px 0 0;
  font-size: 14px;
  color: var(--ink-soft);
}
.Stack-priceCol {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 3px;
}
.Stack-rating {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12.5px;
  font-weight: 700;
  color: var(--ink-strong);
}
.Stack-rating svg {
  color: #f59e0b;
}
.Stack-price {
  font-size: 19px;
  font-weight: 800;
  letter-spacing: -0.02em;
  color: var(--ink);
}
.Stack-colors {
  display: flex;
  gap: 8px;
  margin-top: 14px;
}
.Stack-colors i {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  border: 1px solid rgba(2, 6, 23, 0.08);
  cursor: pointer;
}
.Stack-colors i[data-on] {
  box-shadow: 0 0 0 2px var(--cream-surface), 0 0 0 4px var(--ink);
}
.Stack-copy {
  margin: 12px 0 0;
  font-size: 13.5px;
  line-height: 1.55;
  color: var(--ink-soft);
}
.Stack-fitNote {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-top: 12px;
  font-size: 13px;
  color: var(--ink-soft);
}
.Stack-fitNote [data-dot="green"] {
  display: inline-flex;
  align-items: center;
  gap: 7px;
  color: #15803d;
  font-weight: 600;
}
.Stack-fitNote [data-dot="green"]::before {
  content: "";
  width: 7px;
  height: 7px;
  border-radius: 999px;
  background: #22c55e;
}
.Stack-fitNote span:last-child {
  text-decoration: underline;
  cursor: pointer;
}
.Stack-cta {
  width: 100%;
  padding: 13px;
  border-radius: 14px;
  font-size: 15.5px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 7px;
}
.Stack-cta:not(.Stack-cta--bottom) {
  margin-top: 18px;
}
.Stack-sizes {
  display: grid;
  grid-template-columns: repeat(5, 1fr);
  gap: 8px;
  margin-top: 16px;
}
.Stack-size {
  appearance: none;
  font: inherit;
  font-size: 14.5px;
  font-weight: 600;
  color: var(--ink);
  background: var(--cream-surface);
  border: 1px solid var(--cream-line);
  border-radius: 11px;
  padding: 11px 0;
  cursor: pointer;
  transition: border-color 140ms ease, background 140ms ease, transform 140ms var(--ease);
}
.Stack-size:hover {
  border-color: var(--ink);
}
.Stack-size:active {
  transform: scale(0.94);
}
.Stack-size[data-suggested] {
  border-color: var(--ink);
  background: var(--ink);
  color: #fff;
}
```
