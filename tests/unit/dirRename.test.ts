import { describe, it, expect } from 'vitest';
import { toTitleCase, computeSlugRename } from '../../src/build/dirRename';

describe('toTitleCase', () => {
  it('title-cases hyphenated names', () => {
    expect(toTitleCase('getting-started')).toBe('Getting Started');
    expect(toTitleCase('how-to-guides')).toBe('How To Guides');
  });

  it('applies acronym overrides', () => {
    expect(toTitleCase('uds-configuration')).toBe('UDS Configuration');
    expect(toTitleCase('idam-provider')).toBe('IdAM Provider');
    expect(toTitleCase('identity-and-access')).toBe('Identity & Access');
    expect(toTitleCase('uds-and-idam')).toBe('UDS & IdAM');
  });

  it('applies phrase overrides (full match only)', () => {
    expect(toTitleCase('single-sign-on')).toBe('Single Sign-On');
    expect(toTitleCase('uds-single-sign-on')).toBe('UDS Single Sign On');
  });

  it('returns null for ineligible names', () => {
    expect(toTitleCase('core')).toBeNull();           // no hyphens
    expect(toTitleCase('Getting-Started')).toBeNull(); // uppercase
    expect(toTitleCase('v0-61')).toBeNull();           // version slug
    expect(toTitleCase('')).toBeNull();                // empty
  });
});

describe('computeSlugRename', () => {
  it('replaces -and- with -- in the last segment only', () => {
    expect(computeSlugRename('getting-started/identity-and-access'))
      .toEqual(['getting-started/identity-and-access', 'getting-started/identity--access']);
  });

  it('does not corrupt parent segments containing -and-', () => {
    expect(computeSlugRename('and-stuff/cats-and-dogs'))
      .toEqual(['and-stuff/cats-and-dogs', 'and-stuff/cats--dogs']);
  });

  it('handles bare segments (no slashes)', () => {
    expect(computeSlugRename('cats-and-dogs'))
      .toEqual(['cats-and-dogs', 'cats--dogs']);
  });

  it('returns identical values when no -and- is present', () => {
    const [old, next] = computeSlugRename('getting-started/single-sign-on');
    expect(old).toBe(next);
  });
});
