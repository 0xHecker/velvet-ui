import { createFileRoute, redirect } from "@tanstack/react-router";
import { CURRENT_DOCS_VERSION, getDocPath } from "../docs/versioning.js";

export const Route = createFileRoute("/docs/")({
  beforeLoad: () => {
    throw redirect({
      to: getDocPath("overview", CURRENT_DOCS_VERSION),
      statusCode: 308,
    });
  },
});
