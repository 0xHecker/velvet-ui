# Documentation versions

> Use an explicit documentation version when implementing or maintaining an application on a known Velvet UI release.

Documentation version: 0.3.0

Web: https://velvetui.co/docs/0.3.0/versions

Documentation is captured per release so a guide keeps describing the package version named in its URL. Choose a version from the documentation sidebar before copying an API or implementation pattern.

## Stable release URLs

Every guide, Markdown download, example source file, and machine-readable documentation index lives beneath a semantic version. Share these URLs in issues, migration plans, and long-lived application documentation.

```text
/docs/0.3.0
/docs/0.3.0/installation
/docs/0.3.0/installation.md
/docs/0.3.0/llms-full.txt
```

## Current-version aliases

`/docs` and legacy paths such as `/docs/installation` redirect to the current documentation version. They are convenient for discovery, but use the explicit versioned URL when another person must see the same contract later.

## Switch versions without losing your place

The version selector preserves the current guide whenever that guide exists in the target version. If a page was introduced later or removed, the selector falls back to that version's overview instead of showing a broken page.

## Match package and documentation versions

Use documentation that matches the installed package version. Check your lockfile or installed package metadata when the application is not using the latest release.

```sh
npm list @velvetui/react
# or
pnpm why @velvetui/react
```
