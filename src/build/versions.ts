/**
 * Version discovery for upstream product repos.
 *
 * Queries GitHub releases to find the latest tag and archived minor versions.
 * Results are written to `.versions` by the integration orchestrator.
 */

import { readFileSync } from 'fs';
import { join } from 'path';
import type { ArchivedVersion, DocsConfig, OverridesMap, VersionEntry, VersionsFile } from './types';
import { latestVersionFor, minorKey } from '../versionUtils';

export { minorKey };

// ---------------------------------------------------------------------------
// Archived version normalization
// ---------------------------------------------------------------------------

/**
 * Normalize a git ref (tag or branch) into an `ArchivedVersion` with
 * pre-computed display label and URL slug.
 *
 * Tags:    `"v1.0.0"` → `{ ref: "v1.0.0", display: "v1.0", slug: "v1-0" }`
 * Branches: `"release/1.0"` → `{ ref: "release/1.0", display: "v1.0", slug: "v1-0" }`
 */
export function toArchivedVersion(ref: string): ArchivedVersion {
  let major: string;
  let minor: string;

  const branchMatch = /^release\/(\d+)\.(\d+)$/.exec(ref);
  if (branchMatch) {
    major = branchMatch[1];
    minor = branchMatch[2];
  } else {
    const tagMatch = /^v?(\d+)\.(\d+)(?:\.\d+)?$/.exec(ref);
    if (!tagMatch) {
      throw new Error(
        `Cannot normalize ref "${ref}" — expected tag like "v1.0.0" or branch "release/1.0" with numeric major/minor`,
      );
    }
    major = tagMatch[1];
    minor = tagMatch[2];
  }

  const majorMinor = `${major}.${minor}`;
  return {
    ref,
    display: `v${majorMinor}`,
    slug: `v${majorMinor.replace(/\./g, '-')}`,
  };
}

