import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  existsSync,
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { copyDocs, write404Page, writeProductConfig } from './fileOps';

describe('copyDocs', () => {
  let tmpDir: string;
  let src: string;
  let dest: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-filedops-copy-'));
    src = join(tmpDir, 'src');
    dest = join(tmpDir, 'dest');
    mkdirSync(src, { recursive: true });
    mkdirSync(dest, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('copies files and nested directories', () => {
    mkdirSync(join(src, 'getting-started'));
    writeFileSync(join(src, 'guide.md'), '# Guide');
    writeFileSync(join(src, 'getting-started', 'overview.md'), '# Overview');
    copyDocs(src, dest);
    expect(readFileSync(join(dest, 'guide.md'), 'utf8')).toBe('# Guide');
    expect(readFileSync(join(dest, 'getting-started', 'overview.md'), 'utf8')).toBe('# Overview');
  });

  it('does not copy COPY_EXCLUDES (404.md, docs.config.json)', () => {
    writeFileSync(join(src, 'guide.md'), '# Guide');
    writeFileSync(join(src, '404.md'), '# Upstream 404');
    writeFileSync(join(src, 'docs.config.json'), '{}');
    copyDocs(src, dest);
    expect(existsSync(join(dest, '404.md'))).toBe(false);
    expect(existsSync(join(dest, 'docs.config.json'))).toBe(false);
  });

  it('preserves COPY_EXCLUDES already in dest (--delete skips them)', () => {
    writeFileSync(join(src, 'guide.md'), '# Guide');
    writeFileSync(join(dest, '404.md'), '# Generated 404');
    writeFileSync(join(dest, 'docs.config.json'), '{"id":"core"}');
    copyDocs(src, dest);
    expect(readFileSync(join(dest, '404.md'), 'utf8')).toBe('# Generated 404');
    expect(readFileSync(join(dest, 'docs.config.json'), 'utf8')).toBe('{"id":"core"}');
  });

  it('deletes stale files and dirs from dest (--delete)', () => {
    writeFileSync(join(src, 'guide.md'), '# Guide');
    writeFileSync(join(dest, 'old-guide.md'), '# Old');
    mkdirSync(join(dest, 'stale-dir'), { recursive: true });
    writeFileSync(join(dest, 'stale-dir', 'old.md'), '# Old');
    copyDocs(src, dest);
    expect(existsSync(join(dest, 'old-guide.md'))).toBe(false);
    expect(existsSync(join(dest, 'stale-dir'))).toBe(false);
  });

  it('removes stale Title-Cased dirs from previous builds', () => {
    mkdirSync(join(src, 'getting-started'));
    writeFileSync(join(src, 'getting-started', 'page.md'), '# Page');
    mkdirSync(join(dest, 'Getting Started'), { recursive: true });
    copyDocs(src, dest);
    expect(existsSync(join(dest, 'getting-started', 'page.md'))).toBe(true);
    expect(existsSync(join(dest, 'Getting Started'))).toBe(false);
  });

  it('dereferences symlinks (copies content, not the link)', () => {
    const realFile = join(tmpDir, 'real.md');
    writeFileSync(realFile, '# Real Content');
    symlinkSync(realFile, join(src, 'linked.md'));

    copyDocs(src, dest);

    expect(readFileSync(join(dest, 'linked.md'), 'utf8')).toBe('# Real Content');
    expect(lstatSync(join(dest, 'linked.md')).isSymbolicLink()).toBe(false);
  });
});

describe('writeProductConfig', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-fileops-config-'));
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('merges repo field into config and writes JSON', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify({
      id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: [],
    }));
    const outputPath = join(tmpDir, 'output.json');
    writeProductConfig(tmpDir, 'defenseunicorns/uds-core', outputPath);

    const result = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(result.id).toBe('core');
    expect(result.repo).toBe('defenseunicorns/uds-core');
  });

  it('includes ref field when provided', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify({
      id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: [],
    }));
    const outputPath = join(tmpDir, 'output-ref.json');
    writeProductConfig(tmpDir, 'defenseunicorns/uds-core', outputPath, 'release/1.0');

    const result = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(result.repo).toBe('defenseunicorns/uds-core');
    expect(result.ref).toBe('release/1.0');
  });

  it('omits ref field when not provided', () => {
    writeFileSync(join(tmpDir, 'docs.config.json'), JSON.stringify({
      id: 'core', label: 'UDS Core', contentDir: 'core', sidebarOrder: [],
    }));
    const outputPath = join(tmpDir, 'output-noref.json');
    writeProductConfig(tmpDir, 'defenseunicorns/uds-core', outputPath);

    const result = JSON.parse(readFileSync(outputPath, 'utf8'));
    expect(result.repo).toBe('defenseunicorns/uds-core');
    expect(result.ref).toBeUndefined();
  });

  it('throws when docs.config.json is missing or malformed', () => {
    expect(() => writeProductConfig(tmpDir, 'org/repo', join(tmpDir, 'out.json')))
      .toThrow('docs.config.json not found');

    writeFileSync(join(tmpDir, 'docs.config.json'), 'not-json');
    expect(() => writeProductConfig(tmpDir, 'org/repo', join(tmpDir, 'out.json')))
      .toThrow('Failed to parse');
  });
});

describe('write404Page', () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = mkdtempSync(join(tmpdir(), 'uds-fileops-404-'));
    mkdirSync(tmpDir, { recursive: true });
  });

  afterEach(() => {
    rmSync(tmpDir, { recursive: true, force: true });
  });

  it('non-versioned page has correct frontmatter and body', () => {
    write404Page(join(tmpDir, '404.md'), false);
    const content = readFileSync(join(tmpDir, '404.md'), 'utf8');
    expect(content).toContain('title: Page Not Found');
    expect(content).toContain('pagefind: false');
    expect(content).toContain('Use the sidebar to navigate');
    expect(content).not.toContain('Version');
  });

  it('versioned page mentions the Version selector', () => {
    write404Page(join(tmpDir, '404.md'), true);
    const content = readFileSync(join(tmpDir, '404.md'), 'utf8');
    expect(content).toContain("doesn't exist in this version");
    expect(content).toContain('Version');
  });
});
