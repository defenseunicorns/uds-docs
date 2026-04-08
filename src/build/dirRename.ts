/**
 * Pure functions for renaming hyphenated directory names to Title Case.
 *
 * Depth-3+ directories are renamed so Starlight uses readable sidebar labels.
 * Depth-1 (product) and depth-2 (section) dirs are skipped — they must stay
 * hyphenated for `astro.config.mjs` `autogenerate` entries.
 */

import { VERSION_SLUG_RE } from './cleanupDirs';

// ---------------------------------------------------------------------------
// Special-case mappings
// ---------------------------------------------------------------------------

/** Word-level overrides: add entries when upstream dirs need non-standard casing. */
export const ACRONYM_MAP: Readonly<Record<string, string>> = {
  uds: 'UDS',
  idam: 'IdAM',
  crds: 'CRDs',
  and: '&', // github-slugger strips "&" and produces "--" in URLs
};

/** Full-phrase overrides (checked before word-level). */
export const PHRASE_MAP: Readonly<Record<string, string>> = {
  'single sign on': 'Single Sign-On',
};

// ---------------------------------------------------------------------------
// Core rename logic
// ---------------------------------------------------------------------------

/** Lowercase hyphenated names with at least one hyphen. */
const RENAME_PATTERN = /^[a-z][a-z0-9]*(-[a-z0-9]+)+$/;

/** Convert a kebab-case dir name to Title Case, or `null` if not eligible. */
export function toTitleCase(name: string): string | null {
  if (!RENAME_PATTERN.test(name)) return null;
  if (VERSION_SLUG_RE.test(name)) return null;

  const words = name.split('-');
  const joined = words.join(' ');

  if (PHRASE_MAP[joined] !== undefined) {
    return PHRASE_MAP[joined];
  }

  return words
    .map(word => ACRONYM_MAP[word] ?? word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

// ---------------------------------------------------------------------------
// Slug rename tracking
// ---------------------------------------------------------------------------

/**
 * Compute old/new URL slugs when a dir is renamed to contain "&".
 * github-slugger strips "&" → double hyphen: "identity-and-access" → "identity--access".
 * Only the last path segment is modified to avoid corrupting parent segments.
 */
export function computeSlugRename(sectionRelativePath: string): [string, string] {
  const lastSlash = sectionRelativePath.lastIndexOf('/');
  const parent = lastSlash === -1 ? '' : sectionRelativePath.slice(0, lastSlash + 1);
  const last = lastSlash === -1 ? sectionRelativePath : sectionRelativePath.slice(lastSlash + 1);
  const newSlug = parent + last.replaceAll('-and-', '--');
  return [sectionRelativePath, newSlug];
}
