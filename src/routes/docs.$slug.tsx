import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { DOC_BY_SLUG } from "../docs/catalog.js";
import { Docs } from "../playground/Docs.jsx";
import { absoluteUrl, breadcrumbSchema, createSeoHead, SEO_IMAGES, SITE_ORIGIN } from "../site/seo";

export const Route = createFileRoute("/docs/$slug")({
  beforeLoad: ({ params }) => {
    if (params.slug === "overview") {
      throw redirect({ href: "/docs", statusCode: 308 });
    }
  },
  loader: ({ params }) => {
    const doc = DOC_BY_SLUG[params.slug];
    if (!doc) throw notFound();
    return doc;
  },
  head: ({ loaderData, params }) => {
    const doc = loaderData ?? DOC_BY_SLUG[params.slug];
    if (!doc) return {};
    const title = `${doc.title} — Velvet UI React Docs`;
    const path = `/docs/${doc.slug}`;

    return createSeoHead({
      title,
      description: doc.description,
      path,
      image: SEO_IMAGES.docs,
      imageAlt: "Layered Velvet UI documentation pages and interface panels.",
      type: "article",
      jsonLd: [
        {
          "@context": "https://schema.org",
          "@type": "TechArticle",
          "@id": `${absoluteUrl(path)}#article`,
          headline: doc.title,
          description: doc.description,
          url: absoluteUrl(path),
          inLanguage: "en",
          articleSection: doc.group,
          mainEntityOfPage: absoluteUrl(path),
          isPartOf: { "@id": `${SITE_ORIGIN}/docs#webpage` },
          image: absoluteUrl(SEO_IMAGES.docs),
          author: { "@type": "Person", name: "Sai Shanmukh" },
          publisher: { "@id": `${SITE_ORIGIN}/#organization` },
        },
        breadcrumbSchema([
          { name: "Velvet UI", path: "/" },
          { name: "Documentation", path: "/docs" },
          { name: doc.title, path },
        ]),
      ],
    });
  },
  component: DocsPage,
});

function DocsPage() {
  return <Docs section={Route.useLoaderData().slug} />;
}
