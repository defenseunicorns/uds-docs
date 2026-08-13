import { defineConfig } from 'astro/config';
import { existsSync, readFileSync } from 'fs';
import starlight from '@astrojs/starlight';
import starlightLinksValidator from 'starlight-links-validator';
import starlightLlmsTxt from 'starlight-llms-txt';
import starlightSidebarTopics from 'starlight-sidebar-topics';
import { PRODUCTS } from './src/products.ts';

import tailwindcss from '@tailwindcss/vite';
import { LikeC4VitePlugin } from 'likec4/vite-plugin';
import react from '@astrojs/react';
import starlightImageZoom from 'starlight-image-zoom';
import starlightGitHubAlerts from 'starlight-github-alerts';
import { fileURLToPath } from 'node:url';
import { remarkLinkRewrite } from './src/plugins/remark-link-rewrite.ts';
import { latestProductVersion } from './src/versionUtils.ts';

// Read per-product versions from .versions JSON (written by src/build/integration.ts).
// Format: { "owner/repo": { "repo": "...", "branch": "...", "versions": [...], "latestTag": "..." } }
let versionsFile = {};
try {
  versionsFile = JSON.parse(readFileSync('.versions', 'utf8'));
} catch { /* not present in local dev; no archived versions built */ }

// Index .versions by repo for O(1) lookups, then re-key by product id.
// Versions are now objects: { ref, display, slug }.
const versionsByRepo = Object.fromEntries(Object.values(versionsFile).map(v => [v.repo, v]));
const productVersions = Object.fromEntries(
  PRODUCTS.map(p => {
    const allVersions = versionsByRepo[p.repo]?.versions ?? [];
    const available = allVersions.filter(v =>
      existsSync(`./src/content/docs/${p.contentDir}/${v.slug}`)
    );
    return [p.id, available];
  })
);
const productLatestVersions = Object.fromEntries(
  PRODUCTS.flatMap(p => {
    const latest = latestProductVersion(p, versionsByRepo);
    return latest ? [[p.id, latest]] : [];
  })
);
// Build remark-link-rewrite options from product configs.
// versionedSections provides per-version overrides for archived docs whose
// sidebarOrder differs from the current product config.
const linkRewriteProducts = PRODUCTS.map(p => ({
  contentDir: p.contentDir,
  channel: p.latestSource,
  sections: p.sidebarOrder.map(e => typeof e === 'string' ? e : e.dir),
  latestPrefix: p.latestSource
    ? productLatestVersions[p.id]
      ? `/${p.contentDir}/${productLatestVersions[p.id].slug}`
      : `/${p.contentDir}/${p.latestSource}`
    : `/${p.contentDir}`,
  versionedSections: Object.fromEntries(
    (productVersions[p.id] ?? []).map(v => {
      const verSidebarOrder = loadVersionSidebarOrder(p.repo, v.slug) ?? p.sidebarOrder;
      return [v.slug, verSidebarOrder.map(e => typeof e === 'string' ? e : e.dir)];
    })
  ),
}));

function titleCase(name) {
  return name.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

function makeSidebarItems(prefix, sidebarOrder) {
  if (!sidebarOrder || sidebarOrder.length === 0) return [];
  return sidebarOrder
    .map(e => typeof e === 'string' ? { dir: e, label: titleCase(e) } : e)
    .filter(({ dir }) => !prefix || existsSync(`./src/content/docs/${prefix}/${dir}`))
    .map(({ label, dir }) => ({
      label,
      items: [{ autogenerate: { directory: prefix ? `${prefix}/${dir}` : dir, collapsed: true } }],
      collapsed: true,
    }));
}

/** Load a version-specific config from .product-configs/{repoName}.{verSlug}.json */
function loadVersionSidebarOrder(repo, verSlug) {
  const repoName = repo.split('/').pop();
  const path = `.product-configs/${repoName}.${verSlug}.json`;
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf8')).sidebarOrder ?? null;
  } catch (err) {
    console.warn(`Warning: failed to parse version config at ${path}: ${err.message}`);
    return null;
  }
}

