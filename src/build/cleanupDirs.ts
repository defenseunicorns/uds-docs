/**
 * Pure filter logic for removing directories not listed in a product's `sidebarOrder`.
 *
 * Dot-directories (`.c4`, `.images`) and version directories (`v0-61`) are
 * always preserved regardless of `sidebarOrder`.
 */

/** Version slug pattern — must stay in sync with `VERSION_SLUG_PATTERN` in `productUtils.ts`. */
export const VERSION_SLUG_RE = /^v\d+-\d+$/;

/**
 * Return directory names from `present` that should be removed (not in `allowed`,
 * not a dot-directory, not a version directory).
 */
export function findUnlistedDirs(present: string[], allowed: string[]): string[] {
  const allowedSet = new Set(allowed);
  return present.filter(name => {
    if (name.startsWith('.')) return false;
    if (VERSION_SLUG_RE.test(name)) return false;
    return !allowedSet.has(name);
  });
}
