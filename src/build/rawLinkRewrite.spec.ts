import { expect, it } from 'vitest';
import { parseFrontmatter } from '@astrojs/markdown-remark';
import { createRawLinkRewriter } from './rawLinkRewrite';

const options = {
  srcDir: '/docs',
  products: [{ contentDir: 'core', sections: ['concepts'], latestPrefix: '/core/v1-16' }],
};

it.each(['', '\n', '\uFEFF'])('retains frontmatter with prefix %j while rewriting links', async (prefix) => {
  const rewrite = createRawLinkRewriter(options);
  const source = '---\ntitle: Guide\n---\n\n[Guide](/concepts/guide/#intro)\n\n[guide]: /concepts/guide/\n\n`[Example](/concepts/example/)`';
  const result = await rewrite(prefix + source, '/docs/core/v1-16/index.md');
  expect(result.startsWith(prefix + '---\ntitle: Guide\n---')).toBe(true);
  expect(parseFrontmatter(result).frontmatter.title).toBe('Guide');
  expect(result).toContain('[Guide](/core/v1-16/concepts/guide/#intro)');
  expect(result).toContain('[guide]: /core/v1-16/concepts/guide/');
  expect(result).toContain('`[Example](/concepts/example/)`');
  expect(await rewrite(result, '/docs/core/v1-16/index.md')).toBe(result);
});

it('rewrites nested MDX links without rendering LikeC4 or changing fenced examples', async () => {
  const rewrite = createRawLinkRewriter(options);
  const source = `import LikeC4View from '@components/LikeC4View.astro';

<CardGrid><Card title="Setup">
    [Guide](/concepts/guide/)
    <LinkCard href="/concepts/guide/" />
</Card></CardGrid>
<LikeC4View viewId="index" />

\`\`\`mdx
<LinkCard href="/concepts/example/" />
\`\`\`
`;
  const result = await rewrite(source, '/docs/core/v1-16/index.mdx');
  expect(result).toContain('[Guide](/core/v1-16/concepts/guide/)');
  expect(result).toContain('<LinkCard href="/core/v1-16/concepts/guide/" />');
  expect(result).toContain('<LikeC4View viewId="index" />');
  expect(result).toContain('```mdx\n<LinkCard href="/concepts/example/" />\n```');
});
