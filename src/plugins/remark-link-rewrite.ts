// Remark plugin that rewrites root-relative internal links to include
// the product prefix (e.g. /core/), channel (e.g. /core/main/), or version
// slug (e.g. /core/v0-61/).
//
// Works on both copied files (production build) and symlinks (dev mode)
// because it derives context from file.path at render time.

import { visit } from 'unist-util-visit';
import path from 'node:path';
import { VERSION_SLUG_PATTERN } from '../productUtils';
import type { Root } from 'mdast';
import type { VFile } from 'vfile';

interface ProductConfig {
  contentDir: string;
  channel?: string;
  sections: string[];
  versionedSections?: Record<string, string[]>;
  latestPrefix: string;
}

interface Options {
  products: ProductConfig[];
  srcDir: string;
}

/**
 * @param options.products - Per-product section lists and optional version overrides
 * @param options.srcDir - Absolute path to src/content/docs/
 */
export function remarkLinkRewrite(options: Options) {
  const { products, srcDir } = options;

  // Pre-build Sets for all section lookups so we don't re-create them per file.
  const sectionsByProduct = new Map(
    products.map(p => [p.contentDir, {
      channel: p.channel,
      sections: new Set(p.sections),
      versionedSections: Object.fromEntries(
        Object.entries(p.versionedSections ?? {}).map(([k, v]) => [k, new Set(v)])
      ) as Record<string, Set<string>>,
    }])
  );

  /** Check if a URL starts with a known section and return the section name, or null. */
  function matchSection(url: string, sections: Set<string>): string | null {
    for (const section of sections) {
      if (url.startsWith(`/${section}/`)) return section;
    }
    return null;
  }

  /** Prepend prefix to a URL if it starts with a known section. */
  function rewriteUrl(url: string, prefix: string, sections: Set<string>): string {
    if (matchSection(url, sections)) return `${prefix}${url}`;
    return url;
  }

  /** Rewrite a link to another configured product's current release. */
  function rewriteCrossProductUrl(url: string, currentContentDir: string, currentPrefix: string): string {
    for (const product of products) {
      const productPrefix = `/${product.contentDir}`;
      if (url !== productPrefix && !url.startsWith(`${productPrefix}/`)) continue;

      const remainder = url.slice(productPrefix.length) || '/';
      const firstSegment = remainder.split('/')[1] ?? '';
      if (
        firstSegment === product.channel ||
        VERSION_SLUG_PATTERN.test(firstSegment) ||
        (firstSegment && !product.sections.includes(firstSegment))
      ) {
        return url;
      }

      const targetPrefix = product.contentDir === currentContentDir
        ? currentPrefix
        : product.latestPrefix;
      return `${targetPrefix}${normalizeDirectorySlugs(remainder)}`;
    }
    return url;
  }

  function normalizeDirectorySlugs(url: string): string {
    const [pathPart, suffix = ''] = url.split(/([?#].*)/, 2);
    const segments = pathPart.split('/');
    if (segments.length < 3) return url;
    return `${segments.slice(0, -1).map(segment => segment.replaceAll('-and-', '--')).join('/')}/${segments.at(-1)}${suffix}`;
  }

  function rewriteInternalUrl(
    url: string,
    prefix: string,
    sections: Set<string>,
    currentContentDir: string,
  ): string {
    return rewriteCrossProductUrl(rewriteUrl(url, prefix, sections), currentContentDir, prefix);
  }

  return (tree: Root, file: VFile) => {
    if (!file.path) return;

    const relPath = path.relative(srcDir, file.path);
    if (relPath.startsWith('..')) return;

    const segments = relPath.split(path.sep);
    const contentDir = segments[0];

    const productData = sectionsByProduct.get(contentDir);
    if (!productData) return;

    const channel = productData.channel && segments[1] === productData.channel;
    const versionSlug = VERSION_SLUG_PATTERN.test(segments[1] ?? '') ? segments[1] : null;

    // Use version-specific sections if available, otherwise fall back to current.
    const sections = channel
      ? productData.sections
      : versionSlug
      ? productData.versionedSections[versionSlug] ?? productData.sections
      : productData.sections;

    const prefix = channel
      ? `/${contentDir}/${productData.channel}`
      : versionSlug
      ? `/${contentDir}/${versionSlug}`
      : `/${contentDir}`;

    // Rewrite markdown links: [text](/section/...) → [text](/core/section/...)
    visit(tree, 'link', (node) => {
      node.url = rewriteInternalUrl(node.url, prefix, sections, contentDir);
    });

    // Rewrite raw HTML href attributes in .md files
    visit(tree, 'html', (node) => {
      for (const section of sections) {
        node.value = node.value.replaceAll(
          `href="/${section}/`,
          `href="${prefix}/${section}/`
        );
      }
      node.value = node.value.replace(/href="([^\"]+)"/g, (match, url: string) => {
        const rewritten = rewriteCrossProductUrl(url, contentDir, prefix);
        return rewritten === url ? match : `href="${rewritten}"`;
      });
    });

    // Rewrite href attributes in MDX JSX elements (e.g. <LinkCard href="/section/..." />)
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
      if (!node.attributes) return;
      for (const attr of node.attributes) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === 'href' && typeof attr.value === 'string') {
          attr.value = rewriteInternalUrl(attr.value, prefix, sections, contentDir);
        }
      }
    });
  };
}
