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
          <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
          <Sheet.Content
            className="Stack-content"
            stackingAnimation={{
              transform: ({ tween }) => `scale(${tween(1, 0.92)}) translateY(${tween(0, -22)}px)`,
              filter: ({ tween }) => `brightness(${tween(1, 0.84)})`,
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
                    <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.3 }} />
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
                        <Sheet.Trigger action="dismiss" className="Btn Btn--primary Stack-cta Stack-cta--bottom">
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
