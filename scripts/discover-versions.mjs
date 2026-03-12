#!/usr/bin/env node
/**
 * Reads product configuration from src/products.json, discovers archived versions
 * for each product that has `versioning` configured, and writes .versions JSON
 * with all metadata the integration script and astro.config.mjs need.
 *
 * Usage:
 *   node scripts/discover-versions.mjs
 *
 * Respects GITHUB_TOKEN env var for authenticated API requests.
 * Products can be overridden via env: VERSIONS_core=v0.61.0,v0.60.0
 */
import { readFileSync, writeFileSync } from 'fs';

const PRODUCTS = JSON.parse(readFileSync(new URL('../src/products.json', import.meta.url), 'utf8'));

/** Extract the minor version key from a semver tag: v0.61.1 → v0.61 */
function minorKey(tag) {
  return tag.replace(/\.\d+$/, '');
}

async function discoverVersions(repo, count = 5) {
  const headers = { 'Accept': 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  // Fetch enough releases to find `count` distinct minor versions after skipping latest
  const res = await fetch(
    `https://api.github.com/repos/${repo}/releases?per_page=${(count + 1) * 5}`,
    { headers }
  );

  if (!res.ok) {
    console.error(`Warning: GitHub API returned ${res.status} for ${repo}`);
    return [];
  }

  const releases = await res.json();
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

  // Skip index 0 (latest minor, already committed to repo) and take the next `count`
  return uniqueMinors.slice(1, count + 1);
}

async function main() {
  const output = {};

  for (const product of PRODUCTS) {
    const entry = {
      contentDir: product.contentDir,
    };

    // Content sources — read from product.source
    if (product.source) {
      entry.sources = [{
        repo: product.source.repo,
        branch: product.source.branch ?? 'main',
        docsPath: product.source.docsPath ?? 'docs',
        mode: product.source.mode ?? 'overlay',
      }];
    }

    // Version discovery
    if (product.versioning) {
      // Resolve versioning repo: explicit > source.repo > required
      const versionRepo = product.versioning.repo
        ?? product.source?.repo
        ?? null;

      if (!versionRepo) {
        console.error(`${product.id}: versioning configured but no repo found (set versioning.repo or source.repo)`);
        // Still write the product entry so its sources are processed by the integration script.
      } else {
        const versionDocsPath = product.versioning.docsPath
          ?? product.source?.docsPath
          ?? 'docs';

        // Allow per-product env override: VERSIONS_core=v0.61.0,v0.60.0
        const envKey = `VERSIONS_${product.id}`;
        const envVal = process.env[envKey]?.trim();
        let versions;

        if (envVal) {
          versions = envVal.split(',').map(v => v.trim()).filter(Boolean);
          console.log(`${product.id}: using ${envKey} = ${versions.join(', ')}`);
        } else {
          console.log(`${product.id}: discovering versions from ${versionRepo}...`);
          versions = await discoverVersions(
            versionRepo,
            product.versioning.count ?? 5,
          );
          console.log(`${product.id}: found ${versions.join(', ') || '(none)'}`);
        }

        entry.versions = versions;
        entry.versionRepo = versionRepo;
        entry.versionDocsPath = versionDocsPath;
      }
    }

    output[product.id] = entry;
  }

  writeFileSync('.versions', JSON.stringify(output, null, 2) + '\n');
  console.log('Wrote .versions');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
