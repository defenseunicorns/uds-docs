// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
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
      content: `You're viewing docs for ${versionLabel}. <a href="${versioned.link}">Go to the latest</a>`,
    };
  }
});
