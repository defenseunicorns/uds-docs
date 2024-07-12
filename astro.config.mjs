import {defineConfig} from 'astro/config';
import starlight from '@astrojs/starlight';

import tailwind from "@astrojs/tailwind";


// https://astro.build/config
export default defineConfig({
    integrations: [starlight({
        title: 'UDS',
        logo: {
            src: './src/assets/logo.svg'
        },
        social: {
            github: 'https://github.com/withastro/starlight'
        },
        sidebar: [
            {
                label: 'Getting Started',
                autogenerate: {
                    directory: 'getting-started'
                },
                collapsed: true
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
            {
                label: 'Technical Concepts',
                items: [
                    'concepts/kubernetes',
                    'concepts/helm',
                    'concepts/zarf',
                    {
                        label: 'Service Mesh',
                        autogenerate: {
                            directory: 'concepts/service-mesh'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Monitoring',
                        autogenerate: {
                            directory: 'concepts/monitoring'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Logging',
                        autogenerate: {
                            directory: 'concepts/logging'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Security & Compliance',
                        autogenerate: {
                            directory: 'concepts/security'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Identity & Access (IAM)',
                        autogenerate: {
                            directory: 'concepts/iam'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Backup & Restore',
                        autogenerate: {
                            directory: 'concepts/backup'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Authorization',
                        autogenerate: {
                            directory: 'concepts/authorization'
                        },
                        collapsed: true
                    },
                ],
                collapsed: true
            },
            {
                label: 'Reference',
                items: [
                    {
                        label: 'Bundles',
                        autogenerate: {
                            directory: 'reference/bundles'
                        },
                        collapsed: true
                    },
                    {
                        label: 'CLI Commands',
                        autogenerate: {
                            directory: 'reference/cli'
                        },
                        collapsed: true
                    },
                    'reference/core-integration',
                    'reference/zarf-packages',
                ],
                collapsed: true
            },
            {
                label: 'Security',
                items: [
                    {
                        label: 'Example Bundles',
                        autogenerate: {
                            directory: 'security/example-bundles'
                        },
                        collapsed: true
                    },
                    {
                        label: 'Example Packages',
                        autogenerate: {
                            directory: 'security/example-packages'
                        },
                        collapsed: true
                    }
                ],
                collapsed: true
            },
            {
                label: 'Tutorials',
                autogenerate: {
                    directory: 'tutorials'
                },
                collapsed: true
            }
        ]
    }), tailwind()],
    markdown: {
        // Applied to .md and .mdx files
    },
});