// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { PRODUCTS } from './products';

// Build a map from contentDir prefix → product label at module load time.
// Non-core products have a non-empty contentDir (e.g. "cli").
// Core has contentDir "" and is the fallback.
const prefixToLabel = new Map<string, string>(
  PRODUCTS
    .filter(p => p.contentDir !== '')
    .map(p => [p.contentDir, p.label])
);

const coreLabel = PRODUCTS.find(p => p.contentDir === '')?.label ?? 'Core';

function productFromRouteId(id: string): string {
  // Route id is like "cli/reference/cli/overview" or "getting-started/foo"
  const first = id.split('/')[0];
  return prefixToLabel.get(first) ?? coreLabel;
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  const product = productFromRouteId(route.id);

  // Pagefind supports inline metadata "key:value" in <head>.
  route.head.push({
    tag: 'meta',
    attrs: {
      'data-pagefind-meta': `product:${product}`,
    },
  });
});
