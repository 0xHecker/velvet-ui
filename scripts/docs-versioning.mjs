import {
  CURRENT_DOCS_VERSION,
  DOC_VERSIONS,
  getDocMarkdownPath,
  getDocPath,
  loadDocsSnapshot,
  resolveVersionedDocSlug,
  versionDocsHref,
} from "../src/docs/versioning.js";

const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};

const versions = DOC_VERSIONS.map((entry) => entry.version);
const currentEntries = DOC_VERSIONS.filter((entry) => entry.status === "current");

assert(DOC_VERSIONS.length > 0, "Register at least one documentation version.");
assert(new Set(versions).size === versions.length, "Documentation versions must be unique.");
assert(currentEntries.length === 1, "Exactly one documentation version must be current.");
assert(currentEntries[0]?.version === CURRENT_DOCS_VERSION, "The current version resolver must match the registry.");
assert(
  DOC_VERSIONS.every((entry) => /^\d+\.\d+\.\d+$/.test(entry.version)),
  "Every documentation version must use full semantic versioning."
);
assert(
  DOC_VERSIONS.every((entry) => ["current", "archived"].includes(entry.status)),
  "Documentation status must be current or archived."
);

for (const entry of DOC_VERSIONS) {
  const snapshot = await loadDocsSnapshot(entry.version);
  const slugs = snapshot?.docs?.map((doc) => doc.slug) || [];
  assert(snapshot?.version === entry.version, `${entry.version} snapshot metadata does not match its registry entry.`);
  assert(slugs.includes("overview"), `${entry.version} must contain an overview page.`);
  assert(new Set(slugs).size === slugs.length, `${entry.version} contains duplicate documentation slugs.`);
  assert(snapshot?.examples?.length > 0, `${entry.version} must retain its referenced example source.`);
}

assert(getDocPath("overview", "0.3.0") === "/docs/0.3.0", "Overview paths must include the version.");
assert(getDocPath("installation", "0.3.0") === "/docs/0.3.0/installation", "Guide paths must include the version.");
assert(getDocMarkdownPath("installation", "0.3.0") === "/docs/0.3.0/installation.md", "Markdown paths must include the version.");
assert(versionDocsHref("/docs/styling", "0.3.0") === "/docs/0.3.0/styling", "Internal links must stay in the selected version.");
assert(versionDocsHref("/docs/0.3.0/styling", "0.3.0") === "/docs/0.3.0/styling", "Already-versioned links must remain unchanged.");
assert(resolveVersionedDocSlug([{ slug: "overview" }], "removed-page") === "overview", "Version switching must fall back when a page does not exist.");

if (failures.length) {
  failures.forEach((failure) => console.error(`FAIL  ${failure}`));
  process.exitCode = 1;
} else {
  console.log(`PASS  documentation version registry (${versions.join(", ")})`);
}
