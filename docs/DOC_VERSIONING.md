# Documentation versioning

Velvet UI documentation uses explicit, immutable release URLs:

- `/docs/0.3.0` — version overview
- `/docs/0.3.0/installation` — a versioned guide
- `/docs/0.3.0/installation.md` — the same guide as Markdown
- `/docs` and `/docs/installation` — compatibility aliases that redirect to the current version

`src/docs/versioning.js` is the version registry. Exactly one entry should have `status: "current"`. The documentation UI, routes, sitemap, Markdown assets, and agent indexes all read from this registry.

## Start a new documentation version

1. Add the new semantic version to `DOC_VERSIONS` and mark it `current`.
2. Change the previous entry from `current` to `archived`.
3. Update the authoring source in `src/docs/catalog.js`, `src/docs/guides.js`, and `src/docs/api-guides.js`.
4. Run `npm run docs:snapshot` to create the new immutable snapshot.
5. Run `npm run docs:generate` and commit the snapshot with the generated public assets.

Normal builds verify that the current snapshot matches the authoring source. They never rewrite a snapshot automatically. If the current version is intentionally still unreleased and its docs change, review the diff and run:

```sh
npm run docs:snapshot -- --force
```

Never force-update an archived snapshot. Corrections to released documentation should ship as a new documentation version so old links continue to describe the package version they name.
