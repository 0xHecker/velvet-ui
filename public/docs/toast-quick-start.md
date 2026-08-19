# Toast quick start

> Render one Toaster near the application root and call toast from any client interaction.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/toast-quick-start

Render one `Toaster` near the application root. Call `toast` from any client interaction; no provider or prop drilling is required.

## Setup

```tsx
import { Toaster, toast } from "@velvetui/react/toast";
import "@velvetui/react/styles.css";

export function App() {
  return (
    <>
      <Routes />
      <Toaster position="bottom-right" />
    </>
  );
}

toast.success("Changes saved");
```

The toaster is fixed to the viewport, so it should not be placed inside a transformed or clipped product container.
