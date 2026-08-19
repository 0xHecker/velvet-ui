export const DOC_VERSIONS = Object.freeze([
  {
    version: "0.3.0",
    label: "0.3.0",
    status: "current",
  },
]);

export const CURRENT_DOCS_VERSION =
  DOC_VERSIONS.find((entry) => entry.status === "current")?.version ||
  DOC_VERSIONS[0]?.version;

const versionIds = new Set(DOC_VERSIONS.map((entry) => entry.version));
const snapshotPromises = new Map();

export const isDocsVersion = (version) => versionIds.has(version);

export const getDocsVersion = (version) =>
  DOC_VERSIONS.find((entry) => entry.version === version) || null;

export const loadDocsSnapshot = async (version = CURRENT_DOCS_VERSION) => {
  if (!isDocsVersion(version)) return null;

  if (!snapshotPromises.has(version)) {
    snapshotPromises.set(
      version,
      import(`./versions/${version}.generated.js`).then((module) => module.default)
    );
  }

  return snapshotPromises.get(version);
};

export const loadDocs = async (version = CURRENT_DOCS_VERSION) =>
  (await loadDocsSnapshot(version))?.docs || [];

export const getDocPath = (slug = "overview", version = CURRENT_DOCS_VERSION) =>
  slug === "overview" ? `/docs/${version}` : `/docs/${version}/${slug}`;

export const getLegacyDocPath = (slug = "overview") =>
  slug === "overview" ? "/docs" : `/docs/${slug}`;

export const getDocMarkdownPath = (
  slug = "overview",
  version = CURRENT_DOCS_VERSION
) => `/docs/${version}/${slug}.md`;

const VERSIONED_DOCS_PATH = /^\/docs\/\d+\.\d+\.\d+(?:\/|$)/;

export const versionDocsHref = (href, version = CURRENT_DOCS_VERSION) => {
  if (!href?.startsWith("/docs") || VERSIONED_DOCS_PATH.test(href)) return href;
  if (href === "/docs" || href === "/docs/") return getDocPath("overview", version);
  return `/docs/${version}/${href.slice("/docs/".length)}`;
};

export const versionMarkdownLinks = (markdown, version = CURRENT_DOCS_VERSION) =>
  markdown.replace(
    /\]\((\/docs(?:\/[^)\s]+)?)\)/g,
    (_match, href) => `](${versionDocsHref(href, version)})`
  );

export const SITE_ORIGIN = "https://velvetui.co";

export const docToMarkdown = (doc, version = CURRENT_DOCS_VERSION) => `# ${doc.title}

> ${doc.description}

Documentation version: ${version}

Web: ${SITE_ORIGIN}${getDocPath(doc.slug, version)}

${versionMarkdownLinks(doc.guide, version)}
`;

export const docsBySlug = (docs) =>
  Object.fromEntries(docs.map((doc) => [doc.slug, doc]));

export const resolveVersionedDocSlug = (docs, preferredSlug) =>
  docs.some((doc) => doc.slug === preferredSlug) ? preferredSlug : "overview";

export const docsGroups = (docs) =>
  Object.entries(
    docs.reduce((groups, doc) => {
      (groups[doc.group] ||= []).push(doc);
      return groups;
    }, {})
  );
