# Contributing Guide

This guide explains how to contribute content to the UDS documentation site. It is tailored for documentation authors (not application developers) and covers local setup, where content lives, navigation, redirects, and style guidance.

## Table of Contents
1. [Project Overview](#project-overview)
1. [Local Development](#local-development)
1. [Content Structure](#content-structure)
1. [Navigation & Sidebar](#navigation--sidebar)
1. [Home Page Cards](#home-page-cards)
1. [Adding, Editing, and Moving Pages](#adding-editing-and-moving-pages)
1. [Images & Media](#images--media)
1. [Writing & Style Guidelines](#writing--style-guidelines)
1. [Links & Cross-References](#links--cross-references)
1. [Redirects (Required when Moving/Renaming)](#redirects-required-when-movingrenaming)
1. [Adding a New Product](#adding-a-new-product)
1. [Checks Before Opening a PR](#checks-before-opening-a-pr)
1. [Submitting a PR](#submitting-a-pr)
1. [Troubleshooting](#troubleshooting)
1. [Resources](#resources)

## Project Overview
- **Framework**: Astro + Starlight.
- **Content root**: `src/content/docs/` (Markdown/MDX files).
- **Site config**: `astro.config.mjs` (sidebar, redirects, integrations, etc.).
- **Home page**: `src/pages/index.astro` (landing page cards and sections).

### Repository Scope
- **Docs site framework**: Astro + Starlight, Tailwind, and supporting plugins/config (e.g., `astro.config.mjs`, components under `src/`).
- **CI / publishing**: Build and publishing configuration to Netlify (see `netlify.toml` and `.github/workflows/`).
- **Integration scripts**: Pull reference/troubleshooting docs from upstream repos (see `scripts/integration-script.sh`).
- **Some first‑party content**: High‑level docs and tutorials maintained here (e.g., `src/content/docs/getting-started/`, `src/content/docs/tutorials/`).

### Reference documentation source of truth
Product docs are sourced from upstream repositories registered in `src/products.json`. If you need to change content for a product, make the update in its upstream repo. This site ingests those docs via automation (see `scripts/integration-script.sh`). Sidebar structure and labels are defined by each upstream repo's `docs/docs.config.json`.

## Local Development
Prereqs:
- Node.js (we recommend Node 20+). If unsure, match CI: check `.github/workflows/` or use Node 20/22/24.

Install and run:
```bash
  npm install
  npm run dev     # Start local dev server
  # Optional:
  npm run build    # Validates (astro check) and builds site
  npm run preview # Serves the production build locally
```

Notes:
- `npm run build` runs `astro check` and builds, which will catch broken links via the `starlight-links-validator` plugin and schema issues.

## Content Structure
- Each product's docs live under `src/content/docs/{contentDir}/`, pulled from its upstream repo.
- Sidebar sections and ordering are defined by the upstream repo's `docs/docs.config.json` via the `sidebarOrder` field.
- Only directories listed in `sidebarOrder` appear in the sidebar. The integration script removes unlisted directories to prevent orphaned pages.

Required file frontmatter for pages:
```yaml
  ---
  title: Deploying UDS on RKE2
  description: Deploy UDS Core on an RKE2 cluster using Zarf packages and bundle overrides.
  sidebar:
    order: 10   # Optional, controls ordering within a section
  ---
```

## Navigation & Sidebar
- Sidebar sections are driven by each product's `docs/docs.config.json` in the upstream repo (see [Upstream config file](#upstream-config-file-docsdocsconfigjson)).
- Files placed in the matching `src/content/docs/{contentDir}/{section}/` directory automatically appear in that section.
- You can control page ordering within a section with frontmatter `sidebar.order`. If omitted, alphabetical order is used.

## Home Page Cards
- Home page content (cards/sections) is controlled in `src/pages/index.astro` within the `sections` array.
- To add/remove/update a card:
  - Edit `src/pages/index.astro` and adjust the item in `sections`.
  - Use absolute doc links like `/reference/cli/commands/uds/` for clarity.

## Adding, Editing, and Moving Pages
- **Add a new page**: Create a Markdown file under the appropriate directory in `src/content/docs/`. Provide good frontmatter (title/description) and clear headings.
- **Edit a page**: Make changes directly to the Markdown file. Keep titles stable to preserve links if possible.
- **Move or rename a page**: You must add a redirect in `astro.config.mjs` (see next section) to avoid 404s for users with saved links.

## Images & Media
- Use `public/assets/` for images referenced by content. Example usage in Markdown:
  ```md
    ![Alt text for screen reader](/assets/my-image.png)
  ```
- Reserve `src/assets/` for site/UI assets (e.g., logos referenced by components/config).
- Always provide meaningful `alt` text.

### Product-supplied images

Product repos can include images alongside their docs and reference them with relative paths. The integration script rsyncs all files from a product's `docs/` directory (not just Markdown), so images are copied automatically.

Convention: place images in a `.images/` subdirectory (leading dot keeps it out of sidebar autogeneration):

```
your-product-repo/
└── docs/
    ├── index.mdx
    ├── .images/
    │   └── diagram.png
    └── reference/
        └── overview.md
```

Reference them in `.mdx` files with a relative path:
```md
![Diagram](./.images/diagram.png)
```

After the integration script runs, the image will be at `src/content/docs/{contentDir}/.images/diagram.png` and the relative reference will resolve correctly.

## Writing & Style Guidelines
- **Audience-first**: Assume users are practitioners deploying/operating UDS. Start with the task, then provide necessary context.
- **Titles**: Use Sentence case. Keep concise and descriptive.
- **Headings**: Organize with `##` and `###` levels; avoid deep nesting where possible.
- **Voice**: Clear, direct, and active voice. Avoid internal jargon.
- **Examples**: Prefer copy-pasteable shell blocks. Use fenced code blocks with language:
  ```bash
    uds version
  ```
- **Notes/Warnings**: Use Starlight callouts, e.g.:
  ```md
    > [!NOTE]
    > Useful information that users should know, even when skimming content.

    > [!TIP]
    > Helpful advice for doing things better or more easily.

    > [!WARNING]
    > Urgent info that needs immediate user attention to avoid problems.

    > [!CAUTION]
    > Advises about risks or negative outcomes of certain actions.
  ```
- **Terminology**: Use consistent product names (e.g., “UDS Core”, “UDS CLI”).
- **Version banners for How‑tos**: If a how‑to guide only applies to certain UDS Core versions, add a short callout
  near the top that clearly states the supported version range and points to upgrade/changes docs when relevant.
- **Links**: Prefer absolute paths beginning with `/` for internal links.

## Links & Cross-References
- Internal docs: Use absolute paths like `/getting-started/basic-requirements/`.
- External links: Use full URLs. Prefer official sources for tooling (e.g., Helm, Node.js).
- Cross-reference related pages at the end under a “See also” heading when useful.

## Redirects (Required when Moving/Renaming)
- Add redirects in `astro.config.mjs` under the `redirects` map. Example:
  ```js
    redirects: {
      '/old/path/': '/new/path/',
    },
  ```
- Keep trailing slashes consistent with the target page.
- Include the smallest set needed to preserve working links from prior URLs.

## Adding a New Product

Products are registered in two places: `src/products.json` in this repo (minimal repo reference) and `docs/docs.config.json` in the upstream repo (product metadata and sidebar config).

### Upstream config file: `docs/docs.config.json`

Each upstream repo must have a `docs/docs.config.json` that defines how the product appears on the docs site:

```json
{
  "id": "myproduct",
  "label": "My Product",
  "contentDir": "my-product",
  "description": "One to two sentences describing the product: what it does and its key components.",
  "archiveCount": 2,
  "sidebarOrder": [
    "getting-started",
    "concepts",
    { "dir": "how-to-guides", "label": "How-to Guides" },
    "reference"
  ]
}
```

- `id`: unique product identifier. **Do not use hyphens**; use underscores instead (e.g. `my_product` not `my-product`). The id is used as an environment variable suffix for version overrides.
- `label`: display name shown in navigation.
- `contentDir`: directory under `src/content/docs/` where docs are placed. Also determines the URL prefix (`/{contentDir}/`).
- `description`: product summary used in `llms.txt` so AI assistants know what the product does and which docs to consult. Write 1–2 sentences covering what the product does and its key components (e.g. bundled services, CLIs, CRDs). This text appears in the `## Products` section of `llms.txt` and is the first thing an LLM reads about your product. **Required** for LLM-friendly docs.
- `archiveCount` (optional): number of archived minor versions to keep alongside the latest. Omit (or set to `0`) for latest-only.
- `sidebarOrder`: ordered list of sidebar sections. Each entry is a directory name string (label auto-generated via title-casing) or an object `{ "dir": "...", "label": "..." }` for custom labels. Only listed directories appear in the sidebar; unlisted directories are removed by the integration script. Directories listed in `sidebarOrder` that don't exist on disk are silently skipped.

Different versions of a product can have different `sidebarOrder`; the config is read per-version at build time. Archived versions without a `docs.config.json` are skipped with a warning.

### Steps

1. **Create `docs/docs.config.json`** in the upstream repo (see schema above).

2. **Add an entry to `src/products.json`** in this repo:
   ```json
   {
     "repo": "org/my-product"
   }
   ```
   - `repo` (required): GitHub repo in `owner/name` format.
   - `branch` (optional): override branch for development. Omit to auto-discover the latest release tag.

3. **Create a product landing page** at `docs/index.mdx` in the upstream repo:
   - Use `.mdx` (not `.md`) so you can import and use Starlight components like `<CardGrid>` and `<Card>`.
   - See [`uds-cli/docs/index.mdx`](https://github.com/defenseunicorns/uds-cli/blob/main/docs/index.mdx) for a complete example.
   - Set `sidebar: hidden: true` and `tableOfContents: false` in frontmatter; the landing page is linked from the sidebar topic header, not listed as a sidebar item.
   - The `description` field on `index.mdx` is especially important: the `promote` config in `astro.config.mjs` explicitly promotes product index pages above all section pages, so LLMs encounter the product summary first in `llms-full.txt` and `llms-small.txt`.

4. **Add `description` frontmatter to all docs pages** in the upstream repo. Every page must have a description before the product is added. See [LLM-Friendly Documentation](#llm-friendly-documentation) for guidance on writing good descriptions.

5. **Run `npm run build`** to verify everything wires up (sidebar, links, search filtering).

> [!NOTE]
> `customSets`, `promote`, and the `## Products` listing in `astro.config.mjs` are all auto-derived from `PRODUCTS`, `sidebarOrder`, and each product's `description`. You do not need to update `astro.config.mjs` manually when adding a new product.

### How it all connects

Configuration lives in two places: `src/products.json` (repo references) and upstream `docs/docs.config.json` (product metadata).

| File | What it does |
|------|-------------|
| `src/products.json` | Minimal list of repos to pull docs from, with optional branch overrides and archive counts. |
| `scripts/discover-versions.mjs` | Reads `src/products.json`, queries GitHub API for release tags, writes `.versions` JSON. |
| `scripts/integration-script.sh` | Reads `.versions`, clones repos, reads `docs/docs.config.json` from each, writes `.product-configs/`, copies docs into `src/content/docs/`. |
| `.product-configs/` | Build artifact written by the integration script. Contains resolved product configs (upstream `docs.config.json` + repo info) for `astro.config.mjs` to read. |
| `src/products.ts` | Reads `.product-configs/` and exports `PRODUCTS` for use by `astro.config.mjs` and `routeData.ts`. |
| `astro.config.mjs` | Imports `PRODUCTS`, generates sidebar topics using `sidebarOrder` from upstream configs, injects `__PRODUCTS__` and `__PRODUCT_VERSIONS__` as Vite build-time constants. |
| `src/components/VersionPicker.astro` | Client-side dropdown that reads `__PRODUCTS__` and `__PRODUCT_VERSIONS__` to show version options. |
| `src/components/Search.astro` | Filters search results by product using the same injected constants. |
| `src/components/Sidebar.astro` | Hides versioned topics from the product dropdown (versions use the VersionPicker instead). |
| `src/productUtils.ts` | Shared client-side utilities for product/version detection from URLs. |

### Versioning pipeline

1. `discover-versions.mjs` reads `src/products.json`, fetches release tags from GitHub (reading `archiveCount` from each product's upstream `docs/docs.config.json`), deduplicates by minor version, and writes `.versions` JSON.
2. `integration-script.sh` reads `.versions` and:
   - Clones latest docs for each repo and reads `docs/docs.config.json` to determine `contentDir`, sidebar config, etc.
   - Clones each archived version tag, reads that version's `docs/docs.config.json`, and copies docs into versioned content directories (e.g. `src/content/docs/core/v0-61/`).
   - Writes `.product-configs/` with resolved configs for each product and version.
3. `astro.config.mjs` reads `.product-configs/` and `.versions`, generates sidebar topics for each product and archived version.
4. Version slugs use hyphens (`v0-61`) because Astro's content collection slugger strips dots.

### Targeting a specific branch

By default, the build uses the latest release tag. To target a specific branch (e.g. while iterating on docs changes before merging), add a `branch` field in `src/products.json`:

```json
{
  "repo": "defenseunicorns/uds-cli",
  "branch": "my-docs-branch"
}
```

This causes the integration script to clone that branch instead. Remove `branch` when the changes are merged.

### Using a local checkout (no commit required)

To develop against a local copy of a product repo without pushing to a branch, use the `DOCS_OVERRIDES` environment variable. The key is the repo name (last segment of the `repo` path):

```bash
DOCS_OVERRIDES="uds-cli=/path/to/uds-cli" npm run build
# Multiple overrides:
DOCS_OVERRIDES="uds-core=/path/to/uds-core;uds-cli=/path/to/uds-cli" npm run build
```

To also use a local path for a specific archived version, append `@tag` to the repo name. Without a version-specific key, archived versions are always cloned from GitHub at their tag; there is no fallback to the repo-level key:

```bash
# Latest uses ../uds-core, v0.62.0 uses a different local path:
DOCS_OVERRIDES="uds-core=/path/to/uds-core;uds-core@v0.62.0=/path/to/uds-core-old" npm run build

# Latest cloned from GitHub, but v0.62.0 uses a local path:
DOCS_OVERRIDES="uds-core@v0.62.0=/path/to/uds-core-old" npm run build
```

The integration script will rsync from your local path instead of cloning from GitHub. This is the fastest way to preview docs changes locally; no commit or push required.

## Checks Before Opening a PR
- **Build locally**: `npm run build` (runs `astro check` + build).
- **Run tests**: `npm test` (builds the site and runs Playwright E2E tests against it).
- **Validate links**: Broken internal links will fail due to `starlight-links-validator` integration.
- **Review navigation**: Confirm the page appears in the expected sidebar section.
- **Review home page** (if updated): Verify card links render and route correctly.
- **Spelling/grammar**: Quick pass to improve clarity and correctness.

## Submitting a PR
1. **Create an issue** (for larger changes) describing motivation and scope. Small fixes may skip this.
2. **Create a branch** and implement changes.
3. **Run local checks**: `npm run build`.
4. **Open a PR** against `main` with a clear title and summary of changes.
5. **Address review feedback** promptly. Keep discussions focused on user impact and clarity.

## Troubleshooting
- Port already in use when running `npm run dev`:
  - Stop other local servers or specify a different port via Astro CLI flags.
- Broken links caught on build:
  - Fix path typos or add a redirect if the page moved.
- Sidebar item missing:
  - Ensure the file lives under the correct `src/content/docs/<section>/` directory and has valid frontmatter.

## Resources
- `astro.config.mjs` for sidebar, redirects, integrations.
- `src/pages/index.astro` for landing page content/cards.
- `scripts/integration-script.sh` for importing docs from other repos; keep its destinations aligned with the current
  IA when adding or moving imported content.
- Astro Docs: https://docs.astro.build/
- Starlight Docs: https://starlight.astro.build/
