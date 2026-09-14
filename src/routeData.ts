// src/routeData.ts
import { defineRouteMiddleware } from '@astrojs/starlight/route-data';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { PRODUCTS, DIR_RENAMES_FILENAME, type ProductConfig } from './products';
import { latestProductVersion, latestVersionFor } from './versionUtils';

// Build a map from contentDir prefix → product at module load time.
// Route ids look like "core/getting-started/foo" or "cli/reference/overview".
const prefixToProduct = new Map(PRODUCTS.map(p => [p.contentDir, p]));
const productByRepo = new Map(PRODUCTS.map(p => [p.repo, p]));

// Version slugs look like "v0-61", "v1-2", etc.
const VERSION_SLUG_RE = /^v\d+-\d+$/;

// Returns the product if this route is a versioned page, otherwise null.
// e.g. contentDir="core", maybeVersion="v0-61" → Core product
function versionedProduct(contentDir: string, maybeVersion: string | undefined) {
  if (!maybeVersion || !VERSION_SLUG_RE.test(maybeVersion)) return null;
  return prefixToProduct.get(contentDir) ?? null;
}

// Directory rename map written by the integration build pipeline.
// Maps Title Case names back to original kebab-case: { "Local Demo": "local-demo", ... }
// Empty in local dev when the integration pipeline hasn't run.
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

function toDirectoryUrlSlug(segment: string): string {
  return segment
    .replace(/ & /g, '--')
    .replace(/\s+/g, '-')
    .replaceAll('-and-', '--')
    .toLowerCase();
}

const sourceDirsBySlug = Object.fromEntries(
  Object.entries(dirRenames).map(([sourceDir]) => [toDirectoryUrlSlug(sourceDir), sourceDir]),
);

// Version-specific product configs written by the integration build pipeline.
// Maps "{repoName}.{versionSlug}" → config object with `ref` field.
// Used to determine if a version is branch-sourced for edit URL generation.
interface VersionConfig { ref?: string; repo?: string }
const versionConfigs: Record<string, VersionConfig> = (() => {
  const configDir = '.product-configs';
  if (!existsSync(configDir)) return {};
  const configs: Record<string, VersionConfig> = {};
  try {
    for (const f of readdirSync(configDir)) {
      if (!/\.v\d+-\d+\.json$/.test(f)) continue;
      const key = f.replace(/\.json$/, '');
      try {
        configs[key] = JSON.parse(readFileSync(`${configDir}/${f}`, 'utf8'));
      } catch (e) {
        console.warn(`[routeData] Failed to parse version config ${f}: ${e}`);
      }
    }
  } catch (e) {
    console.warn(`[routeData] Failed to read ${configDir}: ${e}`);
  }
  return configs;
})();

interface VersionsEntry {
  repo?: string;
  latestTag?: string;
  versions?: Array<{ display: string; slug: string }>;
}
const CONTENT_DOCS_PATH = 'src/content/docs/';

const latestVersionsByRepo: Record<string, { slug: string; ref: string }> = (() => {
  if (!existsSync('.versions')) return {};
  try {
    const versions = JSON.parse(readFileSync('.versions', 'utf8')) as Record<string, VersionsEntry>;
    return Object.fromEntries(
      Object.values(versions).flatMap(entry => {
        if (!entry.repo) return [];
        const product = productByRepo.get(entry.repo);
        const latest = product
          ? latestProductVersion(product, versions)
          : latestVersionFor(entry);
        if (!latest) return [];
        return [[entry.repo, { slug: latest.slug, ref: latest.ref }]];
      }),
    );
  } catch (e) {
    console.warn(`[routeData] Failed to parse .versions: ${e}`);
    return {};
  }
})();
const latestSlugsByRepo = Object.fromEntries(
  Object.entries(latestVersionsByRepo).map(([repo, version]) => [repo, version.slug]),
);

