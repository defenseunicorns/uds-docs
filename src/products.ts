/**
 * Product configuration — resolved from upstream docs.config.json files.
 *
 * To add a new product:
 *   1. Add an entry to src/products.json (repo, optional branch, optional archiveCount).
 *   2. Ensure the upstream repo has a docs/docs.config.json defining id, label, contentDir, sidebarOrder.
 *   3. Run `npm run build` to verify everything wires up.
 *
 * See CONTRIBUTING.md → "Adding a New Product" for the full walkthrough.
 */

import { existsSync, readdirSync, readFileSync } from 'fs';

/** Resolved product config — merged from products.json + upstream docs.config.json */
export interface ProductConfig {
  id: string;
  label: string;
  link: string;
  contentDir: string;
  repo: string;
  sidebarOrder: (string | { dir: string; label: string })[];
}

/**
 * Convert a semver tag to a URL-safe slug (drop patch, dots → hyphens).
 * Hyphens are required because Astro strips dots from content collection slugs.
 * e.g. v0.61.0 → v0-61, v1.2.0 → v1-2
 */
export function versionSlug(ver: string): string {
  return ver.replace(/\.\d+$/, '').replace(/\./g, '-');
}

/**
 * Build the versioned content directory path for a product + version.
 * e.g. contentDir 'my-product' + ver 'v0.61.0' → 'my-product/v0-61'
 */
export function versionedContentDir(product: ProductConfig, ver: string): string {
  const slug = versionSlug(ver);
  return product.contentDir ? `${product.contentDir}/${slug}` : slug;
}

/**
 * Build the versioned URL prefix for a product + version.
 * e.g. contentDir 'my-product' + ver 'v0.61.0' → '/my-product/v0-61/'
 */
export function versionedLink(product: ProductConfig, ver: string): string {
  const slug = versionSlug(ver);
  return product.contentDir ? `/${product.contentDir}/${slug}/` : `/${slug}/`;
}

/**
 * Load resolved product configs from .product-configs/ directory.
 * The integration script writes these after cloning upstream repos and
 * reading their docs/docs.config.json files.
 *
 * Falls back to an empty array when .product-configs/ does not exist
 * (e.g. local dev without running the integration script).
 */
export function loadProductConfigs(): ProductConfig[] {
  const configDir = '.product-configs';
  if (!existsSync(configDir)) return [];
  return readdirSync(configDir)
    .filter(f => f.endsWith('.json') && !/\.v\d+-\d+\.json$/.test(f))
    .map(f => {
      const path = `${configDir}/${f}`;
      try {
        const data = JSON.parse(readFileSync(path, 'utf8'));
        for (const field of ['id', 'label', 'contentDir'] as const) {
          if (!data[field]) throw new Error(`missing required field '${field}'`);
        }
        return {
          id: data.id,
          label: data.label,
          link: `/${data.contentDir}/`,
          contentDir: data.contentDir,
          repo: data.repo,
          sidebarOrder: data.sidebarOrder ?? [],
        };
      } catch (err) {
        throw new Error(`Failed to parse product config ${path}: ${(err as Error).message}`);
      }
    });
}

export const PRODUCTS: ProductConfig[] = loadProductConfigs();
