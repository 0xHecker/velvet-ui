# Dismissal

> Dismissal is configurable per view: gestures, outside press, and Escape can each be allowed, prevented, or decided at runtime.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/dismissal

Dismissal has three independent inputs—travel, outside interaction, and Escape—and four observable phases: request, controlled commit, exit start, and exit completion. Treat each as product policy rather than assuming every overlay should close from every input.

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

## Async request gate

```tsx
<Sheet.Root
  open={open}
  onDismissRequest={async ({ reason }) => {
    if (!draft.dirty) return true;
    const saved = await saveDraft();
    if (!saved) announce("Draft could not be saved");
    return saved;
  }}
  onOpenChange={(next, detail) => {
    setOpen(next);
    logDismissal(detail.reason);
  }}
  onExitComplete={clearEditorSession}
>
  ...
</Sheet.Root>
```

While a promise is pending, repeated requests coalesce and the View exposes `data-velvet-dismiss-pending="true"`. Rejection restores an attempted native swipe to its prior detent.

## Alert dialogs

Use `sheetRole="alertdialog"` only for an urgent decision. Swipe dismissal is disabled by default and the workflow should present explicit safe and destructive actions.

## Nested dismissal

Only the frontmost modal responds to Escape or outside interaction. Closing it restores focus to its opener inside the previous layer; closing the last layer restores focus to the page trigger.
