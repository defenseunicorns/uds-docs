import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  discoverAllVersions,
  discoverBranchVersions,
  discoverVersions,
  fetchDocsConfig,
  minorKey,
  parseOverrides,
  toArchivedVersion,
} from './versions';

describe('minorKey', () => {
  it('strips patch version', () => {
    expect(minorKey('v0.61.1')).toBe('v0.61');
    expect(minorKey('v1.2.3')).toBe('v1.2');
    expect(minorKey('v10.100.999')).toBe('v10.100');
  });
});

describe('fetchDocsConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-docs-test-'));
    mkdirSync(join(tmpDir, 'docs'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads from local override path', async () => {
    const config = { id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: ['getting-started'] };
    writeFileSync(join(tmpDir, 'docs', 'docs.config.json'), JSON.stringify(config));
    expect(await fetchDocsConfig('defenseunicorns/uds-core', 'main', tmpDir)).toEqual(config);
  });

  it('returns null when local file missing', async () => {
    expect(await fetchDocsConfig('defenseunicorns/uds-core', 'main', tmpDir)).toBeNull();
  });

  it('returns null on non-200 GitHub response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 404 } as Response));
    expect(await fetchDocsConfig('defenseunicorns/uds-core', 'main')).toBeNull();
    vi.unstubAllGlobals();
  });

  it('returns null on network error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    expect(await fetchDocsConfig('defenseunicorns/uds-core', 'main')).toBeNull();
    vi.unstubAllGlobals();
  });
});

describe('discoverVersions', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  function mockReleases(tags: string[]) {
    const releases = tags.map(tag => ({ tag_name: tag, prerelease: false, draft: false }));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve(releases) } as Response);
  }

  it('returns latest + archived as ArchivedVersion[], deduplicates by minor', async () => {
    mockReleases(['v0.62.0', 'v0.61.1', 'v0.61.0', 'v0.60.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.latestTag).toBe('v0.62.0');
    expect(result.archived).toEqual([
      { ref: 'v0.61.1', display: 'v0.61', slug: 'v0-61' },
      { ref: 'v0.60.0', display: 'v0.60', slug: 'v0-60' },
    ]);
  });

  it('filters prereleases and drafts', async () => {
    const releases = [
      { tag_name: 'v0.62.0', prerelease: false, draft: true },
      { tag_name: 'v0.61.0-rc1', prerelease: true, draft: false },
      { tag_name: 'v0.60.0', prerelease: false, draft: false },
    ];
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve(releases) } as Response);
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBe('v0.60.0');
  });

  it('respects count limit', async () => {
    mockReleases(['v0.63.0', 'v0.62.0', 'v0.61.0', 'v0.60.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.archived).toEqual([
      { ref: 'v0.62.0', display: 'v0.62', slug: 'v0-62' },
      { ref: 'v0.61.0', display: 'v0.61', slug: 'v0-61' },
    ]);
  });

  it('returns null/empty on API failure', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' } as Response);
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
    expect(result.archived).toHaveLength(0);
  });

  it('handles non-array JSON response (rate limit)', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
    } as Response);
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
  });

  it('handles empty releases', async () => {
    mockReleases([]);
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
  });

  it('selects highest semver as latest when a backport is published after a newer release', async () => {
    // API returns v1.0.1 (backport, created after v1.1.0) first — latestTag must still be v1.1.0
    mockReleases(['v1.0.1', 'v1.1.0', 'v1.0.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBe('v1.1.0');
    expect(result.archived).toEqual([
      { ref: 'v1.0.1', display: 'v1.0', slug: 'v1-0' },
    ]);
  });
});

describe('parseOverrides', () => {
  it('returns empty for undefined/empty', () => {
    expect(parseOverrides(undefined)).toEqual({});
    expect(parseOverrides('')).toEqual({});
  });

  it('parses single, multiple, and version-specific overrides', () => {
    expect(parseOverrides('uds-core=/path')).toEqual({ 'uds-core': '/path' });
    expect(parseOverrides('a=/x;b=/y')).toEqual({ a: '/x', b: '/y' });
    expect(parseOverrides('uds-core@v0.62.0=/old')).toEqual({ 'uds-core@v0.62.0': '/old' });
  });

  it('skips malformed entries', () => {
    expect(parseOverrides('no-equals')).toEqual({});
    expect(parseOverrides('key=')).toEqual({});
    expect(parseOverrides('=/value')).toEqual({});
    expect(parseOverrides('a=/x;;b=/y;')).toEqual({ a: '/x', b: '/y' });
  });

  it('trims whitespace', () => {
    expect(parseOverrides('  uds-core  =  /path  ')).toEqual({ 'uds-core': '/path' });
  });
});

