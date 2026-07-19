import { Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconCalendar, IconChevronR, IconHeart, IconPin, IconShare, IconStar, IconUsers } from "../icons.jsx";
import "./BottomSheet.css";

export const BottomSheet = () => (
  <Sheet.Root license="commercial">
    <Sheet.Trigger className="Btn">
      View stay <IconChevronR />
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Booking-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop themeColorDimming="auto" travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
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
                <Sheet.Trigger action="dismiss" className="Btn Btn--primary Booking-reserve">
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
