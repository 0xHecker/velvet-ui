import { createFileRoute, notFound } from "@tanstack/react-router";
import { ERROR_GUIDES, ErrorGuide } from "../site/ErrorGuide.jsx";
import { createSeoHead, SEO_IMAGES } from "../site/seo";

export const Route = createFileRoute("/errors/$slug")({
  loader: ({ params }) => {
    const guide = ERROR_GUIDES[params.slug as keyof typeof ERROR_GUIDES];
    if (!guide) throw notFound();
    return guide;
  },
  head: ({ loaderData, params }) => {
    const guide =
      loaderData ?? ERROR_GUIDES[params.slug as keyof typeof ERROR_GUIDES];
    if (!guide) return {};
    return createSeoHead({
      title: `${guide.code} — Velvet UI diagnostic`,
      description: guide.summary,
      path: `/errors/${params.slug}`,
      image: SEO_IMAGES.docs,
      imageAlt: "Velvet UI composition diagnostic guidance.",
      type: "article",
    });
  },
  component: ErrorRoute,
});

function ErrorRoute() {
  return <ErrorGuide guide={Route.useLoaderData()} />;
}