export function latestReleaseHref(
  product: Pick<ProductConfig, 'contentDir' | 'link' | 'latestSource'>,
  latestSlug: string,
  currentSlug: string,
  routeId: string,
  fileExists: (path: string) => boolean = existsSync,
  sourceDirs: Record<string, string> = sourceDirsBySlug,
): string {
  const latestPrefix = product.latestSource
    ? `${product.link}${latestSlug}/`
    : product.link;
  const fallback = latestPrefix;
  const routePrefix = `${product.contentDir}/${currentSlug}`;
  if (routeId !== routePrefix && !routeId.startsWith(`${routePrefix}/`)) return fallback;

  const latestContentPrefix = product.latestSource
    ? `${CONTENT_DOCS_PATH}${product.contentDir}/${latestSlug}`
    : `${CONTENT_DOCS_PATH}${product.contentDir}`;
  const relativePath = routeId.slice(routePrefix.length).replace(/^\/+|\/+$/g, '');
  const sourceRelativePath = relativePath && relativePath !== 'index'
    ? relativePath.split('/').map((segment, index, segments) =>
      index < segments.length - 1 ? (sourceDirs[segment] ?? segment) : segment,
    ).join('/')
    : relativePath;
  const latestPath = sourceRelativePath && sourceRelativePath !== 'index'
    ? `${latestContentPrefix}/${sourceRelativePath}`
    : latestContentPrefix;
  const latestFiles = sourceRelativePath && sourceRelativePath !== 'index'
    ? [`${latestPath}.md`, `${latestPath}.mdx`, `${latestPath}/index.md`, `${latestPath}/index.mdx`]
    : [`${latestPath}/index.md`, `${latestPath}/index.mdx`];
  if (!latestFiles.some(fileExists)) return fallback;

  if (relativePath !== '' && relativePath !== 'index') {
    // sub folder route breaking change reroute
    if (currentSlug !== 'main' && latestSlug !== 'main') {
      if (routeId.split('/')[0] === 'core') {
        let current = currentSlug.replace(/^v/, '').split('-').map(Number);
        let latest = latestSlug.replace(/^v/, '').split('-').map(Number);

        // check if using affected versions
        if ((current[0] === 1 && latest[0] === 1) && (current[1] <= 10 && latest[1] >= 11)) {
          let splitPath = relativePath.split('/')
          // check if on affected route
          if (splitPath[0] === "how-to-guides" && splitPath[1] === "logging") {
            splitPath[1] = "monitoring--observability"
            let joinedPath = splitPath.join("/")

            return `${latestPrefix}${joinedPath}/`
          }
        }
      }
    }

    return `${latestPrefix}${relativePath}/`
  } else {
    return latestPrefix
  }
}

