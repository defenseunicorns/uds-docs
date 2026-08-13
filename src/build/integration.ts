/**
 * Integration build orchestrator.
 *
 * Pipeline: discover versions → clone docs → generate 404s → clone archived
 * versions → rename dirs to Title Case → rewrite links → bust Astro cache.
 *
 * Run directly via `tsx src/build/integration.ts` or imported for testing.
 */

import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  renameSync,
  rmSync,
  writeFileSync,
} from 'fs';
import { basename, dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { discoverAllVersions, minorKey, parseOverrides, readProductsJson } from './versions';
import { computeSlugRename, toTitleCase } from './dirRename';
import { rewriteLinks } from './linkRewrite';
import { VERSION_SLUG_RE } from './cleanupDirs';
import {
  bustAstroCache,
  cleanupUnlistedDirs,
  cloneRepo,
  copyC4,
  copyDocs,
  write404Page,
  writeProductConfig,
} from './fileOps';
import type { DocsConfig } from './types';

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const TARGET_DIR = 'src/content/docs';
const CONFIG_DIR = '.product-configs';
const TEMP_DIR = 'temp';
/** Directories removed from archived versions regardless of sidebarOrder. */
const ARCHIVED_VERSION_EXCLUDES = ['dev', 'adr'];

// ---------------------------------------------------------------------------
// Main orchestrator
// ---------------------------------------------------------------------------

export async function main(): Promise<void> {
  const overrides = parseOverrides(process.env.DOCS_OVERRIDES);

  console.log(`Preparing target directory: ${TARGET_DIR}`);
  mkdirSync(TARGET_DIR, { recursive: true });
  rmSync(CONFIG_DIR, { recursive: true, force: true });
  mkdirSync(CONFIG_DIR, { recursive: true });
  rmSync(TEMP_DIR, { recursive: true, force: true });
  mkdirSync(TEMP_DIR, { recursive: true });

  try {
    // ------------------------------------------------------------------
    // Step 1: Version discovery
    // ------------------------------------------------------------------

    const products = readProductsJson(process.env.PRODUCTS_JSON);
    const productChannels = new Map(
      products
        .filter(product => product.branch)
        .map(product => [product.repo.split('/').pop()!, product.branch!]),
    );
    const channelNames = new Set(productChannels.values());

    const repoOverrides = Object.fromEntries(
      Object.entries(overrides).filter(([k]) => !k.includes('@')),
    );

    const versions = await discoverAllVersions(products, repoOverrides);
    writeFileSync('.versions', JSON.stringify(versions, null, 2) + '\n');
    console.log('Wrote .versions');

    // ------------------------------------------------------------------
    // Step 2: Clone and copy latest docs for each product
    // ------------------------------------------------------------------

    const configCache = new Map<string, DocsConfig & { repo: string }>();

    for (const [repo, entry] of Object.entries(versions)) {
      const repoName = repo.split('/').pop()!;
      const branch = entry.branch;
      const tempDir = join(TEMP_DIR, repoName);
      let docsSource: string;

      let configLabel: string;
      if (overrides[repoName] !== undefined) {
        const localPath = overrides[repoName];
        console.log(`Using local override for '${repoName}': ${localPath}`);
        if (!existsSync(join(localPath, 'docs'))) {
          console.warn(`Warning: override source '${localPath}/docs' not found; skipping.`);
          continue;
        }
        docsSource = join(localPath, 'docs');
        configLabel = `local override for '${repoName}'`;
      } else {
        cloneRepo(`https://github.com/${repo}`, branch, tempDir);
        console.log(`Cloned ${repo}@${branch} into ${tempDir}`);
        if (!existsSync(join(tempDir, 'docs'))) {
          console.warn(`Warning: no docs/ found in ${repo}; skipping.`);
          continue;
        }
        docsSource = join(tempDir, 'docs');
        configLabel = `${repo}@${branch}`;
      }

      const configPath = join(CONFIG_DIR, `${repoName}.json`);
      try {
        writeProductConfig(docsSource, repo, configPath);
      } catch (err) {
        console.error((err as Error).message);
        fatalMissingConfig(configLabel);
      }

      const docsConfig = readDocsConfig(configPath) as DocsConfig & { repo: string };
      configCache.set(repoName, docsConfig);
      const contentDir = docsConfig.contentDir;
      if (!contentDir) {
        throw new Error(`contentDir is missing or empty in docs.config.json for ${repo}`);
      }
      const productRoot = join(TARGET_DIR, contentDir);
      const channel = productChannels.get(repoName);
      if (channel) {
        // Channel docs live behind an explicit URL channel. Remove any root
        // content left by builds from the previous unversioned layout.
        rmSync(productRoot, { recursive: true, force: true });
      }
      const destDir = channel ? join(productRoot, channel) : productRoot;

      console.log(`Copying docs from ${docsSource}/ to ${destDir}`);
      copyDocs(docsSource, destDir);
      cleanupUnlistedDirs(destDir, docsConfig, channel ? `${contentDir}/${channel}` : contentDir);
      if (channel) {
        write404Page(join(productRoot, '404.md'), false);
      }

      const c4Dir = join(docsSource, '.c4');
      if (existsSync(c4Dir)) {
        console.log(`Copying LikeC4 model from ${c4Dir}`);
        copyC4(c4Dir, TARGET_DIR);
      }
    }

    // ------------------------------------------------------------------
    // Step 3: Create per-product 404 pages
    // ------------------------------------------------------------------

    console.log('Creating per-product 404 pages...');
    for (const config of configCache.values()) {
      const contentDir = config.contentDir;
      if (!contentDir) continue;
      const repoName = config.repo.split('/').pop()!;
      const channel = productChannels.get(repoName);
      const dir = channel
        ? join(TARGET_DIR, contentDir, channel)
        : join(TARGET_DIR, contentDir);
      if (!existsSync(dir)) continue;
      write404Page(join(dir, '404.md'), Boolean(channel));
    }

    // ------------------------------------------------------------------
    // Step 4a: Remove stale version dirs
    // ------------------------------------------------------------------

    removeStaleVersionDirs(TARGET_DIR);
    for (const entry of readdirSync(TARGET_DIR, { withFileTypes: true })) {
      if (entry.isDirectory()) {
        removeStaleVersionDirs(join(TARGET_DIR, entry.name));
      }
    }

    // ------------------------------------------------------------------
    // Step 4b: Clone and copy archived versions
    // ------------------------------------------------------------------

    for (const [repo, entry] of Object.entries(versions)) {
      if (!entry.versions.length) continue;

      const repoName = repo.split('/').pop()!;
      const latestConfig = configCache.get(repoName);
      if (!latestConfig) continue;

      const contentDir = latestConfig.contentDir;
      const productId = latestConfig.id;

      console.log(`Cloning versioned docs for ${productId} from ${repo}...`);

      for (const ver of entry.versions) {
        const { ref: verRef, slug: verSlug } = ver;
        const versionDir = contentDir
          ? join(TARGET_DIR, contentDir, verSlug)
          : join(TARGET_DIR, verSlug);
        // Sanitize ref for temp dir path (release/1.0 → release-1.0)
        const tempVerDir = join(TEMP_DIR, `${repoName}-${verRef.replace(/\//g, '-')}`);

        // Support override by ref (release/0.63), display (v0.63), slug (v0-63),
        // or full semver tag (v0.63.0) — strip patch to match display.
        const localOverride =
          overrides[`${repoName}@${verRef}`]
          ?? overrides[`${repoName}@${ver.display}`]
          ?? overrides[`${repoName}@${verSlug}`]
          ?? findOverrideByTag(overrides, repoName, ver.display);
        let verDocsSource: string;

        if (localOverride) {
          console.log(`Using local override for versioned ${productId} (${verRef}): ${localOverride}`);
          verDocsSource = join(localOverride, 'docs');
        } else {
          try {
            cloneRepo(`https://github.com/${repo}`, verRef, tempVerDir);
          } catch {
            console.warn(`Warning: could not clone ${productId} at ref '${verRef}'; skipping.`);
            continue;
          }
          if (!existsSync(join(tempVerDir, 'docs'))) {
            console.warn(`Warning: no docs/ found for ${productId} ${verRef}; skipping.`);
            continue;
          }
          verDocsSource = join(tempVerDir, 'docs');
        }

        const verConfigPath = join(CONFIG_DIR, `${repoName}.${verSlug}.json`);
        try {
          writeProductConfig(verDocsSource, repo, verConfigPath, verRef);
        } catch {
          console.warn('');
          console.warn(`WARNING: docs/docs.config.json not found in ${repo}@${verRef}.`);
          console.warn(`  Skipping archived version ${verRef}.`);
          console.warn(
            `  To include this version, backport docs/docs.config.json to the ${verRef} ref.`,
          );
          console.warn('');
          continue;
        }

        mkdirSync(versionDir, { recursive: true });
        copyDocs(verDocsSource, versionDir);

        const verDocsConfig = readDocsConfig(verConfigPath);
        cleanupUnlistedDirs(versionDir, verDocsConfig, `${contentDir}/${verSlug}`);

        // These dirs may have been in sidebarOrder at the time of the old
        // release, so cleanupUnlistedDirs alone won't catch them.
        for (const excluded of ARCHIVED_VERSION_EXCLUDES) {
          rmSync(join(versionDir, excluded), { recursive: true, force: true });
        }
        rmSync(join(versionDir, 'README.md'), { force: true });

        const latestDisplay = entry.latestTag ? minorKey(entry.latestTag) : undefined;
        write404Page(join(versionDir, '404.md'), true, latestDisplay === ver.display);
        console.log(`Versioned docs for ${productId} ${verRef} written to ${versionDir}`);
      }
    }

    // ------------------------------------------------------------------
    // Step 5: Remove README files from latest product roots
    // ------------------------------------------------------------------

    for (const config of configCache.values()) {
      rmSync(join(TARGET_DIR, config.contentDir, 'README.md'), { force: true });
      const repoName = config.repo.split('/').pop()!;
      const channel = productChannels.get(repoName);
      if (channel) {
        rmSync(join(TARGET_DIR, config.contentDir, channel, 'README.md'), { force: true });
      }
    }

    // ------------------------------------------------------------------
    // Step 6: Rename depth-3+ directories to Title Case (deepest first)
    // ------------------------------------------------------------------

    console.log('Renaming hyphenated directories to Title Case...');

    const dirRenames: Record<string, string> = {};
    const slugRenamesByScope = new Map<string, Array<[string, string]>>();

    const dirsToRename = collectDirsDeepestFirst(TARGET_DIR, channelNames);
    for (const fullPath of dirsToRename) {
      const base = basename(fullPath);
      const newBase = toTitleCase(base);
      if (newBase === null) continue;

      const newPath = join(dirname(fullPath), newBase);
      if (existsSync(newPath)) continue;

      console.log(`  ${base} -> ${newBase}`);
      renameSync(fullPath, newPath);
      if (dirRenames[newBase] !== undefined && dirRenames[newBase] !== base) {
        console.warn(`Warning: dir-renames collision for '${newBase}': '${dirRenames[newBase]}' vs '${base}'`);
      }
      dirRenames[newBase] = base;

      // Track slug renames for "&" dirs — section-relative paths (strip contentDir/).
      if (newBase.includes('&')) {
        const relOld = fullPath.slice(TARGET_DIR.length + 1);
        const parts = relOld.split('/');
        const contentDir = parts.shift()!;
        const channel = VERSION_SLUG_RE.test(parts[0] ?? '') || channelNames.has(parts[0] ?? '')
          ? parts.shift()!
          : '';
        const scope = `${contentDir}/${channel}`;
        const renames = slugRenamesByScope.get(scope) ?? [];
        renames.push(computeSlugRename(parts.join('/')));
        slugRenamesByScope.set(scope, renames);
      }
    }

    // ------------------------------------------------------------------
    // Step 7: Write dir-renames.json (for edit URL resolution in routeData.ts)
    // ------------------------------------------------------------------

    console.log(`Writing directory rename map to ${CONFIG_DIR}/dir-renames.json...`);
    const sortedRenames = Object.fromEntries(
      Object.keys(dirRenames)
        .sort()
        .map(k => [k, dirRenames[k]]),
    );
    writeFileSync(join(CONFIG_DIR, 'dir-renames.json'), JSON.stringify(sortedRenames, null, 2) + '\n');
    writeChannelRedirects(versions, configCache, productChannels, sortedRenames);

    // ------------------------------------------------------------------
    // Step 8: Rewrite internal markdown links
    // ------------------------------------------------------------------

    if (slugRenamesByScope.size > 0) {
      console.log('Updating internal links for renamed directories...');
      for (const [scope, renames] of slugRenamesByScope) {
        const mdFiles = collectMarkdownFiles(join(TARGET_DIR, ...scope.split('/').filter(Boolean)));
        for (const file of mdFiles) {
          const original = readFileSync(file, 'utf8');
          const rewritten = rewriteLinks(original, renames);
          if (rewritten !== original) {
            writeFileSync(file, rewritten);
          }
        }
      }
    }

    // ------------------------------------------------------------------
    // Step 9: Bust Astro cache
    // ------------------------------------------------------------------

    bustAstroCache();
  } finally {
    try {
      rmSync(TEMP_DIR, { recursive: true, force: true });
    } catch (err) {
      console.warn(`Warning: failed to clean up ${TEMP_DIR}: ${(err as Error).message}`);
    }
  }

  console.log('Documentation integration complete!');
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function readDocsConfig(configPath: string): DocsConfig {
  return JSON.parse(readFileSync(configPath, 'utf8')) as DocsConfig;
}

export function writeChannelRedirects(
  versions: Record<string, { latestTag?: string; versions?: Array<{ display: string; slug: string }> }>,
  configCache: Map<string, DocsConfig & { repo: string }>,
  productChannels: Map<string, string>,
  dirRenames: Record<string, string>,
  targetDir = TARGET_DIR,
  configDir = CONFIG_DIR,
): void {
  const redirects: Record<string, string> = {};

  for (const [repo, entry] of Object.entries(versions)) {
    const repoName = repo.split('/').pop()!;
    const channel = productChannels.get(repoName);
    if (!channel) continue;

    const config = configCache.get(repoName);
    if (!config) continue;

    const contentDir = config.contentDir;
    if (!entry.latestTag) {
      redirects[`/${contentDir}`] = `/${contentDir}/${channel}/`;
      continue;
    }

    const latestDisplay = minorKey(entry.latestTag);
    const latestVersion = entry.versions?.find(version => version.display === latestDisplay);
    const latestDir = latestVersion
      ? join(targetDir, contentDir, latestVersion.slug)
      : '';
    if (!latestVersion || !existsSync(latestDir)) {
      redirects[`/${contentDir}`] = `/${contentDir}/${channel}/`;
      continue;
    }

    const channelDir = join(targetDir, contentDir, channel);
    redirects[`/${contentDir}`] = `/${contentDir}/${latestVersion.slug}/`;

    for (const file of collectMarkdownFiles(channelDir)) {
      const relativePath = file.slice(channelDir.length + 1);
      const segments = relativePath.split('/');
      if (segments.some(segment => segment.startsWith('.'))) continue;
      const filename = segments.pop()!;
      const stem = filename.replace(/\.(?:md|mdx)$/, '');
      if (stem === '404') continue;

      const oldDirs = segments.map(segment => dirRenames[segment] ?? segment);
      const targetDirs = oldDirs.map(toDirectoryUrlSlug);
      const oldParts = [...oldDirs];
      const targetParts = [...targetDirs];
      if (stem !== 'index') {
        oldParts.push(stem);
        targetParts.push(toUrlSlug(stem));
      }
      if (oldParts.length === 0) continue;

      const legacySourceParts = oldParts.map((part, index) => {
        const isFilename = stem !== 'index' && index === oldParts.length - 1;
        return isFilename ? part : part.replaceAll('-and-', '--');
      });
      const sourcePaths = new Set([oldParts.join('/'), legacySourceParts.join('/')]);
      for (const sourcePath of sourcePaths) {
        redirects[`/${contentDir}/${sourcePath}`] =
          `/${contentDir}/${latestVersion.slug}/${targetParts.join('/')}/`;
      }
    }
  }

  writeFileSync(join(configDir, 'redirects.json'), JSON.stringify(redirects, null, 2) + '\n');
}

function toUrlSlug(segment: string): string {
  return segment.replace(/ & /g, '--').replace(/\s+/g, '-').toLowerCase();
}

function toDirectoryUrlSlug(segment: string): string {
  return toUrlSlug(segment.replaceAll('-and-', '--'));
}

/** Remove version-slug directories at maxdepth 1 inside `dir`. */
export function removeStaleVersionDirs(dir: string): void {
  if (!existsSync(dir)) return;
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory() && VERSION_SLUG_RE.test(entry.name)) {
      rmSync(join(dir, entry.name), { recursive: true, force: true });
    }
  }
}

