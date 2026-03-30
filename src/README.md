# src/ — UDS Docs Source

This directory contains the Astro site source alongside the TypeScript build pipeline that populates it.

---

## Two-phase build pipeline

```
npm run build
  └─ tsx src/build/integration.ts     ← Phase 1: pull upstream docs into src/content/docs/
  └─ astro check                ← Phase 2: type-check + build the site
  └─ astro build
```

**Phase 1** (`src/build/integration.ts`) clones documentation from each upstream product repo (or reads from local overrides), copies content into the Astro content collection, renames directories to Title Case, rewrites internal markdown links, and generates versioned/non-versioned 404 pages.

**Phase 2** (`astro build`) reads the populated `src/content/docs/` tree and the generated `.versions` + `.product-configs/` artefacts to build the static site.

---

## Module layout

### `src/build/` — build pipeline (runs via `tsx` before Astro)

| File | Responsibility |
|------|---------------|
| `integration.ts` | Main orchestrator and entry point |
| `versions.ts` | GitHub release discovery; `DOCS_OVERRIDES` parsing |
| `fileOps.ts` | All filesystem and subprocess I/O (git clone, file copies, JSON writes) |
| `dirRename.ts` | Pure: kebab-case → Title Case renaming with acronym and phrase maps |
| `linkRewrite.ts` | Pure: rewrite internal markdown links after directory renames |
| `cleanupDirs.ts` | Pure: filter directories that should be removed from a product's content tree |
| `types.ts` | Shared types (`DocsConfig`, `VersionEntry`, `VersionsFile`, `OverridesMap`) |

### `src/` — Astro runtime

| File | Responsibility |
|------|---------------|
| `products.ts` | Runtime product configuration consumed by Astro |
| `productUtils.ts` | Helpers for product data (version slug formatting, sidebar generation) |
| `routeData.ts` | Edit URL resolution using `dir-renames.json` |
| `content.config.ts` | Astro content collection schema |
| `plugins/` | Custom remark/rehype plugins |

### Design principle: pure vs effectful

Pure logic (`dirRename`, `linkRewrite`, `cleanupDirs`, `versions`) is unit-tested in `tests/unit/`. Filesystem and subprocess side effects live in `fileOps.ts`. Functions with self-contained logic are unit-tested; external-process wrappers (e.g. `cloneRepo`) are covered by the Playwright suite.

---

## Running tests

```sh
npm run test:unit         # vitest — unit tests (tests/unit/)
npm run test:unit:watch   # vitest — watch mode
npm run test              # full build + playwright E2E (tests/*.spec.ts)
npm run test:versioned    # versioned build + playwright (tests/versioned/)
```

---

## Adding a new acronym

Open `src/build/dirRename.ts` and add the word (in lowercase) to `ACRONYM_MAP`:

```typescript
export const ACRONYM_MAP: Record<string, string> = {
  uds: 'UDS',
  idam: 'IdAM',
  crds: 'CRDs',
  and: '&',
  // ← add new entries here
};
```

For multi-word phrases (e.g. `single-sign-on` → `Single Sign-On`), use `PHRASE_MAP` instead:

```typescript
export const PHRASE_MAP: Record<string, string> = {
  'single sign on': 'Single Sign-On',
};
```

Add a corresponding test case to `tests/unit/dirRename.test.ts` and re-run `npm run test:unit`.

---

## How `DOCS_OVERRIDES` works

`DOCS_OVERRIDES` is an environment variable that substitutes a local repo clone for a GitHub clone during the build. Useful for developing docs locally without publishing a release.

**Format:**

```
DOCS_OVERRIDES="repo-name=/abs/path;repo-name@tag=/abs/path2"
```

| Key format | When used |
|---|---|
| `repo-name=/path` | Latest docs — replaces GitHub clone for the current branch |
| `repo-name@tag=/path` | Archived version — replaces clone for that specific tag (no fallback to repo-level key) |

**Example: develop core docs locally**

```sh
DOCS_OVERRIDES="uds-core=/home/dev/uds-core" npm run build
```

**Example: override both latest and one archived version**

```sh
DOCS_OVERRIDES="uds-core=/home/dev/uds-core;uds-core@v0.61.0=/home/dev/uds-core-old" npm run build
```

---

## Generated artefacts

These files are written by `src/build/integration.ts` and consumed by Astro:

| Artefact | Purpose |
|---|---|
| `.versions` | Map of product repo → `{ branch, latestTag, versions[] }` used by `astro.config.mjs` |
| `.product-configs/{repo}.json` | Merged `docs.config.json` for the latest version of each product |
| `.product-configs/{repo}.v{X}-{Y}.json` | Merged config for each archived version |
| `.product-configs/dir-renames.json` | Map of `{ "Title Case Name": "kebab-name" }` used by `routeData.ts` for edit URL resolution |
| `src/content/docs/` | Populated Astro content collection (git-ignored) |
