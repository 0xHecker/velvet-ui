import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/pricing")({
  beforeLoad: () => redirect({ href: "/?license=open", statusCode: 308, throw: true }),
});
