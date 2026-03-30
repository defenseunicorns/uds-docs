import { describe, it, expect } from 'vitest';
import { rewriteLinks } from '../../src/build/linkRewrite';

describe('rewriteLinks', () => {
  describe('basic rewriting', () => {
    it('rewrites a single matching link', () => {
      const content = 'See [page](/getting-started/identity-and-access/overview).';
      const result = rewriteLinks(content, [
        ['getting-started/identity-and-access', 'getting-started/identity--access'],
      ]);
      expect(result).toBe('See [page](/getting-started/identity--access/overview).');
    });

    it('rewrites all occurrences of the same path', () => {
      const content =
        'First: /getting-started/identity-and-access/page1\n' +
        'Second: /getting-started/identity-and-access/page2';
      const result = rewriteLinks(content, [
        ['getting-started/identity-and-access', 'getting-started/identity--access'],
      ]);
      expect(result).toContain('/getting-started/identity--access/page1');
      expect(result).toContain('/getting-started/identity--access/page2');
      expect(result).not.toContain('/identity-and-access/');
    });

    it('applies multiple renames in a single pass', () => {
      const content =
        '/section-a/identity-and-access/page and /section-b/cats-and-dogs/item';
      const result = rewriteLinks(content, [
        ['section-a/identity-and-access', 'section-a/identity--access'],
        ['section-b/cats-and-dogs', 'section-b/cats--dogs'],
      ]);
      expect(result).toContain('/section-a/identity--access/page');
      expect(result).toContain('/section-b/cats--dogs/item');
    });
  });

  describe('no-match cases', () => {
    it('returns the original string when no renames match', () => {
      const content = 'No links here.';
      const result = rewriteLinks(content, [
        ['getting-started/identity-and-access', 'getting-started/identity--access'],
      ]);
      expect(result).toBe(content);
    });

    it('returns the original string when renames array is empty', () => {
      const content = '/getting-started/identity-and-access/page';
      const result = rewriteLinks(content, []);
      expect(result).toBe(content);
    });

    it('does not partially match path segments', () => {
      // "/identity-and-access" without a trailing slash should not be rewritten
      // (the slash wrapping prevents partial matches at the end of a URL)
      const content = 'Link: /getting-started/identity-and-access';
      const result = rewriteLinks(content, [
        ['getting-started/identity-and-access', 'getting-started/identity--access'],
      ]);
      // No trailing slash means this is an exact page URL, not a directory prefix —
      // the wrapping slashes in the rewrite pattern won't match.
      expect(result).toBe(content);
    });
  });

  describe('edge cases', () => {
    it('handles empty content', () => {
      expect(rewriteLinks('', [['a/b', 'a--b']])).toBe('');
    });

    it('handles content in code blocks (sed-equivalent: rewrites all occurrences)', () => {
      // The original bash `sed` also rewrites links inside code blocks —
      // this matches that behavior for consistency.
      const content = '```\n/section/cats-and-dogs/example\n```';
      const result = rewriteLinks(content, [['section/cats-and-dogs', 'section/cats--dogs']]);
      expect(result).toContain('/section/cats--dogs/example');
    });
  });
});
