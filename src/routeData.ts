// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { PRODUCTS } from './products.ts';

function productFromRouteId(id: string): string {
  // Find the product whose contentDir matches the leading path segment.
  // For versioned pages, the id looks like "v0-61/getting-started/..." (Core)
  // or "fleet/v1-2/overview/..." (Fleet). We match on contentDir first,
  // then strip any version prefix from what remains for the fallback check.
  for (const p of PRODUCTS) {
    if (!p.contentDir) continue;
    if (id.startsWith(p.contentDir + '/')) return p.label;
  }
  // No non-root product matched — it's Core (possibly with a version prefix)
  const core = PRODUCTS.find(p => p.id === 'core');
  return core?.label ?? 'Core';
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  // Pagefind metadata — available for future native meta filtering.
  // Currently unused (Search.astro uses URL-based product matching), but
  // kept so Pagefind indexes products for potential filter upgrades.
  route.head.push({
    tag: 'meta',
    attrs: { 'data-pagefind-meta': `product:${productFromRouteId(route.id)}` },
  });
});