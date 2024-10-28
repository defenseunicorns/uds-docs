import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from "@astrojs/tailwind";

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
    },
    integrations: [starlight({
        defaultLocale: 'en',
        locales: {
            en: {
                label: 'English',
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
        head: [
            {
                tag: 'script',
                attrs: {
                    src: 'https://www.googletagmanager.com/gtag/js?id=G-57TRKPHZXN',
                    async: true,
                }
            },
            {
                tag: 'script',
                content: `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-57TRKPHZXN');
`
            }
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
        social: {
            github: 'https://github.com/defenseunicorns'
        },
        sidebar: [
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
                label: 'Airgap App Store',
                link: '/airgap-app-store/overview',
                badge: { text: 'New', variant: 'success' }
            },
        ],
    }), tailwind({
            applyBaseStyles: false
        }
    )]
});