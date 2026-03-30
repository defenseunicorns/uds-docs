import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { copyDocs, write404Page, writeProductConfig } from '../../src/build/fileOps';

// ---------------------------------------------------------------------------
// copyDocs
// ---------------------------------------------------------------------------

describe('copyDocs', () => {
  let tmpDir: string;
  let src: string;
  let dest: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-filedops-copy-${Date.now()}`);
    src = join(tmpDir, 'src');
    dest = join(tmpDir, 'dest');
    mkdirSync(src, { recursive: true });
    mkdirSync(dest, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('basic copying', () => {
    it('copies a file from src to dest', () => {
      writeFileSync(join(src, 'guide.md'), '# Guide');
      copyDocs(src, dest);
      expect(readFileSync(join(dest, 'guide.md'), 'utf8')).toBe('# Guide');
    });

    it('creates dest if it does not already exist', () => {
      const newDest = join(tmpDir, 'new-dest');
      writeFileSync(join(src, 'guide.md'), '# Guide');
      copyDocs(src, newDest);
      expect(readFileSync(join(newDest, 'guide.md'), 'utf8')).toBe('# Guide');
    });

    it('recursively copies nested directories', () => {
      mkdirSync(join(src, 'getting-started'));
      writeFileSync(join(src, 'getting-started', 'overview.md'), '# Overview');
      copyDocs(src, dest);
      expect(readFileSync(join(dest, 'getting-started', 'overview.md'), 'utf8')).toBe('# Overview');
    });

    it('copies multiple files', () => {
      writeFileSync(join(src, 'a.md'), 'A');
      writeFileSync(join(src, 'b.md'), 'B');
      copyDocs(src, dest);
      expect(readFileSync(join(dest, 'a.md'), 'utf8')).toBe('A');
      expect(readFileSync(join(dest, 'b.md'), 'utf8')).toBe('B');
    });
  });

  describe('COPY_EXCLUDES — 404.md and docs.config.json', () => {
    it('does not copy 404.md from src', () => {
      writeFileSync(join(src, 'guide.md'), '# Guide');
      writeFileSync(join(src, '404.md'), '# Upstream 404');
      copyDocs(src, dest);
      expect(existsSync(join(dest, '404.md'))).toBe(false);
    });

    it('does not copy docs.config.json from src', () => {
      writeFileSync(join(src, 'guide.md'), '# Guide');
      writeFileSync(join(src, 'docs.config.json'), '{}');
      copyDocs(src, dest);
      expect(existsSync(join(dest, 'docs.config.json'))).toBe(false);
    });

    it('preserves a generated 404.md already in dest (--delete does not remove it)', () => {
      // This is the critical regression case: the integration pipeline writes
      // a 404.md to dest; on the next build src still has no 404.md, so the
      // --delete phase must NOT delete the generated one.
      writeFileSync(join(src, 'guide.md'), '# Guide');
      writeFileSync(join(dest, '404.md'), '# Generated 404');
      copyDocs(src, dest);
      expect(readFileSync(join(dest, '404.md'), 'utf8')).toBe('# Generated 404');
    });

    it('preserves docs.config.json already in dest (--delete does not remove it)', () => {
      // docs.config.json is written to dest by writeProductConfig before copyDocs
      // runs; it must survive the --delete phase.
      writeFileSync(join(src, 'guide.md'), '# Guide');
      writeFileSync(join(dest, 'docs.config.json'), '{"id":"core"}');
      copyDocs(src, dest);
      expect(readFileSync(join(dest, 'docs.config.json'), 'utf8')).toBe('{"id":"core"}');
    });
  });

  describe('--delete behaviour', () => {
    it('deletes a file from dest that no longer exists in src', () => {
      writeFileSync(join(src, 'guide.md'), '# Guide');
      writeFileSync(join(dest, 'old-guide.md'), '# Old Guide');
      copyDocs(src, dest);
      expect(existsSync(join(dest, 'old-guide.md'))).toBe(false);
    });

    it('deletes a stale subdirectory from dest', () => {
      mkdirSync(join(src, 'new-section'));
      writeFileSync(join(src, 'new-section', 'page.md'), '# Page');
      mkdirSync(join(dest, 'stale-dir'), { recursive: true });
      writeFileSync(join(dest, 'stale-dir', 'old.md'), '# Old');
      copyDocs(src, dest);
      expect(existsSync(join(dest, 'stale-dir'))).toBe(false);
    });

    it('removes a previously Title-Cased dir so it does not accumulate alongside the new copy', () => {
      // Simulate a prior build that renamed "getting-started" to "Getting Started".
      // copyDocs should remove the old Title-Cased dir before copying the fresh one.
      mkdirSync(join(src, 'getting-started'));
      writeFileSync(join(src, 'getting-started', 'page.md'), '# Page');
      mkdirSync(join(dest, 'Getting Started'), { recursive: true });
      writeFileSync(join(dest, 'Getting Started', 'page.md'), '# Old Page');
      copyDocs(src, dest);
      // The fresh kebab-case copy must be present
      expect(existsSync(join(dest, 'getting-started', 'page.md'))).toBe(true);
      // The stale Title-Cased dir must be gone
      expect(existsSync(join(dest, 'Getting Started'))).toBe(false);
    });
  });

  describe('symlink dereferencing (-L behaviour)', () => {
    it('copies the content of a symlinked file, not the symlink itself', () => {
      // Create a real file outside the src tree (simulates a repo-root symlink
      // target, e.g. DEPRECATIONS.md → ../DEPRECATIONS.md)
      const realFile = join(tmpDir, 'real.md');
      writeFileSync(realFile, '# Real Content');
      symlinkSync(realFile, join(src, 'linked.md'));

      copyDocs(src, dest);

      const destPath = join(dest, 'linked.md');
      expect(readFileSync(destPath, 'utf8')).toBe('# Real Content');
      // The destination file must be a regular file, not a symlink
      expect(lstatSync(destPath).isSymbolicLink()).toBe(false);
    });

    it('follows a symlink that points to a directory and copies its contents', () => {
      const realDir = join(tmpDir, 'real-dir');
      mkdirSync(realDir);
      writeFileSync(join(realDir, 'page.md'), '# In Real Dir');
      symlinkSync(realDir, join(src, 'linked-dir'));

      copyDocs(src, dest);

      expect(readFileSync(join(dest, 'linked-dir', 'page.md'), 'utf8')).toBe('# In Real Dir');
      expect(lstatSync(join(dest, 'linked-dir')).isSymbolicLink()).toBe(false);
    });
  });
});

// ---------------------------------------------------------------------------
// writeProductConfig
// ---------------------------------------------------------------------------

describe('writeProductConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-fileops-config-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('reads docs.config.json, merges repo, and writes the result', () => {
    const config = { id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: [] };
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify(config));
    const outputPath = join(tmpDir, 'output.json');

    writeProductConfig(tmpDir, 'defenseunicorns/uds-core', outputPath);

    const result = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(result.id).toBe('core');
    expect(result.label).toBe('UDS Core');
    expect(result.contentDir).toBe('core');
    expect(result.repo).toBe('defenseunicorns/uds-core');
  });

  it('does not mutate or discard existing fields in docs.config.json', () => {
    const config = {
      id: 'core',
      label: 'UDS Core',
      contentDir: 'core',
      archiveCount: 2,
      sidebarOrder: ['getting-started', { dir: 'how-to', label: 'How-to Guides' }],
    };
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify(config));
    const outputPath = join(tmpDir, 'output.json');

    writeProductConfig(tmpDir, 'org/repo', outputPath);

    const result = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(result.archiveCount).toBe(2);
    expect(result.sidebarOrder).toHaveLength(2);
    expect(result.sidebarOrder[1]).toEqual({ dir: 'how-to', label: 'How-to Guides' });
  });

  it('repo field in output overrides any existing repo field in the source config', () => {
    writeFileSync(
      join(tmpDir, 'docs.config.json'),
      JSON.stringify({ id: 'x', repo: 'old/repo', sidebarOrder: [] }),
    );
    const outputPath = join(tmpDir, 'output.json');
    writeProductConfig(tmpDir, 'new/repo', outputPath);
    expect(JSON.parse(readFileSync(outputPath, 'utf8')).repo).toBe('new/repo');
  });

  it('output ends with a trailing newline (consistent formatting)', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify({ id: 'x', sidebarOrder: [] }));
    const outputPath = join(tmpDir, 'output.json');
    writeProductConfig(tmpDir, 'org/repo', outputPath);
    expect(readFileSync(outputPath, 'utf8').endsWith('\n')).toBe(true);
  });

  it('throws when docs.config.json does not exist', () => {
    const outputPath = join(tmpDir, 'output.json');
    expect(() => writeProductConfig(tmpDir, 'org/repo', outputPath)).toThrow(
      'docs.config.json not found',
    );
  });

  it('throws with "Failed to parse" when docs.config.json contains malformed JSON', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), 'not-json {{{');
    const outputPath = join(tmpDir, 'output.json');
    expect(() => writeProductConfig(tmpDir, 'org/repo', outputPath)).toThrow('Failed to parse');
  });
});

// ---------------------------------------------------------------------------
// write404Page
// ---------------------------------------------------------------------------

describe('write404Page', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = join(tmpdir(), `uds-fileops-404-${Date.now()}`);
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  describe('shared frontmatter', () => {
    it.each([
      ['non-versioned', false],
      ['versioned', true],
    ] as const)('%s page has correct frontmatter fields', (_label, isVersioned) => {
      const destPath = join(tmpDir, '404.md');
      write404Page(destPath, isVersioned);
      const content = readFileSync(destPath, 'utf8');
      expect(content).toContain('title: Page Not Found');
      expect(content).toContain('pagefind: false');
      expect(content).toContain('editUrl: false');
      expect(content).toContain('lastUpdated: false');
      expect(content).toContain('sidebar:');
      expect(content).toContain('hidden: true');
    });

    it('both variants produce the same frontmatter block', () => {
      const nonVersioned = join(tmpDir, '404-non.md');
      const versioned = join(tmpDir, '404-ver.md');
      write404Page(nonVersioned, false);
      write404Page(versioned, true);

      const extractFrontmatter = (content: string): string => {
        const match = content.match(/^(---[\s\S]+?---)/);
        return match ? match[1] : '';
      };

      expect(extractFrontmatter(readFileSync(nonVersioned, 'utf8'))).toBe(
        extractFrontmatter(readFileSync(versioned, 'utf8')),
      );
    });
  });

  describe('non-versioned variant (isVersioned: false)', () => {
    it('body mentions the sidebar', () => {
      const destPath = join(tmpDir, '404.md');
      write404Page(destPath, false);
      expect(readFileSync(destPath, 'utf8')).toContain('sidebar');
    });

    it('body does not mention the Version selector', () => {
      const destPath = join(tmpDir, '404.md');
      write404Page(destPath, false);
      expect(readFileSync(destPath, 'utf8')).not.toContain('Version');
    });
  });

  describe('versioned variant (isVersioned: true)', () => {
    it('body mentions the Version selector', () => {
      const destPath = join(tmpDir, '404.md');
      write404Page(destPath, true);
      expect(readFileSync(destPath, 'utf8')).toContain('Version');
    });

    it('body explains the page may not exist in this version', () => {
      const destPath = join(tmpDir, '404.md');
      write404Page(destPath, true);
      expect(readFileSync(destPath, 'utf8')).toContain("doesn't exist in this version");
    });
  });

  it('overwrites an existing file at destPath', () => {
    const destPath = join(tmpDir, '404.md');
    writeFileSync(destPath, 'old content');
    write404Page(destPath, false);
    expect(readFileSync(destPath, 'utf8')).not.toBe('old content');
  });
});
