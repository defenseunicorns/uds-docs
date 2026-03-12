/**
 * Shared client-side utilities for product/version detection from the URL.
 * Used by VersionPicker.astro and Search.astro to avoid duplicating logic.
 *
 * Depends on __PRODUCTS__, __PRODUCT_VERSIONS__, and __PRODUCT_LATEST_TAGS__
 * injected via Vite define in astro.config.mjs.
 */

declare const __PRODUCTS__: Array<{ id: string; label: string; link: string; githubRepo: string | null }>;
declare const __PRODUCT_VERSIONS__: Record<string, string[]>;
declare const __PRODUCT_LATEST_TAGS__: Record<string, string>;

export const products: Array<{ id: string; label: string; link: string; githubRepo: string | null }> =
  typeof __PRODUCTS__ !== 'undefined' ? __PRODUCTS__ : [];

export const productVersions: Record<string, string[]> =
  typeof __PRODUCT_VERSIONS__ !== 'undefined' ? __PRODUCT_VERSIONS__ : {};

export const productLatestTags: Record<string, string> =
  typeof __PRODUCT_LATEST_TAGS__ !== 'undefined' ? __PRODUCT_LATEST_TAGS__ : {};

/** Convert semver tag to URL slug: v0.61.0 → v0-61 */
export function versionSlug(ver: string): string {
  return ver.replace(/\.\d+$/, '').replace(/\./g, '-');
}

/** Determine which product the current page belongs to based on URL. */
export function detectProduct(path: string): { id: string; label: string; link: string } | null {
  // Check non-core products first (more specific paths)
  const nonCore = products.filter(p => p.id !== 'core');
  for (const p of nonCore) {
    if (path.startsWith(p.link)) return p;
  }
  return products.find(p => p.id === 'core') ?? null;
}

/** Extract the version slug from the URL for a given product. */
export function detectVersionSlug(path: string, product: { link: string }): string | null {
  const after = path.startsWith(product.link) ? path.slice(product.link.length) : path;
  const m = after.match(/^(v\d+-\d+)\//);
  return m ? m[1] : null;
}

/** Determine both product and version from a URL path. */
export function detectProductAndVersion(path: string): { productId: string; versionSlug: string | null } {
  const product = detectProduct(path);
  if (!product) return { productId: 'core', versionSlug: null };
  return { productId: product.id, versionSlug: detectVersionSlug(path, product) };
}