function refsShareMinorVersion(first: string | undefined, second: string | null): boolean {
  if (!first || !second) return false;
  try {
    return toArchivedVersion(first).display === toArchivedVersion(second).display;
  } catch {
    return false;
  }
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
// GitHub API helpers
// ---------------------------------------------------------------------------

function githubHeaders(): Record<string, string> {
  const headers: Record<string, string> = { Accept: 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  return headers;
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
): Promise<{ latestTag: string | null; archived: ArchivedVersion[] }> {
  const headers = githubHeaders();

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

  // Sort by semver descending so latestTag is always the highest version,
  // regardless of release creation order (guards against backports appearing first).
  uniqueMinors.sort((a, b) => {
    const parse = (t: string) => t.replace(/^v/, '').split('.').map(Number);
    const [aMaj = 0, aMin = 0, aPat = 0] = parse(a);
    const [bMaj = 0, bMin = 0, bPat = 0] = parse(b);
    return bMaj - aMaj || bMin - aMin || bPat - aPat;
  });

  return {
    latestTag: uniqueMinors[0] ?? null,
    archived: uniqueMinors.slice(1, count + 1).flatMap(tag => {
      try {
        return [toArchivedVersion(tag)];
      } catch {
        console.warn(`Warning: skipping unparseable release tag "${tag}" for ${repo}`);
        return [];
      }
    }),
  };
}

// ---------------------------------------------------------------------------
// GitHub branch-based version discovery
// ---------------------------------------------------------------------------

/** Pattern matching `release/X.Y` (exactly two numeric parts). */
const RELEASE_BRANCH_RE = /^release\/(\d+)\.(\d+)$/;

/**
 * Query GitHub refs API for `release/*` branches and return the latest `count`
 * as `ArchivedVersion[]`, sorted by semver descending.
 */
export async function discoverBranchVersions(
  repo: string,
  count: number,
): Promise<ArchivedVersion[]> {
  const headers = githubHeaders();

  let res: Response;
  try {
    res = await fetch(
      `https://api.github.com/repos/${repo}/git/matching-refs/heads/release/?per_page=100`,
      { headers },
    );
  } catch (err) {
    console.warn(`Warning: network error fetching branch refs for ${repo}: ${err}`);
    return [];
  }

  if (!res.ok) {
    console.warn(`Warning: GitHub API returned ${res.status} ${res.statusText} for ${repo} branch refs`);
    return [];
  }

  let refs: unknown;
  try {
    refs = await res.json();
  } catch {
    console.warn(`Warning: failed to parse GitHub refs API response for ${repo}`);
    return [];
  }
  if (!Array.isArray(refs)) {
    console.warn(
      `Warning: unexpected GitHub refs API response for ${repo}: ${JSON.stringify(refs).slice(0, 200)}`,
    );
    return [];
  }

  // Extract branch names matching release/X.Y and pre-parse version numbers
  const parsed = (refs as Array<{ ref: string }>)
    .map(r => r.ref.startsWith('refs/heads/') ? r.ref.slice('refs/heads/'.length) : r.ref)
    .flatMap(name => {
      const m = name.match(RELEASE_BRANCH_RE);
      return m ? [{ name, maj: Number(m[1]), min: Number(m[2]) }] : [];
    });

  // Sort by semver descending
  parsed.sort((a, b) => b.maj - a.maj || b.min - a.min);

  return parsed.slice(0, count).map(p => toArchivedVersion(p.name));
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
        const versions: ArchivedVersion[] = [];
        for (const ref of product.archiveVersions) {
          try {
            versions.push(toArchivedVersion(ref));
          } catch (err) {
            console.warn(`${repo}: skipping invalid archiveVersions entry "${ref}" — ${(err as Error).message}`);
          }
        }
        console.log(
          `${repo}: using explicit archiveVersions (${versions.map(v => v.ref).join(', ') || '(none)'})`,
        );
        return [repo, { repo, branch: product.branch ?? 'main', versions }];
      }

      const localOverridePath = overrides[repoName];
      const docsConfig = await fetchDocsConfig(repo, configBranch, localOverridePath);
      const archiveCount = docsConfig?.archiveCount ?? 0;
      const versionSource = docsConfig?.versionSource ?? 'tag';
      const hasExplicitLatestSource = product.branch !== undefined;

      console.log(`${repo}: discovering versions (source: ${versionSource})...`);

      let versions: ArchivedVersion[];
      let latestTag: string | null;
      if (versionSource === 'branch') {
        // Branch-based: archived versions come from release/* branches,
        // but latestTag still comes from the releases API. An explicit
        // source gets the current release unless it is that release itself.
        const [candidates, releaseResult] = await Promise.all([
          discoverBranchVersions(repo, archiveCount + 1),
          discoverVersions(repo, 0),
        ]);
        latestTag = releaseResult.latestTag;
        const latestDocsUseCurrentRelease = refsShareMinorVersion(product.branch, latestTag);
        const latestDisplay = latestTag ? latestVersionFor({ latestTag })?.display ?? null : null;
        const includeLatestRelease = hasExplicitLatestSource && !latestDocsUseCurrentRelease;
        versions = candidates
          .filter(v => includeLatestRelease || v.display !== latestDisplay)
          .slice(0, archiveCount + (includeLatestRelease ? 1 : 0));
      } else {
        const result = await discoverVersions(
          repo,
          archiveCount + (hasExplicitLatestSource ? 1 : 0),
        );
        latestTag = result.latestTag;
        const latestDocsUseCurrentRelease = refsShareMinorVersion(product.branch, latestTag);
        const includeLatestRelease = hasExplicitLatestSource && !latestDocsUseCurrentRelease;
        if (includeLatestRelease && latestTag) {
          try {
            versions = [toArchivedVersion(latestTag), ...result.archived].slice(0, archiveCount + 1);
          } catch {
            versions = result.archived.slice(0, archiveCount);
          }
        } else {
          versions = result.archived.slice(0, archiveCount);
        }
      }

      console.log(
        `${repo}: latest tag = ${latestTag ?? '(none)'}, archived = ${versions.map(v => v.ref).join(', ') || '(none)'}`,
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
