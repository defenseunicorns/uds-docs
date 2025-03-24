# Contributing Guide

## Where / What to Upgrade
The page/content link will take you to the corresponding live uds.defenseunicorns.com doc site, so you won't see your changes. The link is meant as a reference.

| Page/Content | File to Modify | Description of content |
|-|-|-|
| [Landing Page Cards](https://uds.defenseunicorns.com/) | [index.astro](./src/pages/index.astro) | This file contains the content displayed in the cards on the main landing page of the docs site. |
| [Main Content Left Sidebar](https://uds.defenseunicorns.com/overview/why-uds/) | [astro.config.mjs](./astro.config.mjs) | The [astro.config.mjs](./astro.config.mjs) controls the ordering but the [index.astro](./src/pages/index.astro) file controls what subheaders are in the sidebar when dropped down. |

Adding new content pages will be added under the `src/content/docs`. It's recommended that completely new ares of documentation should be added under a new directory. Once the files are in the `src/content/docs` directory, they will be automatically pulled into the docs. If adding a new directory make sure that directory is added to at a minimum, the [index.astro](./src/pages/index.astro) for it to show up in the sidebar, if wanting to show up in the cards of the landing page then will be necessary to add to the [astro.config.mjs](./astro.config.mjs).

If you move existing pages, a redirect is necessary to be added in the [astro.config.mjs](./astro.config.mjs), in the top section for `redirects`. If this is not done then there is potential that someone saved the existing link and now they will get a 404. By adding the redirect for the moved file, users will automatically be redirected to the new location.

If you're using images, those images should be put in the [public](./public/assets/) directory.
