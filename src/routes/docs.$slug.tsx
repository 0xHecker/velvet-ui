import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createDocHead, createDocsOverviewHead } from "../docs/seo.js";
import {
  CURRENT_DOCS_VERSION,
  docsBySlug,
  getDocPath,
  isDocsVersion,
  loadDocs,
} from "../docs/versioning.js";
import { Docs } from "../playground/Docs.jsx";

export const Route = createFileRoute("/docs/$slug")({
  loader: async ({ params }) => {
    if (isDocsVersion(params.slug)) {
      const docs = await loadDocs(params.slug);
      const doc = docsBySlug(docs).overview;
      if (!doc) throw notFound();
      return { version: params.slug, docs, doc, overview: true };
    }

    const docs = await loadDocs(CURRENT_DOCS_VERSION);
    const doc = docsBySlug(docs)[params.slug];
    if (!doc) throw notFound();
    throw redirect({
      to: getDocPath(doc.slug, CURRENT_DOCS_VERSION),
      statusCode: 308,
    });
  },
  head: ({ loaderData }) =>
    loaderData?.overview
      ? createDocsOverviewHead(loaderData.version, loaderData.docs)
      : loaderData
        ? createDocHead(loaderData.version, loaderData.doc)
        : {},
  component: DocsPage,
});

function DocsPage() {
  const data = Route.useLoaderData();
  return (
    <Docs docs={data.docs} section={data.doc.slug} version={data.version} />
  );
}
