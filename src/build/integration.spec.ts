import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  collectDirsDeepestFirst,
  collectMarkdownFiles,
  removeStaleVersionDirs,
  writeChannelRedirects,
} from './integration';
import type { DocsConfig } from './types';

describe('collectDirsDeepestFirst', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-collect-dirs-'));
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function mkdir(...segments: string[]): string {
    const p = join(tmpDir, ...segments);
    mkdirSync(p, { recursive: true });
    return p;
  }

  it('excludes depth-1 and depth-2 dirs (mindepth 3)', () => {
    mkdir('core');
    mkdir('core', 'getting-started');
    expect(collectDirsDeepestFirst(tmpDir)).toHaveLength(0);
  });

  it('includes depth-3 and depth-4 dirs', () => {
    mkdir('core', 'getting-started', 'local-demo', 'advanced');
    const result = collectDirsDeepestFirst(tmpDir);
    expect(result.length).toBe(2);
  });

  it('returns deepest first (post-order)', () => {
    mkdir('core', 'getting-started', 'parent', 'child');
    const result = collectDirsDeepestFirst(tmpDir);
    const childIdx = result.findIndex(p => p.endsWith('child'));
    const parentIdx = result.findIndex(p => p.endsWith('parent'));
    expect(childIdx).toBeLessThan(parentIdx);
  });

  it('excludes dot-directories and their contents', () => {
    mkdir('core', 'getting-started', '.c4', 'nested');
    mkdir('core', 'getting-started', '.images');
    const result = collectDirsDeepestFirst(tmpDir);
    expect(result).toHaveLength(0);
  });

  it('excludes version directories and their contents', () => {
    mkdir('core', 'v0-61', 'getting-started', 'local-demo');
    expect(collectDirsDeepestFirst(tmpDir)).toHaveLength(0);
  });

  it('does not exclude non-version dirs that start with "v"', () => {
    mkdir('core', 'section', 'v0-61-extra');
    expect(collectDirsDeepestFirst(tmpDir).some(p => p.includes('v0-61-extra'))).toBe(true);
  });
});

describe('collectMarkdownFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-collect-md-'));
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  function touch(relativePath: string): void {
    const segments = relativePath.split('/');
    if (segments.length > 1) {
      mkdirSync(join(tmpDir, ...segments.slice(0, -1)), { recursive: true });
    }
    writeFileSync(join(tmpDir, relativePath), '');
  }

  it('collects .md and .mdx files, ignores others', () => {
    touch('core/a.md');
    touch('core/b.mdx');
    touch('core/c.png');
    expect(collectMarkdownFiles(tmpDir)).toHaveLength(2);
  });

  it('excludes files inside version directories', () => {
    touch('core/getting-started/overview.md');
    touch('core/v0-61/getting-started/overview.md');
    const result = collectMarkdownFiles(tmpDir);
    expect(result).toHaveLength(1);
    expect(result[0]).not.toContain('v0-61');
  });

  it('collects from nested dirs and root', () => {
    touch('404.md');
    touch('core/getting-started/a.md');
    touch('cli/commands/b.md');
    expect(collectMarkdownFiles(tmpDir)).toHaveLength(3);
  });
});

describe('removeStaleVersionDirs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-stale-vers-'));
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes version-slug directories', () => {
    mkdirSync(join(tmpDir, 'v0-61'));
    mkdirSync(join(tmpDir, 'v0-62'));
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'v0-61'))).toBe(false);
    expect(existsSync(join(tmpDir, 'v0-62'))).toBe(false);
  });

  it('preserves non-version dirs, files, and non-matching "v" dirs', () => {
    mkdirSync(join(tmpDir, 'getting-started'));
    mkdirSync(join(tmpDir, 'v0-61-extra'));
    writeFileSync(join(tmpDir, 'v0-61.md'), '');
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'getting-started'))).toBe(true);
    expect(existsSync(join(tmpDir, 'v0-61-extra'))).toBe(true);
    expect(existsSync(join(tmpDir, 'v0-61.md'))).toBe(true);
  });

  it('does not recurse into subdirectories', () => {
    mkdirSync(join(tmpDir, 'core', 'v0-61'), { recursive: true });
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'core', 'v0-61'))).toBe(true);
  });

  it('handles nonexistent and empty directories', () => {
    expect(() => removeStaleVersionDirs(join(tmpDir, 'nonexistent'))).not.toThrow();
    expect(() => removeStaleVersionDirs(tmpDir)).not.toThrow();
  });
});

describe('writeChannelRedirects', () => {
  let tmpDir: string;
  let targetDir: string;
  let configDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-channel-redirects-'));
    targetDir = join(tmpDir, 'content');
    configDir = join(tmpDir, 'config');
    mkdirSync(join(targetDir, 'core', 'develop', 'Configuration & Packaging'), { recursive: true });
    mkdirSync(join(targetDir, 'core', 'v1-10'), { recursive: true });
    mkdirSync(configDir, { recursive: true });
    writeFileSync(join(targetDir, 'core', 'develop', 'Configuration & Packaging', 'overview.md'), '');
    writeFileSync(join(targetDir, 'core', 'develop', 'Configuration & Packaging', 'some-and-page.md'), '');
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  const versions = {
    'defenseunicorns/uds-core': {
      latestTag: 'v1.10.0',
      versions: [{ display: 'v1.10', slug: 'v1-10' }],
    },
  };
  const config = {
    repo: 'defenseunicorns/uds-core',
    contentDir: 'core',
  } as DocsConfig & { repo: string };

  it('writes current and legacy double-hyphen routes to the latest release', () => {
    writeChannelRedirects(
      versions,
      new Map([['uds-core', config]]),
      new Map([['uds-core', 'develop']]),
      { 'Configuration & Packaging': 'configuration-and-packaging' },
      targetDir,
      configDir,
    );

    const redirects = JSON.parse(readFileSync(join(configDir, 'redirects.json'), 'utf8')) as Record<string, string>;
    expect(redirects['/core/configuration-and-packaging/overview']).toBe(
      '/core/v1-10/configuration-and-packaging/overview/',
    );
    expect(redirects['/core/configuration--packaging/overview']).toBe(
      '/core/v1-10/configuration-and-packaging/overview/',
    );
    expect(redirects['/core/configuration--packaging/some-and-page']).toBe(
      '/core/v1-10/configuration-and-packaging/some-and-page/',
    );
    expect(redirects['/core/configuration--packaging/some--page']).toBeUndefined();
  });

  it('keeps the root on the configured channel when the latest clone is unavailable', () => {
    rmSync(join(targetDir, 'core', 'v1-10'), { recursive: true, force: true });

    writeChannelRedirects(
      versions,
      new Map([['uds-core', config]]),
      new Map([['uds-core', 'develop']]),
      {},
      targetDir,
      configDir,
    );

    const redirects = JSON.parse(readFileSync(join(configDir, 'redirects.json'), 'utf8')) as Record<string, string>;
    expect(redirects['/core']).toBe('/core/develop/');
  });
});
