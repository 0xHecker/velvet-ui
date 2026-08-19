# Toast promise

> toast.promise binds an async result to one continuous feedback item with loading, success, and error states.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/toast-promise

`toast.promise` turns one asynchronous operation into one continuous feedback item. It prevents duplicate loading, success, and failure notifications.

## Bind a promise

```tsx
toast.promise(uploadPhoto(file), {
  loading: "Uploading photo…",
  success: (photo) => ({
    message: "Photo uploaded",
    description: photo.name,
  }),
  error: (error) => ({
    message: "Upload failed",
    description: error.message,
  }),
});
```

Return user-facing messages from the settled value. Log technical detail elsewhere; a toast is not a stack trace.
