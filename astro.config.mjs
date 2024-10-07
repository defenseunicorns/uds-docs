import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from "@astrojs/tailwind";

// https://astro.build/config
export default defineConfig({
    site: 'https://uds.defenseunicorns.com/docs/',
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
        favicon: 'public/favicon.png',
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
            }
        ],
    }), tailwind({
            applyBaseStyles: false
        }
    )]
});