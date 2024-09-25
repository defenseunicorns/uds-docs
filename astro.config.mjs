import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from "@astrojs/tailwind";
import node from "@astrojs/node";

// https://astro.build/config
export default defineConfig({
    i18n: {
        defaultLocale: 'en',
        locales: ['en'],
        routing: {
            prefixDefaultLocale: false
        }
    },
    integrations: [starlight({
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
        favicon: './src/assets/logo.svg',
        head: [
            {
                tag: 'script',
                attrs: {src: "https://cdn.jsdelivr.net/npm/flowbite@2.4.1/dist/flowbite.min.js"}
            },
        ],
        logo: {
            light: './src/assets/light-logo.svg',
            dark: './src/assets/dark-logo.svg',
            alt: 'Unicorn Delivery Service'
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
                collapsed: true
            },
            {
                label: 'Structure',
                autogenerate: {
                    directory: 'structure'
                },
                collapsed: true
            },
            // {
            //     label: 'Technical Concepts',
            //     items: [
            //         'concepts/kubernetes',
            //         'concepts/helm',
            //         'concepts/zarf',
            //         {
            //             label: 'Service Mesh',
            //             autogenerate: {
            //                 directory: 'concepts/service-mesh'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Monitoring',
            //             autogenerate: {
            //                 directory: 'concepts/monitoring'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Logging',
            //             autogenerate: {
            //                 directory: 'concepts/logging'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Security & Compliance',
            //             autogenerate: {
            //                 directory: 'concepts/security'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Identity & Access (IAM)',
            //             autogenerate: {
            //                 directory: 'concepts/iam'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Backup & Restore',
            //             autogenerate: {
            //                 directory: 'concepts/backup'
            //             },
            //             collapsed: true
            //         },
            //         {
            //             label: 'Authorization',
            //             autogenerate: {
            //                 directory: 'concepts/authorization'
            //             },
            //             collapsed: true
            //         },
            //     ],
            //     collapsed: true
            // },
            {
                label: 'Reference',
                items: [
                    {
                        label: 'UDS Common',
                        autogenerate: {
                            directory: 'reference/uds-common'
                        },
                        collapsed: true
                    },
                    {
                        label: 'CLI',
                        autogenerate: {
                            directory: 'reference/cli'
                        },
                        collapsed: true
                    },
                    {
                        label: 'CLI Commands',
                        autogenerate: {
                            directory: 'reference/cli-commands'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Bundles',
                        autogenerate: {
                            directory: 'reference/bundles'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Configuration',
                        autogenerate: {
                            directory: 'reference/configuration'
                        },
                        collapsed: true
                    },
                    // 'reference/core-integration',
                    // 'reference/zarf-packages',
                    'reference/distribution-support',
                    'reference/published-flavors',
                    'reference/flavor-specific-development-notes'
                ],
                collapsed: true
            },
            {
                label: 'Tutorials',
                autogenerate: {
                    directory: 'tutorials'
                },
                collapsed: true
            },
            // {
            //     label: 'Troubleshooting',
            //     autogenerate: {
            //         directory: 'troubleshooting'
            //     },
            //     collapsed: true
            // }
        ],
    }), tailwind({
            applyBaseStyles: false
        }
    )],
    markdown: {
        // Applied to .md and .mdx files
    },
});