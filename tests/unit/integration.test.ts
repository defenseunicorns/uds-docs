import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import {
  collectDirsDeepestFirst,
  collectMarkdownFiles,
  removeStaleVersionDirs,
} from '../../src/build/integration';

// ---------------------------------------------------------------------------
// collectDirsDeepestFirst
// ---------------------------------------------------------------------------
//
// The function replicates: find "$TARGET_DIR" -depth -mindepth 3 -type d
//   -not -path '*/.c4*' -not -path '*/.images*'
//   -not -path '*/v[0-9]*-[0-9]*/*'
//
// Depth counting: walk() starts with depth=1 for direct children of TARGET_DIR.
//   depth 1 = product dirs   (e.g. "core")          — NOT collected
//   depth 2 = section dirs   (e.g. "core/getting-started") — NOT collected
//   depth 3 = sub-section dirs                        — collected
//   depth 4+ = deeper dirs                            — collected, children first

describe('collectDirsDeepestFirst', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-collect-dirs-${Date.now()}`);
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

  describe('mindepth 3 — depth-1 and depth-2 dirs are excluded', () => {
    it('does not include a depth-1 directory (product dir)', () => {
      mkdir('core');
      expect(collectDirsDeepestFirst(tmpDir)).toHaveLength(0);
    });

    it('does not include a depth-2 directory (section dir)', () => {
      mkdir('core', 'getting-started');
      expect(collectDirsDeepestFirst(tmpDir)).toHaveLength(0);
    });
  });

  describe('depth-3 and deeper dirs are collected', () => {
    it('includes a depth-3 directory', () => {
      mkdir('core', 'getting-started', 'local-demo');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('local-demo');
    });

    it('includes a depth-4 directory', () => {
      mkdir('core', 'getting-started', 'local-demo', 'advanced');
      const result = collectDirsDeepestFirst(tmpDir);
      // Both depth-3 and depth-4 dirs are included
      expect(result.length).toBe(2);
    });

    it('collects depth-3 dirs across multiple product/section parents', () => {
      mkdir('core', 'getting-started', 'dir-a');
      mkdir('cli', 'reference', 'dir-b');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result).toHaveLength(2);
    });
  });

  describe('post-order (deepest first)', () => {
    it('returns a child directory before its parent', () => {
      mkdir('core', 'getting-started', 'parent');
      mkdir('core', 'getting-started', 'parent', 'child');
      const result = collectDirsDeepestFirst(tmpDir);
      const childIdx = result.findIndex(p => p.endsWith('child'));
      const parentIdx = result.findIndex(p => p.endsWith('parent'));
      expect(childIdx).toBeLessThan(parentIdx);
    });

    it('returns a grandchild before its grandparent (three levels deep)', () => {
      mkdir('core', 'section', 'level3');
      mkdir('core', 'section', 'level3', 'level4');
      mkdir('core', 'section', 'level3', 'level4', 'level5');
      const result = collectDirsDeepestFirst(tmpDir);
      const idx5 = result.findIndex(p => p.endsWith('level5'));
      const idx4 = result.findIndex(p => p.endsWith('level4'));
      const idx3 = result.findIndex(p => p.endsWith('level3'));
      expect(idx5).toBeLessThan(idx4);
      expect(idx4).toBeLessThan(idx3);
    });
  });

  describe('exclusions', () => {
    it('excludes .c4 directories', () => {
      mkdir('core', 'getting-started', '.c4');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result.some(p => p.includes('.c4'))).toBe(false);
    });

    it('excludes directories nested inside .c4', () => {
      mkdir('core', 'getting-started', '.c4', 'nested');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result.some(p => p.includes('.c4'))).toBe(false);
      expect(result.some(p => p.includes('nested'))).toBe(false);
    });

    it('excludes .images directories', () => {
      mkdir('core', 'getting-started', '.images');
      expect(collectDirsDeepestFirst(tmpDir).some(p => p.includes('.images'))).toBe(false);
    });

    it('excludes version directories (e.g. v0-61)', () => {
      mkdir('core', 'v0-61');
      expect(collectDirsDeepestFirst(tmpDir).some(p => p.includes('v0-61'))).toBe(false);
    });

    it('excludes directories nested inside a version directory', () => {
      mkdir('core', 'v0-61', 'getting-started', 'local-demo');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result.some(p => p.includes('v0-61'))).toBe(false);
      expect(result.some(p => p.includes('local-demo'))).toBe(false);
    });

    it('does not exclude a non-version dir that starts with "v" but does not match the pattern', () => {
      // "v0-61-extra" does not match VERSION_SLUG_RE — should be collected if at depth 3
      mkdir('core', 'section', 'v0-61-extra');
      const result = collectDirsDeepestFirst(tmpDir);
      expect(result.some(p => p.includes('v0-61-extra'))).toBe(true);
    });
  });

  describe('returns an empty array for an empty directory', () => {
    it('returns [] when targetDir is empty', () => {
      expect(collectDirsDeepestFirst(tmpDir)).toHaveLength(0);
    });
  });
});

// ---------------------------------------------------------------------------
// collectMarkdownFiles
// ---------------------------------------------------------------------------
//
// Collects all .md and .mdx files under targetDir, excluding files inside
// version directories (v[0-9]*-[0-9]*).

describe('collectMarkdownFiles', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-collect-md-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  /** Write a file relative to tmpDir, creating parent dirs as needed. */
  function touch(relativePath: string, content = ''): void {
    const segments = relativePath.split('/');
    const parentParts = segments.slice(0, -1);
    if (parentParts.length > 0) {
      mkdirSync(join(tmpDir, ...parentParts), { recursive: true });
    }
    writeFileSync(join(tmpDir, relativePath), content);
  }

  describe('file type filtering', () => {
    it('collects .md files', () => {
      touch('core/getting-started/overview.md');
      const result = collectMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('overview.md');
    });

    it('collects .mdx files', () => {
      touch('core/index.mdx');
      const result = collectMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0]).toContain('index.mdx');
    });

    it('does not collect non-markdown files', () => {
      touch('core/getting-started/diagram.png');
      touch('core/config.json');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(0);
    });

    it('collects both .md and .mdx files together', () => {
      touch('core/a.md');
      touch('core/b.mdx');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(2);
    });
  });

  describe('version directory exclusion', () => {
    it('does not collect files inside a version directory', () => {
      touch('core/v0-61/getting-started/overview.md');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(0);
    });

    it('collects non-versioned files alongside version dirs', () => {
      touch('core/getting-started/overview.md');
      touch('core/v0-61/getting-started/overview.md');
      const result = collectMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
      expect(result[0]).not.toContain('v0-61');
    });

    it('does not recurse into version dirs at the product root level', () => {
      touch('v0-61/getting-started/page.md');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(0);
    });
  });

  describe('recursive traversal', () => {
    it('collects files from multiple nested directories', () => {
      touch('core/getting-started/a.md');
      touch('core/reference/b.mdx');
      touch('cli/commands/c.md');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(3);
    });

    it('collects files at the root of targetDir', () => {
      touch('404.md');
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(1);
    });
  });

  describe('edge cases', () => {
    it('returns an empty array when targetDir is empty', () => {
      expect(collectMarkdownFiles(tmpDir)).toHaveLength(0);
    });

    it('does not confuse a file named like a version dir', () => {
      // "v0-61.md" is a file, not a directory — must be collected
      touch('core/v0-61.md');
      const result = collectMarkdownFiles(tmpDir);
      expect(result).toHaveLength(1);
    });
  });
});

// ---------------------------------------------------------------------------
// removeStaleVersionDirs
// ---------------------------------------------------------------------------
//
// Removes directories matching VERSION_SLUG_RE (v[0-9]+-[0-9]+) at maxdepth 1
// inside the given directory. Non-version dirs and files are left untouched.

describe('removeStaleVersionDirs', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-stale-vers-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('removes a version-slug directory', () => {
    mkdirSync(join(tmpDir, 'v0-61'));
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'v0-61'))).toBe(false);
  });

  it('removes multiple version-slug directories', () => {
    mkdirSync(join(tmpDir, 'v0-61'));
    mkdirSync(join(tmpDir, 'v0-62'));
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'v0-61'))).toBe(false);
    expect(existsSync(join(tmpDir, 'v0-62'))).toBe(false);
  });

  it('does not remove non-version directories', () => {
    mkdirSync(join(tmpDir, 'getting-started'));
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'getting-started'))).toBe(true);
  });

  it('does not remove files', () => {
    writeFileSync(join(tmpDir, 'v0-61.md'), '# not a dir');
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'v0-61.md'))).toBe(true);
  });

  it('does not remove dirs that look version-like but do not match the pattern', () => {
    mkdirSync(join(tmpDir, 'v0-61-extra'));
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'v0-61-extra'))).toBe(true);
  });

  it('does not recurse — only removes maxdepth 1 version dirs', () => {
    // A version dir nested inside a non-version dir must not be touched
    mkdirSync(join(tmpDir, 'core', 'v0-61'), { recursive: true });
    removeStaleVersionDirs(tmpDir);
    expect(existsSync(join(tmpDir, 'core', 'v0-61'))).toBe(true);
  });

  it('does nothing when the directory does not exist', () => {
    // Should not throw for a non-existent path
    expect(() => removeStaleVersionDirs(join(tmpDir, 'nonexistent'))).not.toThrow();
  });

  it('does nothing when the directory is empty', () => {
    expect(() => removeStaleVersionDirs(tmpDir)).not.toThrow();
  });
});
