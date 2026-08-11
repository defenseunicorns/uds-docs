/**
 * Shared client-side utilities for product/version detection from the URL.
 * Used by VersionPicker.astro and Search.astro to avoid duplicating logic.
 *
 * Depends on __PRODUCTS__, __PRODUCT_VERSIONS__, and __PRODUCT_LATEST_VERSIONS__
 * injected via Vite define in astro.config.mjs.
 */

/** Client-side representation of an archived version. */
export interface ClientVersion {
  display: string;
  slug: string;
  ref: string;
}

export interface ClientProduct {
  id: string;
  label: string;
  link: string;
  githubRepo: string | null;
  latestSource: string | null;
}

// Injected at build time by Vite's define plugin in astro.config.mjs.
declare const __PRODUCTS__: ClientProduct[];
declare const __PRODUCT_VERSIONS__: Record<string, ClientVersion[]>;
declare const __PRODUCT_LATEST_VERSIONS__: Record<string, ClientVersion>;

export const products: ClientProduct[] =
  typeof __PRODUCTS__ !== 'undefined' ? __PRODUCTS__ : [];

export const productVersions: Record<string, ClientVersion[]> =
  typeof __PRODUCT_VERSIONS__ !== 'undefined' ? __PRODUCT_VERSIONS__ : {};

export const productLatestVersions: Record<string, ClientVersion> =
  typeof __PRODUCT_LATEST_VERSIONS__ !== 'undefined' ? __PRODUCT_LATEST_VERSIONS__ : {};

/** Regex matching a version slug segment (e.g. "v0-61"). */
export const VERSION_SLUG_PATTERN = /^v\d+-\d+$/;

/** Determine which product the current page belongs to based on URL. */
export function detectProduct(path: string): ClientProduct | null {
  // Sort by link length descending so more specific prefixes match first.
  const sorted = [...products].sort((a, b) => b.link.length - a.link.length);
  for (const p of sorted) {
    if (path.startsWith(p.link)) return p;
  }
  return null;
}

/** Extract the version slug from the URL for a given product. */
export function detectVersionSlug(path: string, product: { link: string }): string | null {
  const after = path.startsWith(product.link) ? path.slice(product.link.length) : path;
  const m = after.match(/^(v\d+-\d+)\//);
  return m ? m[1] : null;
}

/** Determine whether the current product page belongs to its configured channel. */
export function detectChannelPath(path: string, product: Pick<ClientProduct, 'link' | 'latestSource'>): boolean {
  if (!product.latestSource) return false;
  const after = path.startsWith(product.link) ? path.slice(product.link.length) : path;
  return after === product.latestSource || after.startsWith(`${product.latestSource}/`);
}

/** Determine both product and version from a URL path. */
export function detectProductAndVersion(path: string): { productId: string | null; versionSlug: string | null } {
  const product = detectProduct(path);
  if (!product) return { productId: null, versionSlug: null };
  return { productId: product.id, versionSlug: detectVersionSlug(path, product) };
}
