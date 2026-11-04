import { createMarkdownProcessor, parseFrontmatter, unified, type RemarkPlugins } from '@astrojs/markdown-remark';
import { toMarkdown, type Options } from 'mdast-util-to-markdown';
import { pathToFileURL } from 'node:url';
import type { Root } from 'mdast';
import { remarkLinkRewrite, type LinkRewriteOptions } from '../plugins/remark-link-rewrite';

/** Apply the site's link rules to raw Markdown/MDX without rendering components. */
export function createRawLinkRewriter(options: LinkRewriteOptions) {
  return async (source: string, filePath: string): Promise<string> => {
    const { content } = parseFrontmatter(source, { frontmatter: 'empty-with-spaces' });
    // Astro masks the header in place; the last changed character marks its end.
    let headerEnd = source.length;
    while (headerEnd > 0 && source[headerEnd - 1] === content[headerEnd - 1]) headerEnd--;
    let rewritten = '';
    const remarkPlugins: RemarkPlugins = [
      [remarkLinkRewrite, options],
      function serialize(this: { data(key: string): Options['extensions'] }) {
        const extensions = this.data('toMarkdownExtensions');
        return (tree: Root) => {
          rewritten = toMarkdown(tree, { extensions });
        };
      },
    ];
    if (filePath.endsWith('.mdx')) {
      const mdx = await unified({ remarkPlugins, smartypants: false }).createMdxRenderer!(
        { syntaxHighlight: false }, { optimize: false },
      );
      await mdx.process(content, filePath, {});
    } else {
      const markdown = await createMarkdownProcessor({ syntaxHighlight: false, smartypants: false, remarkPlugins });
      await markdown.render(content, { fileURL: pathToFileURL(filePath) });
    }
    // Keep frontmatter unchanged; only the document body is serialized.
    return source.slice(0, headerEnd) + '\n\n' + rewritten;
  };
}
