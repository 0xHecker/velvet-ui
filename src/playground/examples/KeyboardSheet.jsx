import { Scroll, Sheet } from "../../velvet/index.js";
import { px } from "../px.js";
import { IconMessage, IconSend } from "../icons.jsx";
import "./KeyboardSheet.css";

export const KeyboardSheet = () => (
  <Sheet.Root>
    <Sheet.Trigger className="Btn">
      <IconMessage /> Open conversation
    </Sheet.Trigger>
    <Sheet.Portal>
      <Sheet.View className="Keyboard-view" nativeEdgeSwipePrevention>
        <Sheet.Backdrop travelAnimation={{ opacity: ({ progress }) => progress * 0.4 }} />
        <Sheet.Content className="Keyboard-content" asChild>
          <Scroll.Root className="Keyboard-scrollRoot" asChild>
            <Scroll.View className="Keyboard-scrollView">
              <Scroll.Content className="Keyboard-scrollContent">
                <div className="Keyboard-innerContent">
                  <Sheet.BleedingBackground className="Keyboard-bg" />
                  <Sheet.Handle className="Keyboard-handle" />
                  <div className="Keyboard-body">
                    <div className="Keyboard-threadHead">
                      <img src={px(733872, 96, 96)} alt="Ava Laurent" />
                      <div>
                        <Sheet.Title className="Keyboard-title">Ava Laurent</Sheet.Title>
                        <span className="Keyboard-status">Online — replies fast</span>
                      </div>
                    </div>

                    <div className="Keyboard-thread">
                      <div className="Keyboard-bubble Keyboard-bubble--in">
                        Did you see the new gallery? The booking sheet feels straight out of iOS.
                      </div>
                      <div className="Keyboard-bubble Keyboard-bubble--out">
                        Just tried it — the swipe-down momentum is unreal.
                      </div>
                      <div className="Keyboard-bubble Keyboard-bubble--in">
                        Right? And the composer never hides under the keyboard.
                      </div>
                    </div>

                    <div className="Keyboard-composer">
                      <input className="Keyboard-input" placeholder="Message Ava…" aria-label="Message Ava" />
                      <Sheet.Trigger action="dismiss" className="Keyboard-send" aria-label="Send">
                        <IconSend size={16} />
                      </Sheet.Trigger>
                    </div>
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