/**
 * Find a version-specific override when the user provides a full semver tag
 * like `uds-core@v0.63.0`. Strips the patch to match against display (`v0.63`).
 */
function findOverrideByTag(
  overrides: Record<string, string>,
  repoName: string,
  display: string,
): string | undefined {
  const prefix = `${repoName}@`;
  for (const key of Object.keys(overrides)) {
    if (!key.startsWith(prefix)) continue;
    const tag = key.slice(prefix.length);
    const stripped = minorKey(tag);
    if (stripped === display) return overrides[key];
  }
  return undefined;
}

function fatalMissingConfig(location: string): never {
  console.error('');
  console.error(`\x1b[1;31mERROR: docs/docs.config.json not found in ${location}.`);
  console.error('');
  console.error('  Each product repo must have a docs/docs.config.json file that defines');
  console.error("  the product's id, label, contentDir, and sidebarOrder.");
  console.error('');
  console.error("  See CONTRIBUTING.md → 'Upstream config file' for the schema and an example.\x1b[0m");
  console.error('');
  throw new Error(`docs.config.json not found in ${location}`);
}

// ---------------------------------------------------------------------------
// Directory traversal
// ---------------------------------------------------------------------------

/**
 * Collect depth-3+ directories in post-order (deepest first).
 * Skips dot-directories and treats version directories as transparent URL
 * prefixes so their archived content receives the same renames as latest.
 */
