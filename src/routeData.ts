// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { existsSync, readFileSync } from 'fs';
import { PRODUCTS, DIR_RENAMES_FILENAME } from './products';

// Build a map from contentDir prefix → product at module load time.
// Route ids look like "core/getting-started/foo" or "cli/reference/overview".
const prefixToProduct = new Map(PRODUCTS.map(p => [p.contentDir, p]));

// Version slugs look like "v0-61", "v1-2", etc.
const VERSION_SLUG_RE = /^v\d+-\d+$/;

// Returns the product if this route is a versioned page, otherwise null.
// e.g. contentDir="core", maybeVersion="v0-61" → Core product
function versionedProduct(contentDir: string, maybeVersion: string | undefined) {
  if (!maybeVersion || !VERSION_SLUG_RE.test(maybeVersion)) return null;
  return prefixToProduct.get(contentDir) ?? null;
}

// Directory rename map written by integration.ts (step 7).
// Maps Title Case names back to original kebab-case: { "Local Demo": "local-demo", ... }
// Empty in local dev when the integration script hasn't run.
// NOTE: Relative path works because Astro sets CWD to the project root during build.
const dirRenames: Record<string, string> = (() => {
  const path = `.product-configs/${DIR_RENAMES_FILENAME}`;
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    console.warn(`[routeData] Failed to parse ${DIR_RENAMES_FILENAME}: ${e}`);
    return {};
  }
})();

const CONTENT_DOCS_PATH = 'src/content/docs/';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  // Split once — used for both product detection and version detection below.
  const [contentDir, maybeVersion] = route.id.split('/');
  const product = prefixToProduct.get(contentDir);

  // Pagefind supports inline metadata "key:value" in <head>.
  route.head.push({
    tag: 'meta',
    attrs: {
      'data-pagefind-meta': `product:${product?.label ?? PRODUCTS[0]?.label ?? ''}`,
    },
  });

  // Inject an "older version" banner on all versioned pages.
  const versioned = versionedProduct(contentDir, maybeVersion);
  if (versioned) {
    // Replace all hyphens: "v0-61" → "v0.61" (version slugs use hyphens for Astro compat)
    const versionLabel = maybeVersion!.replace(/-/g, '.');
    (route.entry.data as Record<string, unknown>).banner = {
      text: `You're viewing docs for ${versionLabel}.`,
      linkHref: versioned.link,
      linkText: 'Go to the latest',
    };
    // No edit link for archived versions — they already show a "Go to the latest" banner.
    return;
  }

  // --- Edit URL ---
  // Skip if frontmatter already provides an explicit URL. Starlight resolves
  // frontmatter.editUrl (string) into route.editUrl before this middleware runs.
  // When frontmatter.editUrl === false, Starlight leaves route.editUrl undefined,
  // so we check route.entry.data directly to catch the "disable" case.
  if (route.editUrl) return;
  if ((route.entry.data as Record<string, unknown>).editUrl === false) return;

  const filePath = route.entry.filePath;
  if (!filePath) return;

  const idx = filePath.indexOf(CONTENT_DOCS_PATH);
  if (idx === -1) return;
  const relativePath = filePath.slice(idx + CONTENT_DOCS_PATH.length);

  if (product) {
    // Product page — link to the upstream repo's docs/ directory.
    // Strip the contentDir prefix and resolve any Title Case directory names
    // back to their original kebab-case names using the map from integration.ts.
    const parts = relativePath.split('/').slice(1); // drop contentDir prefix
    if (parts.length === 0) return;
    // Resolve all segments except the last (filename) — only directories are renamed.
    const upstream = parts.map((seg, i) =>
      i < parts.length - 1 ? (dirRenames[seg] ?? seg) : seg
    );
    route.editUrl = new URL(
      `https://github.com/${product.repo}/blob/main/docs/${upstream.join('/')}`
    );
  } else {
    // Non-product page (e.g. root-level docs) — link to uds-docs repo.
    route.editUrl = new URL(
      `https://github.com/defenseunicorns/uds-docs/blob/main/src/content/docs/${relativePath}`
    );
  }
});
