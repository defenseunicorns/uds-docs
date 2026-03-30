import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  discoverAllVersions,
  discoverVersions,
  fetchDocsConfig,
  minorKey,
  parseOverrides,
  readProductsJson,
} from '../../src/build/versions';

// ---------------------------------------------------------------------------
// minorKey
// ---------------------------------------------------------------------------

describe('minorKey', () => {
  it('strips the patch version from a three-part semver tag', () => {
    expect(minorKey('v0.61.1')).toBe('v0.61');
  });

  it('handles single-digit minor and patch', () => {
    expect(minorKey('v1.2.3')).toBe('v1.2');
  });

  it('handles large version numbers', () => {
    expect(minorKey('v10.100.999')).toBe('v10.100');
  });

  it('always strips the last .N segment regardless of depth', () => {
    // GitHub releases always use three-part semver (v0.61.0), but if a
    // two-part tag were passed, the regex still strips the last .N.
    expect(minorKey('v0.61')).toBe('v0');
  });
});

// ---------------------------------------------------------------------------
// fetchDocsConfig — local override path
// ---------------------------------------------------------------------------

describe('fetchDocsConfig with local override', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-docs-test-${Date.now()}`);
    mkdirSync(join(tmpDir, 'docs'), { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads docs.config.json from the local override path', async () => {
    const config = {
      id: 'core',
      label: 'UDS Core',
      contentDir: 'core',
      sidebarOrder: ['getting-started'],
    };
    writeFileSync(join(tmpDir, 'docs', 'docs.config.json'), JSON.stringify(config));

    const result = await fetchDocsConfig('defenseunicorns/uds-core', 'main', tmpDir);
    expect(result).toEqual(config);
  });

  it('returns null when docs.config.json does not exist at the override path', async () => {
    const result = await fetchDocsConfig('defenseunicorns/uds-core', 'main', tmpDir);
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// fetchDocsConfig — GitHub fetch (mocked)
// ---------------------------------------------------------------------------

describe('fetchDocsConfig with mocked fetch', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('returns parsed config on a 200 response', async () => {
    const config = { id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: [] };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(config),
    } as Response);

    const result = await fetchDocsConfig('defenseunicorns/uds-core', 'main');
    expect(result).toEqual(config);
  });

  it('returns null on a non-200 response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    } as Response);

    const result = await fetchDocsConfig('defenseunicorns/uds-core', 'main');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const result = await fetchDocsConfig('defenseunicorns/uds-core', 'main');
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// discoverVersions (mocked GitHub API)
// ---------------------------------------------------------------------------

describe('discoverVersions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  /** Helper to create a mock releases response */
  function mockReleases(tags: string[], extra: Partial<{ prerelease: boolean; draft: boolean }> = {}) {
    const releases = tags.map(tag => ({ tag_name: tag, prerelease: false, draft: false, ...extra }));
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(releases),
    } as Response);
  }

  it('returns latestTag as index-0 and archived as the rest', async () => {
    mockReleases(['v0.62.0', 'v0.61.0', 'v0.60.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.latestTag).toBe('v0.62.0');
    expect(result.archived).toEqual(['v0.61.0', 'v0.60.0']);
  });

  it('deduplicates — keeps only the first (newest) patch per minor version', async () => {
    // v0.61.1 and v0.61.0 are the same minor → only v0.61.1 kept
    mockReleases(['v0.62.0', 'v0.61.1', 'v0.61.0', 'v0.60.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.latestTag).toBe('v0.62.0');
    expect(result.archived).toEqual(['v0.61.1', 'v0.60.0']);
    expect(result.archived).not.toContain('v0.61.0');
  });

  it('filters out prereleases', async () => {
    const releases = [
      { tag_name: 'v0.62.0-rc1', prerelease: true, draft: false },
      { tag_name: 'v0.61.0', prerelease: false, draft: false },
    ];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(releases),
    } as Response);

    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBe('v0.61.0');
    expect(result.archived).toHaveLength(0);
  });

  it('filters out drafts', async () => {
    const releases = [
      { tag_name: 'v0.62.0', prerelease: false, draft: true },
      { tag_name: 'v0.61.0', prerelease: false, draft: false },
    ];
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(releases),
    } as Response);

    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBe('v0.61.0');
  });

  it('respects count — returns exactly count archived versions', async () => {
    mockReleases(['v0.63.0', 'v0.62.0', 'v0.61.0', 'v0.60.0', 'v0.59.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.archived).toHaveLength(2);
    expect(result.archived).toEqual(['v0.62.0', 'v0.61.0']);
  });

  it('returns empty archived when count is 0', async () => {
    mockReleases(['v0.62.0', 'v0.61.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 0);
    expect(result.latestTag).toBe('v0.62.0');
    expect(result.archived).toHaveLength(0);
  });

  it('returns null latestTag and empty archived on non-OK response', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 403,
      statusText: 'Forbidden',
    } as Response);

    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
    expect(result.archived).toHaveLength(0);
  });

  it('returns null latestTag and empty archived on network error', async () => {
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));
    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
    expect(result.archived).toHaveLength(0);
  });

  it('returns null latestTag and empty archived when the API returns non-array JSON', async () => {
    // GitHub returns an object (e.g. rate-limit error message) instead of an array
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ message: 'API rate limit exceeded' }),
    } as Response);

    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
    expect(result.archived).toHaveLength(0);
  });

  it('returns null latestTag when there are no releases', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    } as Response);

    const result = await discoverVersions('defenseunicorns/uds-core', 1);
    expect(result.latestTag).toBeNull();
    expect(result.archived).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// parseOverrides
// ---------------------------------------------------------------------------

describe('parseOverrides', () => {
  it('returns an empty object for undefined input', () => {
    expect(parseOverrides(undefined)).toEqual({});
  });

  it('returns an empty object for an empty string', () => {
    expect(parseOverrides('')).toEqual({});
  });

  it('parses a single repo-level override', () => {
    expect(parseOverrides('uds-core=/home/dev/uds-core')).toEqual({
      'uds-core': '/home/dev/uds-core',
    });
  });

  it('parses multiple overrides separated by semicolons', () => {
    const result = parseOverrides('uds-core=/home/dev/core;uds-cli=/home/dev/cli');
    expect(result).toEqual({
      'uds-core': '/home/dev/core',
      'uds-cli': '/home/dev/cli',
    });
  });

  it('parses version-specific overrides (key contains @)', () => {
    const result = parseOverrides('uds-core@v0.62.0=/home/dev/core-old');
    expect(result).toEqual({ 'uds-core@v0.62.0': '/home/dev/core-old' });
  });

  it('parses a mix of repo-level and version-specific overrides', () => {
    const result = parseOverrides('uds-core=/home/dev/core;uds-core@v0.61.0=/home/dev/core-old');
    expect(result['uds-core']).toBe('/home/dev/core');
    expect(result['uds-core@v0.61.0']).toBe('/home/dev/core-old');
  });

  it('skips entries with no = sign', () => {
    expect(parseOverrides('uds-core')).toEqual({});
  });

  it('skips entries where the value is empty after trimming', () => {
    expect(parseOverrides('uds-core=')).toEqual({});
  });

  it('skips entries where the key is empty (leading =)', () => {
    expect(parseOverrides('=/home/dev/core')).toEqual({});
  });

  it('handles whitespace around key and value', () => {
    const result = parseOverrides('  uds-core  =  /home/dev/core  ');
    expect(result).toEqual({ 'uds-core': '/home/dev/core' });
  });

  it('ignores a trailing semicolon (empty final entry)', () => {
    const result = parseOverrides('uds-core=/home/dev/core;');
    expect(result).toEqual({ 'uds-core': '/home/dev/core' });
  });

  it('skips a blank entry between two valid overrides', () => {
    const result = parseOverrides('uds-core=/home/dev/core;;uds-cli=/home/dev/cli');
    expect(result).toEqual({
      'uds-core': '/home/dev/core',
      'uds-cli': '/home/dev/cli',
    });
  });
});

// ---------------------------------------------------------------------------
// discoverAllVersions — archiveVersions bypass
// ---------------------------------------------------------------------------

describe('discoverAllVersions with archiveVersions', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn());
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses archiveVersions directly and makes no GitHub API calls', async () => {
    const products = [{ repo: 'test/test-product', archiveVersions: ['v0.1.0'] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].versions).toEqual(['v0.1.0']);
    expect(result['test/test-product'].branch).toBe('main');
    // No GitHub API call should have been made
    expect(fetch).not.toHaveBeenCalled();
  });

  it('uses the branch field when provided alongside archiveVersions', async () => {
    const products = [
      { repo: 'test/test-product', branch: 'develop', archiveVersions: ['v0.1.0'] },
    ];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].branch).toBe('develop');
  });

  it('handles an empty archiveVersions array (no archived versions)', async () => {
    const products = [{ repo: 'test/test-product', archiveVersions: [] as string[] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].versions).toEqual([]);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('handles multiple archiveVersions', async () => {
    const products = [
      { repo: 'test/test-product', archiveVersions: ['v0.2.0', 'v0.1.0'] },
    ];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].versions).toEqual(['v0.2.0', 'v0.1.0']);
  });
});

// ---------------------------------------------------------------------------
// readProductsJson
// ---------------------------------------------------------------------------

describe('readProductsJson', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-products-test-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads and parses a valid products.json', () => {
    const products = [
      { repo: 'defenseunicorns/uds-core' },
      { repo: 'defenseunicorns/uds-cli', branch: 'main' },
    ];
    const path = join(tmpDir, 'products.json');
    writeFileSync(path, JSON.stringify(products));

    const result = readProductsJson(path);
    expect(result).toHaveLength(2);
    expect(result[0].repo).toBe('defenseunicorns/uds-core');
    expect(result[0].branch).toBeUndefined();
    expect(result[1].branch).toBe('main');
  });

  it('throws when the file does not exist', () => {
    const path = join(tmpDir, 'nonexistent.json');
    expect(() => readProductsJson(path)).toThrow();
  });

  it('throws when the file contains invalid JSON', () => {
    const path = join(tmpDir, 'products.json');
    writeFileSync(path, 'not-json {{{');
    expect(() => readProductsJson(path)).toThrow();
  });
});
