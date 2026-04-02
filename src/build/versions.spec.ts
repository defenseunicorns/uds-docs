import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { writeFileSync, mkdirSync, mkdtempSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  discoverAllVersions,
  discoverVersions,
  fetchDocsConfig,
  minorKey,
  parseOverrides,
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

  it('returns latest + archived, deduplicates by minor', async () => {
    mockReleases(['v0.62.0', 'v0.61.1', 'v0.61.0', 'v0.60.0']);
    const result = await discoverVersions('defenseunicorns/uds-core', 2);
    expect(result.latestTag).toBe('v0.62.0');
    expect(result.archived).toEqual(['v0.61.1', 'v0.60.0']);
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
    expect(result.archived).toEqual(['v0.62.0', 'v0.61.0']);
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

  it('skips GitHub discovery and uses provided tags', async () => {
    const products = [{ repo: 'test/test-product', archiveVersions: ['v0.1.0'] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/test-product'].versions).toEqual(['v0.1.0']);
    expect(result['test/test-product'].branch).toBe('main');
    expect(fetch).not.toHaveBeenCalled();
  });

  it('respects branch field', async () => {
    const products = [{ repo: 'test/p', branch: 'develop', archiveVersions: ['v0.1.0'] }];
    const result = await discoverAllVersions(products, {});
    expect(result['test/p'].branch).toBe('develop');
  });
});