// One sidebar topic per product. Products with a configured channel use the latest
// release content for their sidebar, while the topic link stays at the
// product root so the dropdown can distinguish it from version topics.
const productTopics = PRODUCTS.map(product => {
  const latest = productLatestVersions[product.id];
  const useVersionedLatest = Boolean(product.latestSource && latest);
  const prefix = useVersionedLatest
    ? `${product.contentDir}/${latest.slug}`
    : product.latestSource
      ? `${product.contentDir}/${product.latestSource}`
      : product.contentDir;
  const sidebarOrder = useVersionedLatest
    ? loadVersionSidebarOrder(product.repo, latest.slug) ?? product.sidebarOrder
    : product.sidebarOrder;

  return {
    id: product.id,
    label: product.label,
    link: product.link,
    items: makeSidebarItems(prefix, sidebarOrder),
  };
});

const channelTopics = PRODUCTS
  .filter(product => product.latestSource)
  .map(product => ({
    id: `${product.id}-${product.latestSource}`,
    label: product.latestSource,
    link: `${product.link}${product.latestSource}/`,
    items: makeSidebarItems(`${product.contentDir}/${product.latestSource}`, product.sidebarOrder),
  }));

function productContentPrefixes(product) {
  const prefixes = product.latestSource
    ? [
      productLatestVersions[product.id]
        ? `${product.contentDir}/${productLatestVersions[product.id].slug}`
        : `${product.contentDir}/${product.latestSource}`,
      `${product.contentDir}/${product.latestSource}`,
    ]
    : [product.contentDir];

  return [...new Set([
    ...prefixes,
    ...(productVersions[product.id] ?? []).map(version => `${product.contentDir}/${version.slug}`),
  ])];
}

function productLatestContentPrefix(product) {
  if (product.latestSource) {
    return productLatestVersions[product.id]
      ? `${product.contentDir}/${productLatestVersions[product.id].slug}`
      : `${product.contentDir}/${product.latestSource}`;
  }
  return product.contentDir;
}

// One sidebar topic per archived version of each product.
const versionedTopics = PRODUCTS.flatMap(product => {
  const versions = productVersions[product.id] ?? [];
  return versions.map(v => {
    const verSidebarOrder = loadVersionSidebarOrder(product.repo, v.slug) ?? product.sidebarOrder;
    return {
      id: `${product.id}-${v.slug}`,
      label: product.label,
      link: `/${product.contentDir}/${v.slug}/`,
      items: makeSidebarItems(`${product.contentDir}/${v.slug}`, verSidebarOrder),
    };
  });
});

// Unlisted-page topic associations: pages that exist but aren't in any autogenerated
// sidebar section (product root/index pages, 404 pages, versioned 404 pages).
// Computed automatically from products; no manual unlistedPaths needed.
const topicsOption = Object.fromEntries([
  ...PRODUCTS.map((p, i) => {
    const latest = productLatestVersions[p.id];
    const productRoot = p.latestSource && latest
      ? `/${p.contentDir}/${latest.slug}`
      : p.latestSource
        ? `/${p.contentDir}/${p.latestSource}`
        : `/${p.contentDir}`;
    const paths = new Set([productRoot, `${productRoot}/404`, `/${p.contentDir}/404`]);
    return [
      p.id,
      [...paths, ...(i === 0 ? ['/404'] : [])],
    ];
  }),
  ...PRODUCTS
    .filter(product => product.latestSource)
    .map(product => [
      `${product.id}-${product.latestSource}`,
      [`/${product.contentDir}/${product.latestSource}`, `/${product.contentDir}/${product.latestSource}/404`],
    ]),
  ...PRODUCTS.flatMap(product => {
    const versions = productVersions[product.id] ?? [];
    return versions.map(v => {
      const contentDir = `${product.contentDir}/${v.slug}`;
      return [`${product.id}-${v.slug}`, [`/${contentDir}/404`, `/${contentDir}`]];
    });
  }),
]);

let generatedRedirects = {};
try {
  generatedRedirects = JSON.parse(readFileSync('.product-configs/redirects.json', 'utf8'));
} catch { /* not present in local dev */ }

