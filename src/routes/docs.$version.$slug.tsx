import { createFileRoute, notFound, redirect } from "@tanstack/react-router";
import { createDocHead } from "../docs/seo.js";
import {
  docsBySlug,
  getDocPath,
  isDocsVersion,
  loadDocs,
} from "../docs/versioning.js";
import { Docs } from "../playground/Docs.jsx";

export const Route = createFileRoute("/docs/$version/$slug")({
  loader: async ({ params }) => {
    if (!isDocsVersion(params.version)) throw notFound();
    if (params.slug === "overview") {
      throw redirect({
        to: getDocPath("overview", params.version),
        statusCode: 308,
      });
    }

    const docs = await loadDocs(params.version);
    const doc = docsBySlug(docs)[params.slug];
    if (!doc) throw notFound();
    return { version: params.version, docs, doc };
  },
  head: ({ loaderData }) =>
    loaderData ? createDocHead(loaderData.version, loaderData.doc) : {},
  component: VersionedDocsPage,
});

function VersionedDocsPage() {
  const data = Route.useLoaderData();
  return (
    <Docs docs={data.docs} section={data.doc.slug} version={data.version} />
  );
}