describe('discoverAllVersions with archiveVersions', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('skips GitHub discovery and wraps provided tags as ArchivedVersion[]', async () => {
    const products = [{ repo: 'test/test-product', archiveVersions: ['v0.1.0'] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].versions).toEqual([
      { ref: 'v0.1.0', display: 'v0.1', slug: 'v0-1' },
    ]);
    expect(result['test/test-product'].branch).toBe('main');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('respects branch field', async () => {
    const products = [{ repo: 'test/p', branch: 'develop', archiveVersions: ['v0.1.0'] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/p'].branch).toBe('develop');
  });
});

describe('toArchivedVersion', () => {
  it('converts a three-part semver tag', () => {
    expect(toArchivedVersion('v1.0.0')).toEqual({
      ref: 'v1.0.0', display: 'v1.0', slug: 'v1-0',
    });
  });

  it('converts a tag with larger numbers', () => {
    expect(toArchivedVersion('v0.61.1')).toEqual({
      ref: 'v0.61.1', display: 'v0.61', slug: 'v0-61',
    });
  });

  it('converts a two-part tag', () => {
    expect(toArchivedVersion('v0.63')).toEqual({
      ref: 'v0.63', display: 'v0.63', slug: 'v0-63',
    });
  });

  it('converts a branch ref', () => {
    expect(toArchivedVersion('release/1.0')).toEqual({
      ref: 'release/1.0', display: 'v1.0', slug: 'v1-0',
    });
  });

  it('handles large version numbers in branch refs', () => {
    expect(toArchivedVersion('release/10.100')).toEqual({
      ref: 'release/10.100', display: 'v10.100', slug: 'v10-100',
    });
  });

  it('throws on single-segment ref without major.minor', () => {
    expect(() => toArchivedVersion('v1')).toThrow('Cannot normalize ref');
    expect(() => toArchivedVersion('foo')).toThrow('Cannot normalize ref');
  });
});

describe('discoverBranchVersions', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  function mockRefs(branchNames: string[]) {
    const refs = branchNames.map(name => ({ ref: `refs/heads/${name}` }));
    vi.mocked(fetch).mockResolvedValue({ ok: true, json: () => Promise.resolve(refs) } as Response);
  }

  it('parses release/X.Y branches and returns ArchivedVersion[]', async () => {
    mockRefs(['release/1.0', 'release/0.63', 'release/0.62']);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toEqual([
      { ref: 'release/1.0', display: 'v1.0', slug: 'v1-0' },
      { ref: 'release/0.63', display: 'v0.63', slug: 'v0-63' },
    ]);
  });

  it('filters out non-matching branch names', async () => {
    mockRefs(['release/1.0', 'release/1.0.1', 'release/foo', 'main']);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 10);
    expect(result).toEqual([
      { ref: 'release/1.0', display: 'v1.0', slug: 'v1-0' },
    ]);
  });

  it('sorts by semver descending (not lexicographic)', async () => {
    mockRefs(['release/0.9', 'release/0.10', 'release/1.0']);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 10);
    expect(result.map(v => v.ref)).toEqual([
      'release/1.0', 'release/0.10', 'release/0.9',
    ]);
  });

  it('respects count limit', async () => {
    mockRefs(['release/1.0', 'release/0.63', 'release/0.62', 'release/0.61', 'release/0.60']);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toHaveLength(2);
  });

  it('returns empty on API failure', async () => {
    vi.mocked(fetch).mockResolvedValue({ ok: false, status: 403, statusText: 'Forbidden' } as Response);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toEqual([]);
  });

  it('returns empty on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toEqual([]);
  });

  it('handles empty response', async () => {
    mockRefs([]);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toEqual([]);
  });

  it('handles non-array response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
    } as Response);
    const result = await discoverBranchVersions('defenseunicorns/uds-core', 2);
    expect(result).toEqual([]);
  });
});

