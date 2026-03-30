import { describe, it, expect } from 'vitest';
import { findUnlistedDirs, VERSION_SLUG_RE } from '../../src/build/cleanupDirs';

describe('findUnlistedDirs', () => {
  describe('basic filtering', () => {
    it('returns dirs not in the allowed list', () => {
      const result = findUnlistedDirs(['getting-started', 'dev', 'adr'], ['getting-started']);
      expect(result).toEqual(expect.arrayContaining(['dev', 'adr']));
      expect(result).toHaveLength(2);
    });

    it('returns an empty array when all dirs are allowed', () => {
      const result = findUnlistedDirs(
        ['getting-started', 'how-to-guides'],
        ['getting-started', 'how-to-guides'],
      );
      expect(result).toHaveLength(0);
    });

    it('returns an empty array when present is empty', () => {
      expect(findUnlistedDirs([], ['getting-started'])).toHaveLength(0);
    });

    it('returns all dirs when allowed is empty and no special dirs', () => {
      const result = findUnlistedDirs(['dev', 'adr', 'internal'], []);
      expect(result).toEqual(expect.arrayContaining(['dev', 'adr', 'internal']));
    });
  });

  describe('dot-directory preservation', () => {
    it('always keeps .c4 regardless of allowed list', () => {
      const result = findUnlistedDirs(['.c4', 'dev'], []);
      expect(result).toEqual(['dev']);
      expect(result).not.toContain('.c4');
    });

    it('always keeps .images regardless of allowed list', () => {
      const result = findUnlistedDirs(['.images', 'adr'], []);
      expect(result).toEqual(['adr']);
      expect(result).not.toContain('.images');
    });

    it('keeps any dot-prefixed directory name', () => {
      const result = findUnlistedDirs(['.hidden', 'unlisted'], []);
      expect(result).toEqual(['unlisted']);
    });
  });

  describe('version directory preservation', () => {
    it('always keeps version dirs (e.g. v0-61)', () => {
      const result = findUnlistedDirs(['v0-61', 'dev'], []);
      expect(result).toEqual(['dev']);
      expect(result).not.toContain('v0-61');
    });

    it('keeps version dirs with different numbers', () => {
      const result = findUnlistedDirs(['v1-2', 'v0-100', 'dev'], []);
      expect(result).toEqual(['dev']);
    });

    it('does NOT keep dirs that look like versions but do not match the pattern', () => {
      // "v0-61-extra" should not be treated as a version dir
      const result = findUnlistedDirs(['v0-61-extra'], []);
      expect(result).toContain('v0-61-extra');
    });
  });

  describe('combined scenarios', () => {
    it('handles a realistic mix of dirs', () => {
      const present = ['getting-started', 'how-to-guides', 'dev', 'adr', '.c4', '.images', 'v0-61'];
      const allowed = ['getting-started', 'how-to-guides'];
      const result = findUnlistedDirs(present, allowed);
      expect(result).toEqual(expect.arrayContaining(['dev', 'adr']));
      expect(result).not.toContain('getting-started');
      expect(result).not.toContain('how-to-guides');
      expect(result).not.toContain('.c4');
      expect(result).not.toContain('.images');
      expect(result).not.toContain('v0-61');
    });
  });
});

describe('VERSION_SLUG_RE', () => {
  it('matches standard version slugs', () => {
    expect(VERSION_SLUG_RE.test('v0-61')).toBe(true);
    expect(VERSION_SLUG_RE.test('v1-2')).toBe(true);
    expect(VERSION_SLUG_RE.test('v0-100')).toBe(true);
  });

  it('does not match non-version strings', () => {
    expect(VERSION_SLUG_RE.test('v0-61-extra')).toBe(false);
    expect(VERSION_SLUG_RE.test('core')).toBe(false);
    expect(VERSION_SLUG_RE.test('getting-started')).toBe(false);
    expect(VERSION_SLUG_RE.test('0-61')).toBe(false); // missing 'v'
  });
});
