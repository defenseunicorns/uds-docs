import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';

import tailwindcss from '@tailwindcss/vite';
import { LikeC4VitePlugin } from 'likec4/vite-plugin';
import react from '@astrojs/react';

// https://astro.build/config
export default defineConfig({
    site: 'https://uds.defenseunicorns.com/docs/',

    redirects:
    {
        '/docs': '/',
        '/en': '/',
        '/mission-capabilities/': '/mission-capabilities/overview/',
        '/mission-capabilities/swf/': '/mission-capabilities/swf/overview',
        '/cli/command-reference/uds/': '/reference/cli/commands/uds',
        '/cli/command-reference/uds_completion/': '/reference/cli/commands/uds_completion',
        '/cli/command-reference/uds_completion_bash/': '/reference/cli/commands/uds_completion_bash',
        '/cli/command-reference/uds_completion_fish/': '/reference/cli/commands/uds_completion_fish',
        '/cli/command-reference/uds_completion_zsh/': '/reference/cli/commands/uds_completion_zsh',
        '/cli/command-reference/uds_create/': '/reference/cli/commands/uds_create',
        '/cli/command-reference/uds_deploy/': '/reference/cli/commands/uds_deploy',
        '/cli/command-reference/uds_dev/': '/reference/cli/commands/uds_dev',
        '/cli/command-reference/uds_dev_deploy/': '/reference/cli/commands/uds_dev_deploy',
        '/cli/command-reference/uds_inspect/': '/reference/cli/commands/uds_inspect',
        '/cli/command-reference/uds_logs/': '/reference/cli/commands/uds_logs',
        '/cli/command-reference/uds_monitor/': '/reference/cli/commands/uds_monitor',
        '/cli/command-reference/uds_monitor_pepr/': '/reference/cli/commands/uds_monitor_pepr',
        '/cli/command-reference/uds_publish/': '/reference/cli/commands/uds_publish',
        '/cli/command-reference/uds_pull/': '/reference/cli/commands/uds_pull',
        '/cli/command-reference/uds_remove/': '/reference/cli/commands/uds_remove',
        '/cli/command-reference/uds_run/': '/reference/cli/commands/uds_run',
        '/cli/command-reference/uds_ui/': '/reference/cli/commands/uds_ui',
        '/cli/command-reference/uds_version/': '/reference/cli/commands/uds_version',
        '/reference/configuration/uds-operator/': '/reference/configuration/uds-operator/overview/',
        '/reference/configuration/uds-user-groups/': '/reference/configuration/single-sign-on/overview/',
        '/reference/configuration/ingress/': '/reference/configuration/service-mesh/ingress/',
        '/reference/configuration/non-http-ingress/': '/reference/configuration/service-mesh/non-http-ingress/',
        '/reference/configuration/authorization-policies/': '/reference/configuration/service-mesh/authorization-policies/',
        '/reference/configuration/single-sign-on/keycloak-session-timeouts/': '/reference/configuration/single-sign-on/keycloak-session-management/',
        '/reference/configuration/uds-monitoring-metrics/': '/reference/configuration/observability/monitoring-metrics/',
        '/reference/deployment/secret-pod-reload/': '/reference/deployment/pod-reload/'
    },

    integrations: [
      react(),
      starlight({
        plugins: [
            starlightLinksValidator(),
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
                { label: 'CLI Reference', paths: ['reference/cli/**'], description: 'Commands and flags.' },
                { label: 'UDS Core', paths: ['reference/uds-core/**'] },
                { label: 'Tutorials', paths: ['tutorials/**'] },
              ],
              promote: ['index*', 'getting-started/**', 'overview/**', 'structure/**', 'reference/cli/**'],
              minify: { note: true, tip: true, caution: true, danger: true, details: true, whitespace: true },
              pageSeparator: '\n\n-----\n\n',
              rawContent: false,
            })
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
            ThemeProvider: './src/components/ThemeProvider.astro'
        },
        social: [
            {
                icon: 'github',
                href: 'https://github.com/defenseunicorns/uds-core',
                label: 'GitHub'
            }
        ],
        sidebar: [
            {
                label: 'Home',
                link: '/',
            },
            {
                label: 'Getting Started',
                autogenerate: {
                    directory: 'getting-started'
                },
                collapsed: false
            },
            {
                label: 'Overview',
                autogenerate: {
                    directory: 'overview'
                },
                collapsed: true,
            },
            {
                label: 'Structure',
                autogenerate: {
                    directory: 'structure'
                },
                collapsed: true
            },
            {
                label: 'Security',
                autogenerate: {
                    directory: 'security'
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
                label: 'Tutorials',
                autogenerate: {
                    directory: 'tutorials'
                },
                collapsed: true
            },
            {
                label: 'Tactical Edge',
                autogenerate: {
                    directory: 'tactical-edge-deployments'
                },
                collapsed: true,
                badge: { text: 'New!', variant: 'tip' }
            },
            {
                label: 'UDS Registry',
                autogenerate: {
                    directory: 'registry'
                },
                collapsed: true,
                badge: { text: 'New!', variant: 'tip' }
            },
        ],

    },
  )],
  vite: {
    plugins: [
      tailwindcss(),
      LikeC4VitePlugin({
        modelRoot: './src/content/docs/.c4/',
      }),
    ],
  },
});