// https://astro.build/config
export default defineConfig({
  site: 'https://docs.defenseunicorns.com/docs/',
  prefetch: true,
  redirects: {
    '/docs': '/',
    '/en': '/',
    ...generatedRedirects,
  },

  integrations: [
    starlight({
      pagination: false,
      routeMiddleware: './src/routeData.ts',
      plugins: [
        starlightGitHubAlerts(),
        starlightLinksValidator({
          exclude: ({ slug }) => /(?:^|\/)404$/.test(slug),
        }),
        starlightImageZoom(),
        starlightLlmsTxt({
          projectName: 'UDS Documentation',
          description: [
            'UDS (Unified Defense Stack) is a secure-by-default Kubernetes platform built on top of Zarf.',
            'It packages and operates production applications on air-gapped and internet-connected clusters.',
          ].join(' '),
          details: PRODUCTS.some(p => p.description) ? [
            '## Products',
            '',
            ...PRODUCTS.filter(p => p.description).map(p => `- **${p.label}**: ${p.description}`),
          ].join('\n') : undefined,
          optionalLinks: [
            ...PRODUCTS.map(p => ({ label: `${p.label} (GitHub)`, url: `https://github.com/${p.repo}` })),
            { label: 'Zarf Docs', url: 'https://docs.zarf.dev/' },
          ],
          // customSets and promote are derived from PRODUCTS + sidebarOrder so they stay
          // in sync automatically when products are added or sections are renamed.
          customSets: PRODUCTS.flatMap(p =>
            p.sidebarOrder.map(e => {
              const entry = typeof e === 'string' ? { dir: e, label: titleCase(e) } : e;
              return {
                label: `${p.label} > ${entry.label}`,
                paths: [`${productLatestContentPrefix(p)}/${entry.dir}/**`],
              };
            })
          ),
          // Products listed earlier in products.json receive higher promotion priority.
          // Product index pages are promoted first, then sections in sidebarOrder sequence.
          // Core is first in products.json, so Core pages sort before CLI pages in llms-full.txt.
          promote: [
            'index*',
            ...PRODUCTS.flatMap(p => productContentPrefixes(p).map(prefix => `${prefix}/index*`)),
            ...PRODUCTS.flatMap(p =>
              productContentPrefixes(p).flatMap(prefix =>
                p.sidebarOrder.map(e => `${prefix}/${typeof e === 'string' ? e : e.dir}/**`)
              )
            ),
          ],
          minify: { note: true, tip: true, caution: true, danger: true, details: true, whitespace: true },
          pageSeparator: '\n\n-----\n\n',
          rawContent: true,
        }),
        starlightSidebarTopics([
          ...productTopics,
          ...channelTopics,
          ...versionedTopics,
        ], { topics: topicsOption }),
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
        light: './src/assets/UDS_Logo_Dark.svg',
        dark: './src/assets/UDS_Logo_White.svg',
        alt: 'Unified Defense Stack'
      },
      components: {
        Banner: './src/components/Banner.astro',
        Footer: './src/components/Footer.astro',
        Head: './src/components/Head.astro',
        Header: './src/components/Header.astro',
        MarkdownContent: './src/components/MarkdownContent.astro',
        ThemeProvider: './src/components/ThemeProvider.astro',
        Sidebar: './src/components/Sidebar.astro',
        Search: './src/components/Search.astro'
      },
      social: [
        {
          icon: 'github',
          href: 'https://github.com/defenseunicorns',
          label: 'GitHub'
        }
      ],
    },
    ),
    react(),
  ],
  markdown: {
    gfm: true,
    remarkPlugins: [
      [remarkLinkRewrite, {
        products: linkRewriteProducts,
        srcDir: fileURLToPath(new URL('./src/content/docs/', import.meta.url)),
      }],
    ],
  },
  vite: {
    resolve: { preserveSymlinks: true },
    define: {
      // Per-product archived versions for VersionPicker, Search, and Header
      __PRODUCT_VERSIONS__: JSON.stringify(
        Object.fromEntries(
          Object.entries(productVersions).map(([id, versions]) => [
            id,
            versions.map(v => ({ display: v.display, slug: v.slug, ref: v.ref })),
          ])
        )
      ),
      // Latest release metadata for VersionPicker
      __PRODUCT_LATEST_VERSIONS__: JSON.stringify(productLatestVersions),
      // Product registry for client-side components (VersionPicker, Search)
      __PRODUCTS__: JSON.stringify(PRODUCTS.map(({ id, label, link, repo, latestSource }) => ({
        id,
        label,
        link,
        githubRepo: repo ?? null,
        latestSource: latestSource ?? null,
      }))),
    },
    plugins: [
      tailwindcss(),
      LikeC4VitePlugin({
        modelRoot: './src/content/docs/.c4/',
        ai: 'disabled',
      }),
    ],
  },
});
