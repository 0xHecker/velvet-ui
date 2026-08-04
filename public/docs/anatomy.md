# Anatomy

> The primitive tree separates state, trigger, portal, view, backdrop, content, and accessible labels.

Web: https://velvetui.co/docs/anatomy

The parts are separate so styling and composition can change without rewriting gesture, focus, and modality behavior.

## Primitive tree

```tsx
<Sheet.Root>
  <Sheet.Trigger>Open</Sheet.Trigger>
  <Sheet.Portal>
    <Sheet.View side="bottom">
      <Sheet.Backdrop />
      <Sheet.Content>
        <Sheet.Handle />
        <Sheet.Title>Account</Sheet.Title>
        <Sheet.Description>Manage your profile.</Sheet.Description>
        <Sheet.Close>Done</Sheet.Close>
      </Sheet.Content>
    </Sheet.View>
  </Sheet.Portal>
</Sheet.Root>
```

- `Root` owns open and snap state.
- `Trigger`, `Close`, and `Step` express actions.
- `View` owns tracks, gestures, modality, and travel.
- `Backdrop` handles dimming and outside interaction.
- `Content` is the authored surface.
- `Outlet` animates UI outside the portal.

## What must remain intact

Forward refs through custom children, keep the real scroll element identifiable, and render `Title` even when it is visually hidden. Those three details prevent most integration failures.