export function collectDirsDeepestFirst(targetDir: string, channelNames = new Set<string>()): string[] {
  const result: string[] = [];

  function walk(dir: string, depth: number): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      if (entry.name.startsWith('.')) continue;

      const fullPath = join(dir, entry.name);
      if (channelNames.has(entry.name)) {
        // Configured channels are URL prefixes, not content sections. Keep their children at
        // the same depth as the product's regular sections.
        walk(fullPath, depth);
        continue;
      }
      if (VERSION_SLUG_RE.test(entry.name)) {
        // A version directory is part of the URL, not the content hierarchy.
        walk(fullPath, depth);
        continue;
      }
      walk(fullPath, depth + 1);

      if (depth >= 3) {
        result.push(fullPath);
      }
    }
  }

  walk(targetDir, 1);
  return result;
}

// ---------------------------------------------------------------------------
// Markdown file collection
// ---------------------------------------------------------------------------

/** Collect all .md/.mdx files under `targetDir`, including archived versions. */
export function collectMarkdownFiles(targetDir: string): string[] {
  const result: string[] = [];

  function walk(dir: string): void {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }

    for (const entry of entries) {
      const fullPath = join(dir, entry.name);

      if (entry.isDirectory()) {
        walk(fullPath);
      } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
        result.push(fullPath);
      }
    }
  }

  walk(targetDir);
  return result;
}

// ---------------------------------------------------------------------------
// Direct execution guard
// ---------------------------------------------------------------------------

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main().catch(err => {
    console.error(err);
    process.exit(1);
  });
}