export const onRequest = defineRouteMiddleware((context) => {
  const route = context.locals.starlightRoute;

  // Defensive: route/head should exist on normal Starlight pages
  if (!route?.head || !route?.id) return;

  // Split once — used for both product detection and version detection below.
  const [contentDir, maybeVersion] = route.id.split('/');
  const product = prefixToProduct.get(contentDir);
  const entryData = route.entry.data as Record<string, unknown>;
  const latestSlug = product ? latestSlugsByRepo[product.repo] : undefined;
  entryData.pagefindVersion = product?.latestSource && maybeVersion === product.latestSource
    ? product.latestSource
    : maybeVersion === latestSlug
      ? 'latest'
      : VERSION_SLUG_RE.test(maybeVersion ?? '')
        ? maybeVersion
        : latestSlug ?? 'current';

  // Pagefind supports inline metadata "key:value" in <head>.
  route.head.push({
    tag: 'meta',
    attrs: {
      'data-pagefind-meta': `product:${product?.label ?? PRODUCTS[0]?.label ?? ''}`,
    },
  });
  if (product?.latestSource) {
    route.head.push({
      tag: 'meta',
      attrs: { 'data-product-channel': product.latestSource },
    });
  }

  // Inject an "older version" banner on all versioned pages.
  const versioned = versionedProduct(contentDir, maybeVersion);
  if (product?.latestSource && maybeVersion === product.latestSource) {
    if (latestSlug) {
      entryData.banner = {
        text: `You're viewing unreleased documentation from ${product.latestSource}.`,
        linkHref: latestReleaseHref(product, latestSlug, product.latestSource, route.id),
        linkText: 'Go to the latest release',
      };
    }

    if (!route.editUrl && entryData.editUrl !== false) {
      const filePath = route.entry.filePath;
      const idx = filePath?.indexOf(CONTENT_DOCS_PATH) ?? -1;
      if (filePath && idx !== -1) {
        const relativePath = filePath.slice(idx + CONTENT_DOCS_PATH.length);
        const parts = relativePath.split('/').slice(2);
        if (parts.length > 0) {
          const upstream = parts.map((seg, i) =>
            i < parts.length - 1 ? (dirRenames[seg] ?? seg) : seg
          );
          route.editUrl = new URL(
            `https://github.com/${product.repo}/blob/${product.latestSource}/docs/${upstream.join('/')}`
          );
        }
      }
    }
    return;
  }

  if (versioned) {
    // Replace all hyphens: "v0-61" → "v0.61" (version slugs use hyphens for Astro compat)
    const versionLabel = maybeVersion!.replace(/-/g, '.');
    if (maybeVersion !== latestSlugsByRepo[versioned.repo]) {
      (route.entry.data as Record<string, unknown>).banner = {
        text: `You're viewing docs for ${versionLabel}.`,
        linkHref: latestSlugsByRepo[versioned.repo]
          ? latestReleaseHref(
            versioned,
            latestSlugsByRepo[versioned.repo],
            maybeVersion!,
            route.id,
          )
          : versioned.link,
        linkText: 'Go to the latest release',
      };
    }

    // For branch-sourced versions, generate edit URL pointing to the release branch.
    // Respect frontmatter overrides: skip if editUrl is already set or explicitly disabled.
    const repoName = versioned.repo.split('/').pop()!;
    const verConfig = versionConfigs[`${repoName}.${maybeVersion}`];
    if (
      verConfig?.ref?.startsWith('release/') &&
      !route.editUrl &&
      entryData.editUrl !== false
    ) {
      const filePath = route.entry.filePath;
      if (filePath) {
        const idx = filePath.indexOf(CONTENT_DOCS_PATH);
        if (idx !== -1) {
          const relativePath = filePath.slice(idx + CONTENT_DOCS_PATH.length);
          // Strip contentDir + versionSlug prefix (e.g. "core/v1-0/getting-started/foo.md" → "getting-started/foo.md")
          const parts = relativePath.split('/').slice(2);
          if (parts.length > 0) {
            const upstream = parts.map((seg, i) =>
              i < parts.length - 1 ? (dirRenames[seg] ?? seg) : seg
            );
            route.editUrl = new URL(
              `https://github.com/${versioned.repo}/blob/${verConfig.ref}/docs/${upstream.join('/')}`
            );
          }
        }
      }
    }
    return;
  }

  // --- Edit URL ---
  // Skip if frontmatter already provides an explicit URL. Starlight resolves
  // frontmatter.editUrl (string) into route.editUrl before this middleware runs.
  // When frontmatter.editUrl === false, Starlight leaves route.editUrl undefined,
  // so we check route.entry.data directly to catch the "disable" case.
  if (route.editUrl) return;
  if (entryData.editUrl === false) return;

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
    const source = product.latestSource
      ?? latestVersionsByRepo[product.repo]?.ref
      ?? 'main';
    route.editUrl = new URL(
      `https://github.com/${product.repo}/blob/${source}/docs/${upstream.join('/')}`
    );
  } else {
    // Non-product page (e.g. root-level docs) — link to uds-docs repo.
    route.editUrl = new URL(
      `https://github.com/defenseunicorns/uds-docs/blob/main/src/content/docs/${relativePath}`
    );
  }
});
