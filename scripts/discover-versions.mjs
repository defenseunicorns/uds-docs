#!/usr/bin/env node
/**
 * Reads product configuration from src/products.json, discovers the latest
 * release tag and archived versions for each product, and writes .versions JSON
 * with all metadata the integration script needs.
 *
 * Usage:
 *   node scripts/discover-versions.mjs
 *
 * Respects GITHUB_TOKEN env var for authenticated API requests.
 *
 * archiveCount is read from each product's upstream docs/docs.config.json.
 * When DOCS_OVERRIDES is set, the local path is used instead of fetching from GitHub.
 */
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const PRODUCTS = JSON.parse(readFileSync(new URL('../src/products.json', import.meta.url), 'utf8'));

// Parse DOCS_OVERRIDES="uds-core=/path;uds-cli=/path2" — repo-level keys only (no @tag)
const OVERRIDES = {};
if (process.env.DOCS_OVERRIDES) {
  for (const pair of process.env.DOCS_OVERRIDES.split(';')) {
    const eq = pair.indexOf('=');
    if (eq > 0) {
      const key = pair.slice(0, eq).trim();
      const val = pair.slice(eq + 1).trim();
      if (key && val && !key.includes('@')) OVERRIDES[key] = val;
    }
  }
}

/**
 * Read docs.config.json for a product. Uses the local override path when available,
 * otherwise fetches from GitHub raw content. Returns null on failure.
 */
async function fetchDocsConfig(repo, branch, localOverridePath) {
  if (localOverridePath) {
    try {
      return JSON.parse(readFileSync(join(localOverridePath, 'docs', 'docs.config.json'), 'utf8'));
    } catch {
      return null;
    }
  }
  try {
    const res = await fetch(`https://raw.githubusercontent.com/${repo}/${branch}/docs/docs.config.json`);
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/** Extract the minor version key from a semver tag: v0.61.1 → v0.61 */
function minorKey(tag) {
  return tag.replace(/\.\d+$/, '');
}

async function discoverVersions(repo, count = 0) {
  const headers = { 'Accept': 'application/vnd.github+json' };
  const token = process.env.GITHUB_TOKEN?.trim();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Fetch enough releases to find `count` archived minor versions plus the latest
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=${Math.max((count + 1) * 5, 10)}`,
    { headers }
  );

  if (!res.ok) {
    console.error(`Warning: GitHub API returned ${res.status} ${res.statusText} for ${repo}`);
    return { latestTag: null, archived: [] };
  }

  let releases;
  try {
    releases = await res.json();
  } catch {
    console.error(`Warning: failed to parse GitHub API response for ${repo}`);
    return { latestTag: null, archived: [] };
  }
  if (!Array.isArray(releases)) {
    console.error(`Warning: unexpected GitHub API response for ${repo}: ${JSON.stringify(releases).slice(0, 200)}`);
    return { latestTag: null, archived: [] };
  }
  const tags = releases
    .filter(r => !r.prerelease && !r.draft)
    .map(r => r.tag_name);

  // Deduplicate: keep only the latest patch per minor version.
  // GitHub returns releases newest-first, so the first tag we see for each
  // minor version is already the latest patch.
  const seen = new Set();
  const uniqueMinors = [];
  for (const tag of tags) {
    const minor = minorKey(tag);
    if (!seen.has(minor)) {
      seen.add(minor);
      uniqueMinors.push(tag);
    }
  }

  // Index 0 is the latest release tag; the rest are archived versions.
  return {
    latestTag: uniqueMinors[0] ?? null,
    archived: uniqueMinors.slice(1, count + 1),
  };
}

async function main() {
  const output = {};

  for (const product of PRODUCTS) {
    const repo = product.repo;
    const repoName = repo.split('/').pop();
    const configBranch = product.branch ?? 'main';
    const docsConfig = await fetchDocsConfig(repo, configBranch, OVERRIDES[repoName]);
    const archiveCount = docsConfig?.archiveCount ?? 0;

    const entry = { repo };

    console.log(`${repo}: discovering versions...`);
    const { latestTag, archived: versions } = await discoverVersions(repo, archiveCount);
    console.log(`${repo}: latest tag = ${latestTag ?? '(none)'}, archived = ${versions.join(', ') || '(none)'}`);

    // Branch resolution:
    // - If branch is set in products.json → use it (dev override)
    // - Otherwise → use latestTag (production default)
    // - Fallback to 'main' if no releases found
    entry.branch = product.branch ?? latestTag ?? 'main';
    if (latestTag) entry.latestTag = latestTag;
    entry.versions = versions;

    output[repo] = entry;
  }

  writeFileSync('.versions', JSON.stringify(output, null, 2) + '\n');
  console.log('Wrote .versions');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
