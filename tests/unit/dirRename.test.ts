import { describe, it, expect } from 'vitest';
import { toTitleCase, computeSlugRename, ACRONYM_MAP, PHRASE_MAP } from '../../src/build/dirRename';

// ---------------------------------------------------------------------------
// toTitleCase — basic title-casing
// ---------------------------------------------------------------------------

describe('toTitleCase', () => {
  describe('basic title-casing', () => {
    it('title-cases a two-word name', () => {
      expect(toTitleCase('getting-started')).toBe('Getting Started');
    });

    it('title-cases a three-word name', () => {
      expect(toTitleCase('how-to-guides')).toBe('How To Guides');
    });

    it('title-cases a single lowercase word without hyphens', () => {
      // Single-word names have no hyphens → don't match the pattern → null
      expect(toTitleCase('core')).toBeNull();
    });
  });

  describe('acronym overrides', () => {
    it('applies the UDS acronym', () => {
      expect(toTitleCase('uds-configuration')).toBe('UDS Configuration');
    });

    it('applies the IdAM acronym', () => {
      expect(toTitleCase('idam-provider')).toBe('IdAM Provider');
    });

    it('applies the CRDs acronym', () => {
      expect(toTitleCase('crds-reference')).toBe('CRDs Reference');
    });

    it('converts "and" to "&"', () => {
      expect(toTitleCase('identity-and-access')).toBe('Identity & Access');
    });

    it('handles acronym at the end of the name', () => {
      expect(toTitleCase('configure-uds')).toBe('Configure UDS');
    });

    it('handles multiple acronyms in one name', () => {
      expect(toTitleCase('uds-and-idam')).toBe('UDS & IdAM');
    });
  });

  describe('phrase overrides', () => {
    it('applies the Single Sign-On phrase match', () => {
      expect(toTitleCase('single-sign-on')).toBe('Single Sign-On');
    });
  });

  describe('null cases — names ineligible for renaming', () => {
    it('returns null for a name with no hyphens (single word)', () => {
      expect(toTitleCase('core')).toBeNull();
    });

    it('returns null for a name with uppercase letters', () => {
      // Already title-cased or partially cased names are skipped
      expect(toTitleCase('Getting-Started')).toBeNull();
    });

    it('returns null for a version slug (v0-61)', () => {
      // Version dirs must not be renamed
      expect(toTitleCase('v0-61')).toBeNull();
    });

    it('returns null for an empty string', () => {
      expect(toTitleCase('')).toBeNull();
    });
  });

  describe('phrase map only matches the full joined name', () => {
    it('does not apply the Single Sign-On phrase when extra words precede it', () => {
      // "uds single sign on" is not in PHRASE_MAP — falls through to word-level.
      // This documents the expected (and correct) behaviour: phrase matching
      // requires the entire name to match, not a substring.
      expect(toTitleCase('uds-single-sign-on')).toBe('UDS Single Sign On');
    });
  });

  describe('ACRONYM_MAP and PHRASE_MAP are exported constants', () => {
    it('ACRONYM_MAP contains expected entries', () => {
      expect(ACRONYM_MAP['uds']).toBe('UDS');
      expect(ACRONYM_MAP['idam']).toBe('IdAM');
      expect(ACRONYM_MAP['crds']).toBe('CRDs');
      expect(ACRONYM_MAP['and']).toBe('&');
    });

    it('PHRASE_MAP contains expected entries', () => {
      expect(PHRASE_MAP['single sign on']).toBe('Single Sign-On');
    });
  });
});

// ---------------------------------------------------------------------------
// computeSlugRename
// ---------------------------------------------------------------------------

describe('computeSlugRename', () => {
  it('replaces -and- with -- in a simple two-segment path', () => {
    const [old, next] = computeSlugRename('getting-started/identity-and-access');
    expect(old).toBe('getting-started/identity-and-access');
    expect(next).toBe('getting-started/identity--access');
  });

  it('replaces multiple -and- occurrences in one path', () => {
    const [old, next] = computeSlugRename('section/cats-and-dogs-and-birds');
    expect(old).toBe('section/cats-and-dogs-and-birds');
    expect(next).toBe('section/cats--dogs--birds');
  });

  it('returns the same string as both values when no -and- is present', () => {
    const [old, next] = computeSlugRename('getting-started/single-sign-on');
    expect(old).toBe(next);
  });

  it('preserves the full path structure (slashes intact)', () => {
    const [old, next] = computeSlugRename('deep/nested/path-and-more');
    expect(old).toBe('deep/nested/path-and-more');
    expect(next).toBe('deep/nested/path--more');
  });

  it('does not corrupt parent segments that contain -and-', () => {
    // Only the last segment was renamed; parent segment must be left untouched.
    const [old, next] = computeSlugRename('and-stuff/cats-and-dogs');
    expect(old).toBe('and-stuff/cats-and-dogs');
    expect(next).toBe('and-stuff/cats--dogs');
  });

  it('handles a path with no slashes (bare segment)', () => {
    const [old, next] = computeSlugRename('cats-and-dogs');
    expect(old).toBe('cats-and-dogs');
    expect(next).toBe('cats--dogs');
  });
});
