import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightSidebarTopics from 'starlight-sidebar-topics';

import tailwindcss from '@tailwindcss/vite';
import { LikeC4VitePlugin } from 'likec4/vite-plugin';
import starlightImageZoom from 'starlight-image-zoom';
import react from '@astrojs/react';
import starlightGitHubAlerts from 'starlight-github-alerts'

// https://astro.build/config
export default defineConfig({
  site: 'https://uds.defenseunicorns.com/docs/',

  redirects:
  {
    '/docs': '/',
    '/en': '/',
  },

  integrations: [
    react(),
    starlight({
      routeMiddleware: './src/routeData.ts',
      plugins: [
        starlightGitHubAlerts(),
        starlightLinksValidator(),
        starlightImageZoom(),
        starlightLlmsTxt({
          projectName: 'UDS Documentation',
          description: 'Authoritative docs for Unicorn Delivery Service (UDS).',
          details: [
            '- CLI examples use `uds` and bash-like shells.',
            '- Start with Getting Started; use CLI Reference for flags.',
          ].join('\n'),
          optionalLinks: [
            { label: 'UDS Core (GitHub)', url: 'https://github.com/defenseunicorns/uds-core' },
            { label: 'UDS CLI (GitHub)', url: 'https://github.com/defenseunicorns/uds-cli' },
            { label: 'Zarf Docs', url: 'https://docs.zarf.dev/' },
          ],
          customSets: [
            { label: 'Getting Started', paths: ['getting-started/**'], description: 'Install and first steps.' },
            { label: 'Concepts', paths: ['concepts/**'], description: 'How UDS Core works and its major features.' },
            { label: 'Operations & Maintenance', paths: ['operations/**'], description: 'Day-2 operations, upgrades, and runbooks.' },
          ],
          promote: ['index*', 'getting-started/**', 'overview/**', 'concepts/**', 'reference/cli/**', 'operations/**'],
          minify: { note: true, tip: true, caution: true, danger: true, details: true, whitespace: true },
          pageSeparator: '\n\n-----\n\n',
          rawContent: true,
        }),
        starlightSidebarTopics([
          {
            label: 'Core',
            link: '/',
            items: [
              {
                label: 'Overview',
                autogenerate: {
                  directory: 'overview'
                },
                collapsed: true,
              },
              {
                label: 'Getting Started',
                autogenerate: {
                  directory: 'getting-started'
                },
                collapsed: true
              },
              {
                label: 'Concepts',
                autogenerate: {
                  directory: 'concepts'
                },
                collapsed: true
              },
              {
                label: 'How-to Guides',
                autogenerate: {
                  directory: 'how-to-guides'
                },
                collapsed: true
              },
              {
                label: 'Reference',
                autogenerate: {
                  directory: 'reference'
                },
                collapsed: true,
              },
              {
                label: 'Operations & Maintenance',
                autogenerate: {
                  directory: 'operations'
                },
                collapsed: true,
              },
            ],
          },
        ]),
      ],
      defaultLocale: 'root',
      locales: {
        root: {
          label: 'English',
          lang: 'en',
        }
      },
      // The title is set to '' because otherwise it shows in the top navigation which is redundant with the logo.
      // However, if this is done, the title delimiter has no text after it, which affects what you see in the
      // page title (e.g. Basic Requirements | [title]). We can fix this by changing the delimiter value and
      // ensure the logo has alternative text for accessibility purposes.
      title: '',
      titleDelimiter: '| UDS',
      lastUpdated: true,
      customCss: [
        './src/tailwind.css',
      ],
      logo: {
        light: './src/assets/light-logo.svg',
        dark: './src/assets/dark-logo.svg',
        alt: 'Unicorn Delivery Service'
      },
      components: {
        Footer: './src/components/Footer.astro',
        Head: './src/components/Head.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        Sidebar: './src/components/Sidebar.astro',
        Search: './src/components/Search.astro'
      },
      social: [
        {
          icon: 'github',
          href: 'https://github.com/defenseunicorns/uds-core',
          label: 'GitHub'
        }
      ],
    },
    )],
  vite: {
    resolve: { preserveSymlinks: true },
    plugins: [
      tailwindcss(),
      LikeC4VitePlugin({
        modelRoot: './src/content/docs/.c4/',
      }),
    ],
  },
});
