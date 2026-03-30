/**
 * Version discovery for upstream product repos.
 *
 * Queries GitHub releases to find the latest tag and archived minor versions.
 * Results are written to `.versions` by the integration orchestrator.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { DocsConfig, OverridesMap, VersionEntry, VersionsFile } from './types';

// ---------------------------------------------------------------------------
// Minor version key
// ---------------------------------------------------------------------------

/** Strip the patch version from a semver tag: `v0.61.1` → `v0.61`. */
export function minorKey(tag: string): string {
  return tag.replace(/\.\d+$/, '');
}

// ---------------------------------------------------------------------------
// docs.config.json fetching
// ---------------------------------------------------------------------------

/** Read a product's `docs.config.json` from a local path or GitHub. Returns `null` on failure. */
export async function fetchDocsConfig(
  repo: string,
  branch: string,
  localOverridePath?: string,
): Promise<DocsConfig | null> {
  if (localOverridePath) {
    try {
      const raw = readFileSync(join(localOverridePath, 'docs', 'docs.config.json'), 'utf8');
      return JSON.parse(raw) as DocsConfig;
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(
      `https://raw.githubusercontent.com/${repo}/${branch}/docs/docs.config.json`,
    );
    if (!res.ok) return null;
    return (await res.json()) as DocsConfig;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// GitHub releases querying
// ---------------------------------------------------------------------------

/**
 * Query GitHub Releases for the latest tag and `count` archived minor versions.
 * Deduplicates by minor version (keeps newest patch). Excludes prereleases/drafts.
 * Returns `{ latestTag: null, archived: [] }` on any API error (non-fatal).
 */
export async function discoverVersions(
  repo: string,
  count = 0,
): Promise<{ latestTag: string | null; archived: string[] }> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const perPage = Math.max((count + 1) * 5, 10);
  let res: Response;
  try {
    res = await fetch(`https://api.github.com/repos/${repo}/releases?per_page=${perPage}`, {
      headers,
    });
  } catch (err) {
    console.warn(`Warning: network error fetching releases for ${repo}: ${err}`);
    return { latestTag: null, archived: [] };
  }

  if (!res.ok) {
    console.warn(`Warning: GitHub API returned ${res.status} ${res.statusText} for ${repo}`);
    return { latestTag: null, archived: [] };
  }

  let releases: unknown;
  try {
    releases = await res.json();
  } catch {
    console.warn(`Warning: failed to parse GitHub API response for ${repo}`);
    return { latestTag: null, archived: [] };
  }
  if (!Array.isArray(releases)) {
    console.warn(
      `Warning: unexpected GitHub API response for ${repo}: ${JSON.stringify(releases).slice(0, 200)}`,
    );
    return { latestTag: null, archived: [] };
  }

  const tags = (releases as Array<{ tag_name: string; prerelease: boolean; draft: boolean }>)
    .filter(r => !r.prerelease && !r.draft)
    .map(r => r.tag_name);

  // Deduplicate: keep only the latest patch per minor version.
  const seen = new Set<string>();
  const uniqueMinors: string[] = [];
  for (const tag of tags) {
    const minor = minorKey(tag);
    if (!seen.has(minor)) {
      seen.add(minor);
      uniqueMinors.push(tag);
    }
  }

  return {
    latestTag: uniqueMinors[0] ?? null,
    archived: uniqueMinors.slice(1, count + 1),
  };
}

// ---------------------------------------------------------------------------
// Full version discovery
// ---------------------------------------------------------------------------

/**
 * Discover versions for all products in parallel.
 * When `archiveVersions` is set on a product entry, GitHub discovery is
 * skipped and those tags are used directly (for offline test fixtures).
 */
export async function discoverAllVersions(
  products: Array<{ repo: string; branch?: string; archiveVersions?: string[] }>,
  overrides: OverridesMap,
): Promise<VersionsFile> {
  const entries = await Promise.all(
    products.map(async (product): Promise<[string, VersionEntry]> => {
      const repo = product.repo;
      const repoName = repo.split('/').pop()!;
      const configBranch = product.branch ?? 'main';

      if (product.archiveVersions) {
        console.log(
          `${repo}: using explicit archiveVersions (${product.archiveVersions.join(', ') || '(none)'})`,
        );
        return [repo, { repo, branch: product.branch ?? 'main', versions: product.archiveVersions }];
      }

      const localOverridePath = overrides[repoName];
      const docsConfig = await fetchDocsConfig(repo, configBranch, localOverridePath);
      const archiveCount = docsConfig?.archiveCount ?? 0;

      console.log(`${repo}: discovering versions...`);
      const { latestTag, archived: versions } = await discoverVersions(repo, archiveCount);
      console.log(
        `${repo}: latest tag = ${latestTag ?? '(none)'}, archived = ${versions.join(', ') || '(none)'}`,
      );

      // Branch: explicit > latest release tag > 'main'
      const entry: VersionEntry = {
        repo,
        branch: product.branch ?? latestTag ?? 'main',
        versions,
      };
      if (latestTag) entry.latestTag = latestTag;

      return [repo, entry];
    }),
  );

  return Object.fromEntries(entries);
}

// ---------------------------------------------------------------------------
// DOCS_OVERRIDES parsing
// ---------------------------------------------------------------------------

/** Parse `DOCS_OVERRIDES` env var (`"key=/path;key2=/path2"`) into a map. */
export function parseOverrides(envVar: string | undefined): OverridesMap {
  const overrides: OverridesMap = {};
  if (!envVar) return overrides;
  for (const pair of envVar.split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const key = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1).trim();
      if (key && val) overrides[key] = val;
    }
  }
  return overrides;
}

// ---------------------------------------------------------------------------
// products.json reading
// ---------------------------------------------------------------------------

/** Read and parse `src/products.json` (or override path from `PRODUCTS_JSON` env var). */
export function readProductsJson(
  path = 'src/products.json',
): Array<{ repo: string; branch?: string; archiveVersions?: string[] }> {
  return JSON.parse(readFileSync(path, 'utf8')) as Array<{
    repo: string;
    branch?: string;
    archiveVersions?: string[];
  }>;
}
