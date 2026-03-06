#!/usr/bin/env node
/**
 * Discovers archived versions for each product that has `versioning` configured
 * in src/products.ts. Writes .versions JSON with all metadata the build needs.
 *
 * Usage:
 *   node scripts/discover-versions.mjs
 *
 * Respects GITHUB_TOKEN env var for authenticated API requests.
 * Products can be overridden via env: VERSIONS_core=v0.61.0,v0.60.0
 */
import { readFileSync, writeFileSync } from 'fs';

// Parse products.ts — extract the PRODUCTS array and evaluate it as plain JS.
//
// IMPORTANT: The PRODUCTS array in products.ts must remain plain data literals
// (strings, numbers, booleans, objects, arrays). Do NOT use:
//   - Computed values, function calls, or variable references inside the array
//   - Template literals or imported constants
//   - Spread operators or conditional expressions
// Any of these will cause this eval to fail silently or throw at build time.
const productsSource = readFileSync(new URL('../src/products.ts', import.meta.url), 'utf8');

function parseProducts(source) {
  // Only evaluate the PRODUCTS array — skip all function/interface definitions.
  // This avoids having to strip every possible TS type annotation from function signatures.
  const match = source.match(/export\s+const\s+PRODUCTS\s*(?::\s*ProductConfig\[\])?\s*=\s*(\[[\s\S]*\]);/);
  if (!match) throw new Error('Could not find PRODUCTS array in products.ts');
  // The array literal is plain JS (no type annotations inside object literals)
  const fn = new Function(`return ${match[1]};`);
  return fn();
}

const PRODUCTS = parseProducts(productsSource);

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
    if (!product.versioning) continue;

    // Allow per-product env override: VERSIONS_core=v0.61.0,v0.60.0
    const envKey = `VERSIONS_${product.id}`;
    const envVal = process.env[envKey]?.trim();
    let versions;

    if (envVal) {
      versions = envVal.split(',').map(v => v.trim()).filter(Boolean);
      console.log(`${product.id}: using ${envKey} = ${versions.join(', ')}`);
    } else if (product.id === 'core' && process.env.VERSIONS_TO_BUILD?.trim()) {
      // Legacy compat — prefer VERSIONS_core going forward
      versions = process.env.VERSIONS_TO_BUILD.split(',').map(v => v.trim()).filter(Boolean);
      console.warn(`⚠ VERSIONS_TO_BUILD is deprecated (applies to core only). Use VERSIONS_core instead.`);
      console.log(`${product.id}: using VERSIONS_TO_BUILD = ${versions.join(', ')}`);
    } else {
      console.log(`${product.id}: discovering versions from ${product.versioning.repo}...`);
      versions = await discoverVersions(
        product.versioning.repo,
        product.versioning.count ?? 5,
      );
      console.log(`${product.id}: found ${versions.join(', ') || '(none)'}`);
    }

    // Write everything the integration script and astro.config.mjs need
    output[product.id] = {
      versions,
      repo: product.versioning.repo,
      contentDir: product.contentDir,
      docsPath: product.versioning.docsPath ?? 'docs',
    };
  }

  writeFileSync('.versions', JSON.stringify(output, null, 2) + '\n');
  console.log('Wrote .versions');
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