describe('discoverAllVersions with versionSource', () => {
  beforeEach(() => { vi.stubGlobal('fetch', vi.fn()); });
  afterEach(() => { vi.unstubAllGlobals(); });

  it('uses branch discovery when versionSource is "branch"', async () => {
    // First call: fetchDocsConfig (raw.githubusercontent.com)
    // Second call: discoverBranchVersions (matching-refs API)
    // Third call: discoverVersions for latestTag (releases API)
    const calls: string[] = [];
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      calls.push(urlStr);
      if (new URL(urlStr).hostname === 'raw.githubusercontent.com') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'core', label: 'Core', contentDir: 'core',
            archiveCount: 2, versionSource: 'branch', sidebarOrder: [],
          }),
        } as Response;
      }
      if (urlStr.includes('matching-refs')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { ref: 'refs/heads/release/1.0' },
            { ref: 'refs/heads/release/0.63' },
            { ref: 'refs/heads/release/0.62' },
          ]),
        } as Response;
      }
      if (urlStr.includes('/releases')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { tag_name: 'v1.1.0', prerelease: false, draft: false },
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await discoverAllVersions(
      [{ repo: 'defenseunicorns/uds-core' }],
      {},
    );
    const entry = result['defenseunicorns/uds-core'];
    expect(entry.versions).toEqual([
      { ref: 'release/1.0', display: 'v1.0', slug: 'v1-0' },
      { ref: 'release/0.63', display: 'v0.63', slug: 'v0-63' },
    ]);
    expect(entry.latestTag).toBe('v1.1.0');
    expect(calls.some(c => c.includes('matching-refs'))).toBe(true);
  });

  it('includes the current release when latest docs use an explicit branch', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (new URL(urlStr).hostname === 'raw.githubusercontent.com') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'core', label: 'Core', contentDir: 'core',
            archiveCount: 2, versionSource: 'branch', sidebarOrder: [],
          }),
        } as Response;
      }
      if (urlStr.includes('matching-refs')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { ref: 'refs/heads/release/1.0' },
            { ref: 'refs/heads/release/0.63' },
            { ref: 'refs/heads/release/0.62' },
          ]),
        } as Response;
      }
      if (urlStr.includes('/releases')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { tag_name: 'v1.0.0', prerelease: false, draft: false },
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await discoverAllVersions(
      [{ repo: 'defenseunicorns/uds-core', branch: 'main' }],
      {},
    );
    const entry = result['defenseunicorns/uds-core'];
    expect(entry.branch).toBe('main');
    expect(entry.latestTag).toBe('v1.0.0');
    expect(entry.versions).toEqual([
      { ref: 'release/1.0', display: 'v1.0', slug: 'v1-0' },
      { ref: 'release/0.63', display: 'v0.63', slug: 'v0-63' },
    ]);
  });

  it('does not add versions when archiveCount is zero with an explicit branch', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (new URL(urlStr).hostname === 'raw.githubusercontent.com') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'cli', label: 'CLI', contentDir: 'cli',
            archiveCount: 0, sidebarOrder: [],
          }),
        } as Response;
      }
      if (urlStr.includes('/releases')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { tag_name: 'v1.0.0', prerelease: false, draft: false },
            { tag_name: 'v0.63.0', prerelease: false, draft: false },
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await discoverAllVersions(
      [{ repo: 'defenseunicorns/uds-cli', branch: 'main' }],
      {},
    );
    expect(result['defenseunicorns/uds-cli'].versions).toEqual([]);
  });

  it('defaults to tag discovery when versionSource is not set', async () => {
    const calls: string[] = [];
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      calls.push(urlStr);
      if (new URL(urlStr).hostname === 'raw.githubusercontent.com') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'cli', label: 'CLI', contentDir: 'cli',
            archiveCount: 1, sidebarOrder: [],
          }),
        } as Response;
      }
      if (urlStr.includes('/releases')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { tag_name: 'v0.26.0', prerelease: false, draft: false },
            { tag_name: 'v0.25.0', prerelease: false, draft: false },
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await discoverAllVersions(
      [{ repo: 'defenseunicorns/uds-cli' }],
      {},
    );
    const entry = result['defenseunicorns/uds-cli'];
    expect(entry.versions).toEqual([
      { ref: 'v0.25.0', display: 'v0.25', slug: 'v0-25' },
    ]);
    expect(entry.latestTag).toBe('v0.26.0');
    expect(calls.some(c => c.includes('matching-refs'))).toBe(false);
  });

  it('excludes the branch matching the current release', async () => {
    vi.mocked(fetch).mockImplementation(async (url: string | URL | Request) => {
      const urlStr = url.toString();
      if (new URL(urlStr).hostname === 'raw.githubusercontent.com') {
        return {
          ok: true,
          json: () => Promise.resolve({
            id: 'core', label: 'Core', contentDir: 'core',
            archiveCount: 2, versionSource: 'branch', sidebarOrder: [],
          }),
        } as Response;
      }
      if (urlStr.includes('matching-refs')) {
        return {
          ok: true,
          json: () => Promise.resolve([
            { ref: 'refs/heads/release/1.0' },
            { ref: 'refs/heads/release/0.63' },
            { ref: 'refs/heads/release/0.62' },
          ]),
        } as Response;
      }
      if (urlStr.includes('/releases')) {
        // Latest release is v1.0.0 — release/1.0 should be excluded from archived
        return {
          ok: true,
          json: () => Promise.resolve([
            { tag_name: 'v1.0.0', prerelease: false, draft: false },
          ]),
        } as Response;
      }
      return { ok: false, status: 404 } as Response;
    });

    const result = await discoverAllVersions(
      [{ repo: 'defenseunicorns/uds-core', branch: 'release/1.0' }],
      {},
    );
    const entry = result['defenseunicorns/uds-core'];
    expect(entry.latestTag).toBe('v1.0.0');
    // release/1.0 excluded because it matches latestTag v1.0.0
    expect(entry.versions).toEqual([
      { ref: 'release/0.63', display: 'v0.63', slug: 'v0-63' },
      { ref: 'release/0.62', display: 'v0.62', slug: 'v0-62' },
    ]);
  });
});
