## UDS Docs Refresh

This is an experimental refresh of the UDS documentation, built in [Starlight](https://starlight.astro.build).

Currently, the project migrates most of the existing UDS documentation into an information architecture which aims to be
more conducive to both learning and discovery.

> [!WARNING]
> As this is a work in progress, things will frequently change and this README may be out of date at times.

In order to get started with local development, the simplest way to do so is by utilizing your usual `npm install` and 
`npm run dev` commands, as described below. You may also build this project as a Zarf package/UDS bundle to be deployed. 
Please ensure you build and tag the image as `uds-docs`:

`docker build -t uds-docs:latest .`

`docker tag uds-docs uds-docs:latest`

> [!NOTE]
> The above image is based on [node:lts](https://hub.docker.com/_/node) and 
[nginx-unprivileged](https://hub.docker.com/r/nginxinc/nginx-unprivileged).

This project has support for Tailwind and Flowbite, but the latter is currently not enabled as it causes some minor 
styling issues which need to be resolved.

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
│   │   └── config.ts
│   └── env.d.ts
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

Starlight looks for `.md` or `.mdx` files in the `src/content/docs/` directory. Each file is exposed as a route based on
its file name.

Images can be added to `src/assets/` and embedded in Markdown with a relative link.

Static assets, like favicons, can be placed in the `public/` directory.

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
