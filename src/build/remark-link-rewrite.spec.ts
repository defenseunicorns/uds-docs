import { describe, expect, it } from 'vitest';
import type { Html, Link, Root } from 'mdast';
import type { VFile } from 'vfile';
import { remarkLinkRewrite } from '../plugins/remark-link-rewrite';

const products = [
  { contentDir: 'cli', channel: 'develop', sections: ['getting-started'], latestPrefix: '/cli/v9-8' },
  { contentDir: 'core', channel: 'develop', sections: ['concepts'], latestPrefix: '/core/v2-3' },
];

function transform(tree: Root): Root {
  const rewrite = remarkLinkRewrite({ products, srcDir: '/content/docs' });
  rewrite(tree, { path: '/content/docs/cli/develop/index.mdx' } as VFile);
  return tree;
}

function link(url: string): Link {
  return { type: 'link', title: null, url, children: [] };
}

describe('remarkLinkRewrite', () => {
  it('rewrites cross-product links to the configured product latest release', () => {
    const tree = transform({
      type: 'root',
      children: [
        link('/core/concepts/overview/'),
        link('/core/concepts/configuration-and-packaging/bundles/'),
        link('/core/'),
        link('/core/develop/concepts/overview/'),
        link('/core/v1-7/concepts/overview/'),
        link('/core/unknown/'),
        link('/cli/getting-started/installation/'),
        link('/getting-started/installation/'),
      ],
    });

    const urls = tree.children.map(child => (child as Link).url);
    expect(urls).toEqual([
      '/core/v2-3/concepts/overview/',
      '/core/v2-3/concepts/configuration--packaging/bundles/',
      '/core/v2-3/',
      '/core/develop/concepts/overview/',
      '/core/v1-7/concepts/overview/',
      '/core/unknown/',
      '/cli/develop/getting-started/installation/',
      '/cli/develop/getting-started/installation/',
    ]);
  });

  it('rewrites cross-product links in raw HTML attributes', () => {
    const tree = transform({
      type: 'root',
      children: [
        { type: 'html', value: '<a href="/core/concepts/overview/">Core</a>' } as Html,
      ],
    });

    expect((tree.children[0] as Html).value).toBe(
      '<a href="/core/v2-3/concepts/overview/">Core</a>',
    );
  });
});
