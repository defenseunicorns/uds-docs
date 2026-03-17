## UDS Documentation Site

This is the UDS documentation site, built with [Starlight](https://starlight.astro.build).

### Repository Scope
- The **docs site framework**: Astro + Starlight and supporting plugins/config (e.g., `astro.config.mjs`, Tailwind, components under `src/`).
- The **CI/publishing pipeline**: configuration used to build and publish the site to Netlify (see `netlify.toml` and GitHub Actions under `.github/workflows/`).
- **Integration scripts**: tooling that pulls reference/troubleshooting content from upstream repos (see `scripts/integration-script.sh`).
- **Some first‑party content**: high‑level and tutorial pages maintained here (e.g., `src/content/docs/getting-started/`, `src/content/docs/tutorials/`).

Most reference documentation is sourced from upstream repositories (see “Document Sourcing” below). If you are updating reference docs, change them in their upstream repos rather than here.

In order to get started with local development, the simplest way to do so is by utilizing your usual `npm install` and 
`npm run dev` commands, as described below. You may also build this project as a Zarf package/UDS bundle. Please ensure 
you build and tag the image as `uds-docs`:

`docker build -t uds-docs:latest .`

> [!NOTE]
> The above image is based on [node:lts](https://hub.docker.com/_/node) and [nginx-unprivileged](https://hub.docker.com/r/nginxinc/nginx-unprivileged).

This project uses TailwindCSS.

## Starlight Basics

### Project Structure

In this project, you'll see the following folders and files:

```
.
├── public/
├── src/
│   ├── assets/
│   ├── content/
│   │   ├── docs/
│   ├── content.config.ts
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on
its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

### Document Sourcing

Product docs are sourced from upstream repositories registered in `src/products.json`. Each upstream repo owns its docs configuration via a `docs/docs.config.json` file that defines sidebar order, labels, and content directory. The integration script (`scripts/integration-script.sh`) clones these repos and copies their docs into this site at build time.

To update docs for a product, make the change in its upstream repository. See `CONTRIBUTING.md` for the full architecture.

### Commands

All commands are run from the root of the project, from a terminal:

| Command                   | Action                                           |
| :------------------------ | :----------------------------------------------- |
| `npm install`             | Installs dependencies                            |
| `npm run dev`             | Starts local dev server at `localhost:4321`      |
| `npm run build`           | Build your production site to `./dist/`          |
| `npm run preview`         | Preview your build locally, before deploying     |
| `npm run astro ...`       | Run CLI commands like `astro add`, `astro check` |
| `npm run astro -- --help` | Get help using the Astro CLI                     |

- [Starlight’s docs](https://starlight.astro.build/)
- [Astro documentation](https://docs.astro.build)
