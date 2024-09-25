import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import tailwind from "@astrojs/tailwind";

import fs from 'fs';
import path from 'path';

// Folders will not automatically titleize correctly in some instances such as acronyms (e.g. uds-core -> Uds Core),
// so we need to do this manually. Folders may contain a _name.txt file that can be used to set the title.
function generateImportedDocsConfig(rootPath) {
    if (!fs.existsSync(rootPath)) {
        console.warn(`Warning: The folder ${rootPath} does not exist. Skipping configuration generation.`);
        return null;
    }
    const topFolder = path.basename(rootPath);

    function checkForNameFile(dirPath) {
        const nameFilePath = path.join(dirPath, '_customName.txt');
        if (fs.existsSync(nameFilePath)) {
            return fs.readFileSync(nameFilePath, 'utf-8').trim();
        }
        return null;
    }

    function scanDirectory(dirPath) {
        const folderItems = [];
        const fileItems = [];
        const contents = fs.readdirSync(dirPath, { withFileTypes: true });

        const nameValue = checkForNameFile(dirPath);

        const hasSubfolders = contents.some(item => item.isDirectory());
        const hasFiles = contents.some(item => item.isFile() && item.name !== '_customName.txt');

        if (!hasSubfolders && hasFiles) {
            const label = nameValue || path.basename(dirPath).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
            const relativePath = path.relative(rootPath, dirPath);
            return [{
                label: label,
                autogenerate: { directory: path.join(topFolder, relativePath) },
                collapsed: true
            }];
        }

        contents.forEach(item => {
            if (item.isDirectory()) {
                const subfolderPath = path.join(dirPath, item.name);
                const subfolderConfig = scanDirectory(subfolderPath);
                folderItems.push(...subfolderConfig);
            } else if (item.isFile() && item.name !== '_customName.txt') {
                const fileNameWithoutExt = path.basename(item.name, path.extname(item.name));
                const relativePath = path.relative(rootPath, dirPath);
                fileItems.push(path.join(topFolder, relativePath, fileNameWithoutExt));
            }
        });

        const label = nameValue || path.basename(dirPath).replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        return [{
            label: label,
            items: [...folderItems, ...fileItems],
            collapsed: true
        }];
    }

    return scanDirectory(rootPath)[0];
}

const referenceDocs = generateImportedDocsConfig('src/content/docs/reference');

// The troubleshooting docs are not currently built.
// const troubleshootingDocs = generateImportedDocsConfig('src/content/docs/troubleshooting');

// https://astro.build/config
export default defineConfig({
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
        favicon: './src/assets/logo.svg',
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
                collapsed: true,
            },
            {
                label: 'Structure',
                autogenerate: {
                    directory: 'structure'
                },
                collapsed: true
            },
            referenceDocs,
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