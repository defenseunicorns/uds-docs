import { describe, it, expect } from 'vitest';
import { rewriteLinks } from './linkRewrite';

describe('rewriteLinks', () => {
  it('rewrites matching /old/ paths to /new/', () => {
    const content = 'See [page](/getting-started/identity-and-access/overview).';
    const result = rewriteLinks(content, [
      ['getting-started/identity-and-access', 'getting-started/identity--access'],
    ]);
    expect(result).toBe('See [page](/getting-started/identity--access/overview).');
  });

  it('applies multiple renames', () => {
    const content = '/a/identity-and-access/p and /b/cats-and-dogs/q';
    const result = rewriteLinks(content, [
      ['a/identity-and-access', 'a/identity--access'],
      ['b/cats-and-dogs', 'b/cats--dogs'],
    ]);
    expect(result).toContain('/a/identity--access/p');
    expect(result).toContain('/b/cats--dogs/q');
  });

  it('returns original when no renames match', () => {
    const content = 'No links here.';
    expect(rewriteLinks(content, [['a/b', 'a--b']])).toBe(content);
    expect(rewriteLinks(content, [])).toBe(content);
  });

  it('requires trailing slash (does not partial-match end of URL)', () => {
    const content = '/getting-started/identity-and-access';
    expect(rewriteLinks(content, [
      ['getting-started/identity-and-access', 'getting-started/identity--access'],
    ])).toBe(content);
  });
});
