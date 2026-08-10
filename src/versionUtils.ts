export interface VersionMetadata {
  ref: string;
  display: string;
  slug: string;
}

interface VersionEntry {
  latestTag?: string;
  versions?: Array<Partial<VersionMetadata> & { display: string; slug: string }>;
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
