# Toast variants

> Toast variants cover neutral, success, error, warning, info, loading, action, promise, and custom JSX states.

Web: https://velvetui.co/docs/toast-variants

Variants communicate meaning, not decoration. Use the neutral default for ordinary feedback and reserve warning or error color for states that need attention.

## Available variants

```tsx
toast("Draft saved");
toast.success("Published");
toast.error("Could not publish");
toast.warning("Connection is unstable");
toast.info("A new version is available");

const id = toast.loading("Uploading…");
toast.success("Uploaded", { id });
```

Reusing an id updates a toast in place. This is better than stacking loading and completion messages for the same operation.
