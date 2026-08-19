import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  beforeLoad: () =>
    redirect({
      to: "/",
      search: { license: "open" },
      statusCode: 308,
      throw: true,
    }),
});
