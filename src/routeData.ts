// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { existsSync, readFileSync } from 'fs';
import { PRODUCTS } from './products';

// Build a map from contentDir prefix → product at module load time.
// Route ids look like "core/getting-started/foo" or "cli/reference/overview".
const prefixToProduct = new Map(PRODUCTS.map(p => [p.contentDir, p]));

// Version slugs look like "v0-61", "v1-2", etc.
const VERSION_SLUG_RE = /^v\d+-\d+$/;

// Returns the product if this route is a versioned page, otherwise null.
// e.g. "core/v0-61/getting-started/foo" → Core product
function versionedProduct(id: string) {
  const [contentDir, maybeVersion] = id.split('/');
  if (!maybeVersion || !VERSION_SLUG_RE.test(maybeVersion)) return null;
  return prefixToProduct.get(contentDir) ?? null;
}

// Directory rename map written by integration-script.sh.
// Maps Title Case names back to original kebab-case: { "Local Demo": "local-demo", ... }
// Empty in local dev when the integration script hasn't run.
const dirRenames: Record<string, string> = (() => {
  const path = '.product-configs/dir-renames.json';
  if (!existsSync(path)) return {};
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch {
    return {};
  }
})();

/** Resolve a directory segment back to its original upstream name. */
function resolveOriginalDir(segment: string): string {
  return dirRenames[segment] ?? segment;
}

const CONTENT_DOCS_PATH = 'src/content/docs/';

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  const product = prefixToProduct.get(route.id.split('/')[0]);

  // Pagefind supports inline metadata "key:value" in <head>.
  route.head.push({
    tag: 'meta',
    attrs: {
      'data-pagefind-meta': `product:${product?.label ?? PRODUCTS[0]?.label ?? ''}`,
    },
  });

  // Inject an "older version" banner on all versioned pages.
  const versioned = versionedProduct(route.id);
  if (versioned) {
    const versionSlug = route.id.split('/')[1]; // e.g. "v0-61"
    const versionLabel = versionSlug.replace('-', '.'); // e.g. "v0.61"
    (route.entry.data as Record<string, unknown>).banner = {
      text: `You're viewing docs for ${versionLabel}.`,
      linkHref: versioned.link,
      linkText: 'Go to the latest',
    };
    // No edit link for archived versions — they already show a "Go to the latest" banner.
    return;
  }

  // --- Edit URL ---
  // Skip if frontmatter already provides an explicit URL or disables editing.
  if (route.editUrl) return;
  if ((route.entry.data as Record<string, unknown>).editUrl === false) return;

  const filePath = route.entry.filePath;
  if (!filePath) return;

  // Handle both absolute and relative filePaths.
  const idx = filePath.indexOf(CONTENT_DOCS_PATH);
  if (idx === -1) return;
  const relativePath = filePath.slice(idx + CONTENT_DOCS_PATH.length);

  if (product) {
    // Product page — link to the upstream repo's docs/ directory.
    // Strip the contentDir prefix and resolve renamed directories back to
    // their original names using the map from integration-script.sh.
    const parts = relativePath.split('/').slice(1); // drop contentDir
    if (parts.length === 0) return;
    const upstream = parts.map((seg, i) =>
      i < parts.length - 1 ? resolveOriginalDir(seg) : seg
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
