import { describe, expect, it } from 'vitest';
import { latestReleaseHref } from '../routeData';

const product = {
  contentDir: 'core',
  link: '/core/',
  latestSource: 'main',
};

describe('latestReleaseHref', () => {
  it('keeps the current page path when it exists in the latest release', () => {
    const latestFile = 'src/content/docs/core/v1-10/concepts/core-features/networking.mdx';

    expect(
      latestReleaseHref(
        product,
        'v1-10',
        'v1-8',
        'core/v1-8/concepts/core-features/networking',
        path => path === latestFile,
      ),
    ).toBe('/core/concepts/core-features/networking/');
  });

  it('falls back to the product root when the latest page is missing', () => {
    expect(
      latestReleaseHref(
        product,
        'v1-10',
        'v1-8',
        'core/v1-8/concepts/core-features/removed-page',
        () => false,
      ),
    ).toBe('/core/');
  });

  it('checks the product root for products without a main channel', () => {
    const cliProduct = {
      contentDir: 'cli',
      link: '/cli/',
      latestSource: undefined,
    };
    const latestFile = 'src/content/docs/cli/commands/apply.mdx';

    expect(
      latestReleaseHref(
        cliProduct,
        'v9-8',
        'v9-7',
        'cli/v9-7/commands/apply',
        path => path === latestFile,
      ),
    ).toBe('/cli/commands/apply/');
  });

  it('resolves latest files from the normalized route path', () => {
    const latestFile = 'src/content/docs/core/v1-10/concepts/core-features/networking.mdx';

    expect(
      latestReleaseHref(
        product,
        'v1-10',
        'main',
        'core/main/concepts/core-features/networking',
        path => path === latestFile,
      ),
    ).toBe('/core/concepts/core-features/networking/');
  });
});
