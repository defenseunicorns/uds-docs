# src/ — UDS Docs Source

## Two-phase build

```
npm run build
  └─ tsx src/build/integration.ts   ← Phase 1: pull upstream docs
  └─ astro check && astro build     ← Phase 2: build the site
```

## Module layout

### `src/build/` — build pipeline (runs before Astro)

| File | Purpose |
|------|---------|
| `integration.ts` | Main orchestrator |
| `versions.ts` | GitHub release discovery, `DOCS_OVERRIDES` parsing |
| `fileOps.ts` | Filesystem I/O (clone, copy, config writes) |
| `dirRename.ts` | kebab-case → Title Case with acronym/phrase maps |
| `linkRewrite.ts` | Rewrite markdown links after renames |
| `cleanupDirs.ts` | Filter unlisted directories |
| `types.ts` | Shared types |

### `src/` — Astro runtime

| File | Purpose |
|------|---------|
| `products.ts` | Product config for Astro |
| `routeData.ts` | Edit URL resolution |
| `plugins/` | Remark/rehype plugins |

## Running tests

```sh
npm test                  # everything: unit + E2E + versioned E2E
npm run test:unit         # vitest only (~150ms)
npm run test:e2e          # build + playwright
npm run test:versioned    # versioned fixture build + playwright
npm run test:unit:watch   # vitest watch mode
```

## Adding a new acronym

Edit `src/build/dirRename.ts`:

```typescript
export const ACRONYM_MAP = {
  uds: 'UDS',
  idam: 'IdAM',
  crds: 'CRDs',
  and: '&',
  // ← add new entries here
};
```

For multi-word phrases, use `PHRASE_MAP`. Add a test case to `tests/unit/dirRename.test.ts`.

## `DOCS_OVERRIDES`

```sh
# Use local checkout for latest docs
DOCS_OVERRIDES="uds-core=/home/dev/uds-core" npm run build

# Override both latest and an archived version
DOCS_OVERRIDES="uds-core=/path;uds-core@v0.61.0=/path-old" npm run build
```
