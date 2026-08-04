# Accessibility

> Modal sheets apply dialog semantics, focus management, Escape handling, inert background treatment, and focus restoration.

Web: https://velvetui.co/docs/accessibility

Velvet supplies dialog semantics and interaction infrastructure, but accessible product copy and workflow remain application responsibilities.

## What Velvet handles

- `dialog` or `alertdialog` role.
- Accessible naming from Sheet.Title and description from Sheet.Description.
- Modal focus containment and focus restoration.
- Background inertness and scroll locking for modal sheets.
- Escape and outside-interaction policy.
- Frontmost ownership in nested stacks.
- Reduced-motion settlement.
- Keyboard-operable Trigger, Close, Step, and Handle controls.

## What you must provide

- A meaningful title for every surface, visually hidden when necessary.
- A description when the consequence is not obvious from the title.
- Visible focus styles in your theme.
- A reachable close or completion action.
- Form errors connected to their controls.
- Alternative text and captions for meaningful media.
- Correct action labels; avoid unlabeled icon buttons.

```tsx
<Sheet.Content>
  <VisuallyHidden.Root asChild>
    <Sheet.Title>Command palette</Sheet.Title>
  </VisuallyHidden.Root>
  <Sheet.Description>Search commands and recent pages.</Sheet.Description>
  <AutoFocusTarget asChild>
    <input aria-label="Search commands" />
  </AutoFocusTarget>
  <Sheet.Close aria-label="Close command palette">×</Sheet.Close>
</Sheet.Content>
```

## Dialog versus alert dialog

`sheetRole="dialog"` is the ordinary default. Use `alertdialog` only when immediate attention is required and a decision blocks the workflow. Alert dialogs reject swipe dismissal by default; provide explicit actions and do not turn dismissal back on casually.

## Non-modal sheets

PersistentSheet defaults to `modal={false}` so the page remains operable. Do not add a backdrop that visually implies blocked content unless interactions are actually blocked. Keep the collapsed control in a predictable tab position.

## Manual test

Open with Enter and Space, tab through every control, reverse with Shift+Tab, operate detents from the keyboard, test Escape policy, close, and confirm focus returns to the trigger. Repeat with a screen reader, 200% zoom, reduced motion, and ten nested layers.
