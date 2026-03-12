# Contributing Guide

This guide explains how to contribute content to the UDS documentation site. It is tailored for documentation authors (not application developers) and covers local setup, where content lives, navigation, redirects, and style guidance.

## Table of Contents
1. [Project Overview](#project-overview)
2. [Local Development](#local-development)
3. [Content Structure](#content-structure)
4. [Navigation & Sidebar](#navigation--sidebar)
5. [Home Page Cards](#home-page-cards)
6. [Adding, Editing, and Moving Pages](#adding-editing-and-moving-pages)
7. [Images & Media](#images--media)
8. [Writing & Style Guidelines](#writing--style-guidelines)
9. [Links & Cross-References](#links--cross-references)
10. [Redirects (Required when Moving/Renaming)](#redirects-required-when-movingrenaming)
11. [Adding a New Product](#adding-a-new-product)
12. [Checks Before Opening a PR](#checks-before-opening-a-pr)
13. [Submitting a PR](#submitting-a-pr)
14. [Troubleshooting](#troubleshooting)
15. [Resources](#resources)

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
Reference and troubleshooting docs surfaced on this site are primarily sourced from upstream repositories and periodically integrated here. If you need to change reference content, make the update in the upstream repo:

- UDS Core: https://github.com/defenseunicorns/uds-core
- UDS CLI: https://github.com/defenseunicorns/uds-cli

This site ingests those docs via automation (see `scripts/integration-script.sh`) and places them according to `astro.config.mjs`.

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
- Place docs under `src/content/docs/` using folders that match major areas in the sidebar.
- Common top-level sections autoloaded in the sidebar (see `astro.config.mjs`):
  - `overview/`
  - `getting-started/`
  - `concepts/`
  - `how-to-guides/`
  - `reference/`
  - `operations/`

Recommended file frontmatter for pages (example):
```yaml
  ---
  title: Deploying UDS on RKE2
  description: Step-by-step guide to deploy UDS on RKE2.
  sidebar:
    order: 10   # Optional, controls ordering within a section
  ---
```

## Navigation & Sidebar
- Sidebar is defined by `autogenerate` rules in `astro.config.mjs` under `starlight({ sidebar: [...] })`.
- Files placed in the matching `src/content/docs/<section>/` directory will automatically appear in that section.
- You can control ordering with frontmatter `sidebar.order`. If omitted, alphabetical order is used.

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

Product repos can include images alongside their docs and reference them with relative paths. The integration script rsyncs all files from a product's `docs/` directory — not just Markdown — so images are copied automatically.

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

Products are registered in `src/products.json`. Each product gets its own sidebar topic, URL namespace, and optional archived versioning.

### Steps

1. **Add an entry to `src/products.json`**:
   ```json
   {
     "id": "my-product",
     "label": "My Product",
     "link": "/my-product/",
     "contentDir": "my-product",
     "unlistedPaths": ["/my-product/index", "/my-product/404"],
     "source": {
       "repo": "defenseunicorns/uds-my-product"
     },
     "versioning": {
       "count": 2
     }
   }
   ```
   - `id` — unique identifier, used internally for sidebar topics and version keys.
   - `contentDir` — directory under `src/content/docs/` for this product's content. Use `''` for the root product (Core).
   - `link` — URL prefix. Must match `/{contentDir}/` (or `/` for root).
   - `unlistedPaths` — pages that belong to this product but aren't in any autogenerated sidebar section (e.g. index pages, 404 pages).
   - `source` — where to clone latest docs from. Set `mode: 'base'` for the primary product (uses `--delete` to clear stale files). Omit entirely for products with only local content.
   - `versioning` — when set, archived versions are discovered and built. `repo` defaults to `source.repo` if omitted; `docsPath` defaults to `source.docsPath` then `'docs'`.
   - `sidebarSections` — override to use different section labels/dirs. Defaults to `DEFAULT_SIDEBAR_SECTIONS` (Overview, Getting Started, Concepts, etc.). Defined in `src/products.ts`.

2. **Create a product landing page** at `src/content/docs/{contentDir}/index.mdx`:
   - Use `.mdx` (not `.md`) so you can import and use Starlight components like `<CardGrid>` and `<Card>`.
   - See [`uds-cli/docs/index.mdx`](https://github.com/defenseunicorns/uds-cli/blob/main/docs/index.mdx) for a complete example with cards, a command reference, and a "Get Involved" section.
   - Set `sidebar: hidden: true` and `tableOfContents: false` in frontmatter — the landing page is linked from the sidebar topic header, not listed as a sidebar item.
   - Organize content into the standard section directories (`overview/`, `getting-started/`, etc.) or use custom `sidebarSections`.

3. **Run `npm run build`** to verify everything wires up (sidebar, links, search filtering).

### How it all connects

`src/products.json` is the single source of truth. Here's how other files consume it:

| File | What it does |
|------|-------------|
| `astro.config.mjs` | Imports `PRODUCTS` from `src/products.ts`, generates sidebar topics (one per product + one per archived version), and injects `__PRODUCTS__` and `__PRODUCT_VERSIONS__` as Vite build-time constants for client-side scripts. |
| `scripts/discover-versions.mjs` | Reads `src/products.json` directly, resolves content sources, queries GitHub API for release tags, writes `.versions` JSON with all metadata. |
| `scripts/integration-script.sh` | Reads `.versions` JSON, clones latest docs (source) and archived versions into `src/content/docs/`. |
| `src/components/VersionPicker.astro` | Client-side dropdown that reads `__PRODUCTS__` and `__PRODUCT_VERSIONS__` to show version options for the current product. |
| `src/components/Search.astro` | Filters search results by product using the same injected constants. |
| `src/components/Sidebar.astro` | Hides versioned topics from the product dropdown (versions use the VersionPicker instead). |
| `src/productUtils.ts` | Shared client-side utilities for product/version detection from URLs (used by VersionPicker, Search). |

### Versioning pipeline

The build pipeline reads everything from `src/products.json`:

1. `discover-versions.mjs` reads `src/products.json`, resolves content sources, fetches release tags from GitHub (for products with `versioning`), deduplicates by minor version, and writes `.versions` JSON.
2. `integration-script.sh` reads `.versions` and:
   - Clones latest docs for each product's `source` (base mode uses `--delete`, overlay mode merges).
   - Clones each archived version tag and copies docs into versioned content directories (e.g. `src/content/docs/v0-61/` for Core, `src/content/docs/my-product/v1-2/` for My Product).
3. `astro.config.mjs` reads `.versions` and generates a sidebar topic for each archived version.
4. Version slugs use hyphens (`v0-61`) because Astro's content collection slugger strips dots.

You can override discovered versions via environment variables: `VERSIONS_core=v0.61.0,v0.60.0`.

### Targeting a specific branch

By default, the integration script clones a product's `source.repo` from its default branch. To target a specific branch (e.g. while iterating on docs changes before merging), add a `branch` field to the product's `source` config in `src/products.json`:

```json
"source": {
  "repo": "defenseunicorns/uds-cli",
  "branch": "my-docs-branch",
  "docsPath": "docs"
}
```

This causes the integration script to clone that branch instead of the default. Remove or unset `branch` when the changes are merged.

### Using a local checkout (no commit required)

To develop against a local copy of a product repo without pushing to a branch, use the `DOCS_OVERRIDES` environment variable. The key is the repo name (last segment of the `repo` path):

```bash
DOCS_OVERRIDES="uds-cli=/path/to/uds-cli" npm run build
# Multiple overrides:
DOCS_OVERRIDES="uds-core=/path/to/uds-core;uds-cli=/path/to/uds-cli" npm run build
```

The integration script will rsync from your local path instead of cloning from GitHub. This is the fastest way to preview docs changes locally — no commit or push required.

## Checks Before Opening a PR
- **Build locally**: `npm run build` (runs `astro check` + build).
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
