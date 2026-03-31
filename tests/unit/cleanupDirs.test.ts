import { describe, it, expect } from 'vitest';
import { findUnlistedDirs } from '../../src/build/cleanupDirs';

describe('findUnlistedDirs', () => {
  it('returns dirs not in the allowed list', () => {
    const result = findUnlistedDirs(['getting-started', 'dev', 'adr'], ['getting-started']);
    expect(result).toEqual(expect.arrayContaining(['dev', 'adr']));
    expect(result).toHaveLength(2);
  });

  it('returns empty when all dirs are allowed', () => {
    expect(findUnlistedDirs(['getting-started', 'how-to-guides'], ['getting-started', 'how-to-guides']))
      .toHaveLength(0);
  });

  it('preserves dot-directories and version directories', () => {
    const result = findUnlistedDirs(['.c4', '.images', 'v0-61', 'dev'], []);
    expect(result).toEqual(['dev']);
  });

  it('does not preserve version-like dirs that do not match the pattern', () => {
    expect(findUnlistedDirs(['v0-61-extra'], [])).toContain('v0-61-extra');
  });

  it('handles a realistic mix', () => {
    const present = ['getting-started', 'how-to-guides', 'dev', 'adr', '.c4', '.images', 'v0-61'];
    const allowed = ['getting-started', 'how-to-guides'];
    const result = findUnlistedDirs(present, allowed);
    expect(result).toEqual(expect.arrayContaining(['dev', 'adr']));
    expect(result).toHaveLength(2);
  });
});
