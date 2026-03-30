/**
 * Filesystem and subprocess I/O for the integration build pipeline.
 *
 * All side effects live here; pure logic lives in `dirRename.ts`,
 * `linkRewrite.ts`, and `cleanupDirs.ts`. Unit tests in `__tests__/fileOps.test.ts`.
 */

import {
  copyFileSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { spawnSync } from 'child_process';
import type { DocsConfig } from './types';
import { findUnlistedDirs } from './cleanupDirs';

// ---------------------------------------------------------------------------
// Git clone
// ---------------------------------------------------------------------------

/** Shallow-clone a repo at a specific ref. Removes `targetDir` first if it exists. */
export function cloneRepo(repoUrl: string, branchOrTag: string, targetDir: string): void {
  if (existsSync(targetDir)) {
    console.log(`Removing existing cloned dir: ${targetDir}`);
    rmSync(targetDir, { recursive: true, force: true });
  }
  const result = spawnSync(
    'git',
    ['clone', '--branch', branchOrTag, '--depth', '1', '--single-branch', repoUrl, targetDir],
    { stdio: 'inherit' },
  );
  if (result.error) {
    throw new Error(`git clone failed to spawn for ${repoUrl}@${branchOrTag}: ${result.error.message}`);
  }
  if (result.status !== 0) {
    throw new Error(`git clone failed for ${repoUrl}@${branchOrTag} (exit ${result.status ?? 'null'})`);
  }
}

// ---------------------------------------------------------------------------
// Docs copying
// ---------------------------------------------------------------------------

/** Files excluded from both copy and delete — preserves our generated versions. */
const COPY_EXCLUDES = new Set(['404.md', 'docs.config.json']);

/**
 * Recursive copy that dereferences symlinks (rsync -L behaviour).
 *
 * Uses `copyFileSync` instead of `cpSync` because Node's `cpSync` with
 * `dereference: true` converts relative symlinks to absolute ones rather
 * than copying the target file's content.
 */
function copyTree(src: string, dest: string): void {
  // statSync follows symlinks; broken symlinks are skipped with a warning.
  let stat;
  try {
    stat = statSync(src);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      console.warn(`Warning: skipping broken symlink: ${src}`);
      return;
    }
    throw err;
  }
  if (stat.isDirectory()) {
    mkdirSync(dest, { recursive: true });
    for (const entry of readdirSync(src)) {
      copyTree(join(src, entry), join(dest, entry));
    }
  } else {
    copyFileSync(src, dest);
  }
}

/**
 * Copy upstream docs from `src` to `dest`, replicating:
 *   rsync -rtL --safe-links --delete --exclude='404.md' --exclude='docs.config.json'
 */
export function copyDocs(src: string, dest: string): void {
  mkdirSync(dest, { recursive: true });

  const srcEntries = new Set(readdirSync(src));

  // --delete: remove dest entries that no longer exist in src.
  // COPY_EXCLUDES are excluded from deletion too (preserves generated 404.md).
  for (const name of readdirSync(dest)) {
    if (!srcEntries.has(name) && !COPY_EXCLUDES.has(name)) {
      rmSync(join(dest, name), { recursive: true, force: true });
    }
  }

  // Remove each dest entry before copying so stale Title Case renames
  // don't accumulate alongside their kebab-case originals.
  for (const name of srcEntries) {
    if (COPY_EXCLUDES.has(name)) continue;
    const destPath = join(dest, name);
    if (existsSync(destPath)) {
      rmSync(destPath, { recursive: true, force: true });
    }
    copyTree(join(src, name), destPath);
  }
}

// ---------------------------------------------------------------------------
// LikeC4 model copying
// ---------------------------------------------------------------------------

/** Copy a `.c4` model directory to `{targetDocsDir}/.c4`, replacing any existing one. */
export function copyC4(c4SrcDir: string, targetDocsDir: string): void {
  const dest = join(targetDocsDir, '.c4');
  rmSync(dest, { recursive: true, force: true });
  copyTree(c4SrcDir, dest);
}

// ---------------------------------------------------------------------------
// Product config writing
// ---------------------------------------------------------------------------

/** Read `docs.config.json` from `docsDir`, merge in `repo`, and write to `outputPath`. */
export function writeProductConfig(docsDir: string, repo: string, outputPath: string): void {
  const configPath = join(docsDir, 'docs.config.json');
  if (!existsSync(configPath)) {
    throw new Error(`docs.config.json not found in ${docsDir}`);
  }
  let config: Record<string, unknown>;
  try {
    config = JSON.parse(readFileSync(configPath, 'utf8')) as Record<string, unknown>;
  } catch (err) {
    throw new Error(`Failed to parse ${configPath}: ${(err as Error).message}`);
  }
  config['repo'] = repo;
  writeFileSync(outputPath, JSON.stringify(config, null, 2) + '\n');
}

// ---------------------------------------------------------------------------
// Unlisted directory cleanup
// ---------------------------------------------------------------------------

/** Remove directories not listed in `sidebarOrder` (dot-dirs and version dirs are always kept). */
export function cleanupUnlistedDirs(targetDir: string, docsConfig: DocsConfig, label: string): void {
  if (!existsSync(targetDir)) return;

  const allowed = (docsConfig.sidebarOrder ?? []).map(entry =>
    typeof entry === 'string' ? entry : entry.dir,
  );

  const present = readdirSync(targetDir, { withFileTypes: true })
    .filter(e => e.isDirectory())
    .map(e => e.name);

  const toRemove = findUnlistedDirs(present, allowed);
  for (const name of toRemove) {
    console.log(`  Removing unlisted directory: ${label}/${name}`);
    rmSync(join(targetDir, name), { recursive: true, force: true });
  }
}

// ---------------------------------------------------------------------------
// 404 page generation
// ---------------------------------------------------------------------------

const PAGE_FRONTMATTER = `---
title: Page Not Found
template: doc
editUrl: false
lastUpdated: false
pagefind: false
sidebar:
  hidden: true
---`;

const NON_VERSIONED_404_BODY = `
The page you're looking for doesn't exist or may have moved.

Use the sidebar to navigate, or return to the product home.
`;

const VERSIONED_404_BODY = `
The page you're looking for doesn't exist in this version.

Use the sidebar to navigate, or use the **Version** selector to switch to a different version.
`;

/** Write a `404.md` page — versioned variant mentions the Version selector. */
export function write404Page(destPath: string, isVersioned: boolean): void {
  const body = isVersioned ? VERSIONED_404_BODY : NON_VERSIONED_404_BODY;
  writeFileSync(destPath, PAGE_FRONTMATTER + body);
}

// ---------------------------------------------------------------------------
// Astro content cache busting
// ---------------------------------------------------------------------------

/** Remove Astro's content cache so renamed directories are picked up on rebuild. */
export function bustAstroCache(): void {
  rmSync('.astro/content-modules.mjs', { force: true });
  rmSync('.astro/data-store.json', { force: true });
}
