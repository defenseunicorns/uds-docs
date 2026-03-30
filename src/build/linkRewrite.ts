/**
 * Rewrite internal markdown links after directory renames containing "&".
 *
 * When "identity-and-access" is renamed to "Identity & Access", the URL slug
 * changes from "identity-and-access" to "identity--access". This rewrites
 * all `/{oldSlug}/` occurrences to `/{newSlug}/` in markdown content.
 */

/** Apply slug renames to markdown content. Returns the original string if no matches. */
export function rewriteLinks(content: string, renames: Array<[string, string]>): string {
  let result = content;
  for (const [oldPath, newPath] of renames) {
    result = result.replaceAll(`/${oldPath}/`, `/${newPath}/`);
  }
  return result;
}
