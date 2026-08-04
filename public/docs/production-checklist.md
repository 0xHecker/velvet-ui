# Production checklist

> A manual release checklist for state, gestures, scroll, mobile keyboards, accessibility, arbitrary-depth stacks, portals, and bundle cost.

Web: https://velvetui.co/docs/production-checklist

Run this checklist before shipping a sheet family. It catches the failures that unit snapshots miss: ownership, scroll handoff, mobile viewport changes, focus, stacking, and visual end states.

## State and actions

- Test controlled and uncontrolled open state.
- If `snap` is controlled, update it from `onSnapChange`.
- Confirm actions are enabled on the first paint; do not wait for animation state to make the trigger usable.
- Verify rapid open-close-open does not leave stale inertness or a backdrop.
- Verify programmatic close and gesture close produce the same final state.

## Gestures and scroll

- Slow drag, fast flick, cancelled drag, and direction reversal.
- Scroll content to the middle: the sheet must not steal the gesture.
- Scroll to the dismissal boundary: the next outward drag must transfer naturally.
- Test mouse wheel, trackpad rubber-band, touch, keyboard paging, and scrollbar dragging.
- Confirm the native runway never becomes the visible product scrollbar.

## Mobile viewport and keyboard

- Small phone in portrait and landscape.
- Browser chrome expanded and collapsed.
- Bottom safe area and Android navigation area.
- Focus the first, middle, and last input.
- Composer and primary action remain visible above the keyboard.
- Rotate or resize with the keyboard open.
- Close the keyboard without closing the sheet, then dismiss the sheet.

## Accessibility

- Unique title and optional useful description.
- Enter, Space, Escape, Tab, Shift+Tab, arrow and detent controls.
- Focus enters the front sheet and returns to the correct trigger.
- Background is inert only for modal sheets.
- Alert dialogs cannot disappear through an accidental swipe.
- Reduced motion settles immediately without missing content.

## Stacks and portals

- Open at least three ordinary sheets and ten Depth Sheets.
- Only the front layer reacts to Escape and outside interaction.
- Every underlying layer stays visually bounded.
- Third-party menus, date pickers, and tooltips remain interactive through ExternalOverlay.
- Closing several layers restores focus in reverse order without jumping to the page.

## Performance

- Inspect the production bundle and import focused subpaths.
- Keep continuous travel work outside React state.
- Avoid simultaneous CSS and Velvet animation of the same transform.
- Check for layout reads in application callbacks.
- Confirm composition CSS is loaded once and in stable order.
