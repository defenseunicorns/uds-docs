import { existsSync } from 'node:fs';

interface VersionMetadata {
  ref: string;
  display: string;
  slug: string;
}

interface VersionEntry {
  latestTag?: string;
  versions?: Array<Partial<VersionMetadata> & { display: string; slug: string }>;
}

interface ProductVersionSource {
  repo: string;
  contentDir: string;
  latestSource?: string;
}

/** Strip a patch version from a tag: `v0.61.1` becomes `v0.61`. */
export function minorKey(tag: string): string {
  return tag.replace(/\.\d+$/, '');
}

export function latestVersionFor(entry: VersionEntry): VersionMetadata | null {
  if (!entry.latestTag) return null;

  const display = minorKey(entry.latestTag);
  const latest = entry.versions?.find(version => version.display === display);
  return {
    ref: latest?.ref ?? entry.latestTag,
    display,
    slug: latest?.slug ?? `v${display.replace(/^v/, '').replace(/\./g, '-')}`,
  };
}

/** Return the latest release only when channel-based generated content exists. */
export function latestProductVersion(
  product: ProductVersionSource,
  versionsByRepo: Record<string, VersionEntry>,
  fileExists: (path: string) => boolean = existsSync,
): VersionMetadata | null {
  const latest = latestVersionFor(versionsByRepo[product.repo] ?? {});
  if (!latest) return null;
  if (product.latestSource && !fileExists(`src/content/docs/${product.contentDir}/${latest.slug}`)) {
    return null;
  }
  return latest;
}
