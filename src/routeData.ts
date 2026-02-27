// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';

function productFromRouteId(id: string): string {
  // id is like: "registry/...", "fleet/...", or "getting-started/..." etc.
  const first = id.split('/')[0];

  if (first === 'registry') return 'Registry';
  if (first === 'fleet') return 'Fleet';
  return 'UDS Core';
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  const product = productFromRouteId(route.id);

  // Pagefind supports inline metadata "key:value" and it can live in <head>.
  route.head.push({
    tag: 'meta',
    attrs: {
      'data-pagefind-meta': `product:${product}`,
    },
  });
});