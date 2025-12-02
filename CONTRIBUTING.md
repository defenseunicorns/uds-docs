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
11. [Checks Before Opening a PR](#checks-before-opening-a-pr)
12. [Submitting a PR](#submitting-a-pr)
13. [Troubleshooting](#troubleshooting)
14. [Resources](#resources)

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
- UDS Identity Config: https://github.com/defenseunicorns/uds-identity-config

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
  - `getting-started/`
  - `overview/`
  - `structure/`
  - `security/`
  - `reference/`
  - `tutorials/`
  - `tactical-edge-deployments/`
  - `registry/`

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
    :::note
    helpful tip or contextual note.
    :::

    :::caution
    Important caution for users.
    :::
  ```
- **Terminology**: Use consistent product names (e.g., “UDS Core”, “UDS CLI”).
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
- Astro Docs: https://docs.astro.build/
- Starlight Docs: https://starlight.astro.build/
