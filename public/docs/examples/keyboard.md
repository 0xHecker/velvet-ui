# Keyboard-Aware Sheet homepage demo source

> This file is generated from the exact JSX and CSS used by the live homepage card. It is a complete implementation reference, not a zero-edit starter: replace playground icons and images with your own assets, then change the local Velvet import to the package subpath shown in the guide.

Web guide: https://velvetui.co/docs/gallery-recipes

## JSX

```jsx
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
                      <Sheet.Trigger action="close" className="Keyboard-send" aria-label="Send">
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
```

## CSS

```css
.Keyboard-view {
  height: var(--velvet-100lvh);
}
.Keyboard-content {
  box-sizing: border-box;
  width: 100%;
  max-width: 560px;
  max-height: 100%;
}
.Keyboard-scrollRoot,
.Keyboard-scrollView {
  width: 100%;
}
.Keyboard-scrollContent {
  width: 100%;
}
.Keyboard-innerContent {
  position: relative;
  isolation: isolate;
  width: 100%;
  padding: 10px 22px calc(20px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  align-items: center;
}
.Keyboard-bg {
  border-radius: 24px 24px 0 0;
  background: var(--cream-surface);
  box-shadow: 0 -20px 50px -20px rgba(0, 0, 0, 0.2);
}
.Keyboard-handle {
  margin: 6px auto 14px;
  background: var(--grabber);
}
.Keyboard-body {
  width: 100%;
  max-width: 460px;
}
.Keyboard-threadHead {
  display: flex;
  align-items: center;
  gap: 11px;
  padding-bottom: 14px;
  border-bottom: 1px solid var(--cream-line);
}
.Keyboard-threadHead img {
  width: 40px;
  height: 40px;
  border-radius: 999px;
  object-fit: cover;
}
.Keyboard-threadHead div {
  display: flex;
  flex-direction: column;
}
.Keyboard-title {
  margin: 0;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: -0.01em;
  color: var(--ink);
}
.Keyboard-status {
  font-size: 12.5px;
  color: #16a34a;
  font-weight: 500;
}
.Keyboard-thread {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 14px 0;
}
.Keyboard-bubble {
  max-width: 78%;
  font-size: 14.5px;
  line-height: 1.45;
  padding: 9px 13px;
  border-radius: 18px;
}
.Keyboard-bubble--in {
  align-self: flex-start;
  background: var(--cream-bg-2);
  color: var(--ink);
  border-bottom-left-radius: 6px;
}
.Keyboard-bubble--out {
  align-self: flex-end;
  background: var(--ink);
  color: #fff;
  border-bottom-right-radius: 6px;
}
.Keyboard-composer {
  display: flex;
  gap: 10px;
  align-items: center;
}
.Keyboard-input {
  flex: 1;
  appearance: none;
  border: 1px solid var(--cream-line);
  background: var(--cream-bg);
  border-radius: 999px;
  padding: 11px 17px;
  font: inherit;
  font-size: 15px;
  color: var(--ink);
  outline: none;
  transition: border-color 160ms ease, box-shadow 160ms ease;
}
.Keyboard-input:focus {
  border-color: var(--ink);
  box-shadow: 0 0 0 3px rgba(3, 7, 18, 0.08);
}
.Keyboard-send {
  flex: none;
  appearance: none;
  border: none;
  width: 42px;
  height: 42px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  background: var(--ink);
  color: #fff;
  cursor: pointer;
  transition: transform 160ms var(--ease), background 160ms ease;
}
.Keyboard-send:hover {
  background: #1f2937;
}
.Keyboard-send:active {
  transform: scale(0.9);
}
```
