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
  description?: string;
  sidebarOrder: (string | { dir: string; label: string })[];
}

// ---------------------------------------------------------------------------
// .versions file
// ---------------------------------------------------------------------------

export interface VersionEntry {
  repo: string;
  branch: string;
  latestTag?: string;
  versions: string[];
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
