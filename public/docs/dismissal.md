# Dismissal

> Dismissal is configurable per view: gestures, outside press, and Escape can each be allowed, prevented, or decided at runtime.

Web: https://velvetui.co/docs/dismissal

Dismissal has three independent inputs: travel, outside interaction, and Escape. Treat them as product policy rather than assuming every overlay should close from every input.

## Policy matrix

| Input | Control |
| --- | --- |
| swipe or programmatic close destination | `dismissible` |
| outside pointer interaction | `onClickOutside` |
| Escape | `onEscapeKeyDown` |
| enabled travel directions | `tracks` |
| native rubber-band beyond the end | `swipeOvershoot` |

## Static and conditional policy

```tsx
<Sheet.View
  dismissible
  onClickOutside={{ dismiss: false }}
  onEscapeKeyDown={({ changeDefault, nativeEvent }) => {
    if (formState.isDirty) {
      changeDefault({ dismiss: false });
      announce("Save or discard your changes first");
    }
  }}
/>
```

`changeDefault` changes Velvet's default for that interaction. It does not cancel unrelated application handlers.

## Alert dialogs

Use `sheetRole="alertdialog"` only for an urgent decision. Swipe dismissal is disabled by default and the workflow should present explicit safe and destructive actions.

## Nested dismissal

Only the frontmost modal responds to Escape or outside interaction. Closing it restores focus to its opener inside the previous layer; closing the last layer restores focus to the page trigger.
