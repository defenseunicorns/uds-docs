/**
 * Shared types for the build integration pipeline.
 */

export type { ProductConfig } from '../products';

// ---------------------------------------------------------------------------
// Upstream docs.config.json
// ---------------------------------------------------------------------------

/** Shape of `docs/docs.config.json` in upstream product repos. */
export interface DocsConfig {
  id: string;
  label: string;
  contentDir: string;
  archiveCount?: number;
  /** `"branch"` pulls archived versions from `release/*` branches; `"tag"` (default) uses GitHub release tags. */
  versionSource?: 'tag' | 'branch';
  description?: string;
  sidebarOrder: (string | { dir: string; label: string })[];
}

// ---------------------------------------------------------------------------
// .versions file
// ---------------------------------------------------------------------------

/** A single archived version — pre-computed ref, display label, and URL slug. */
export interface ArchivedVersion {
  /** Git ref to clone: a tag like `"v1.0.0"` or a branch like `"release/1.0"`. */
  ref: string;
  /** Human-readable label for the version picker: `"v1.0"`. */
  display: string;
  /** URL/directory slug: `"v1-0"`. */
  slug: string;
}

export interface VersionEntry {
  repo: string;
  branch: string;
  latestTag?: string;
  versions: ArchivedVersion[];
}

export type VersionsFile = Record<string, VersionEntry>;

// ---------------------------------------------------------------------------
// DOCS_OVERRIDES
// ---------------------------------------------------------------------------

/**
 * Parsed `DOCS_OVERRIDES` env var.
 * Keys: `"repo-name"` (latest) or `"repo-name@tag"` (archived version).
 * Values: absolute paths to local repo clones.
 */
export type OverridesMap = Record<string, string>;
