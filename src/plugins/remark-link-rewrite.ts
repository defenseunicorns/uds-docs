// Remark plugin that rewrites root-relative internal links to include
// the product prefix (e.g. /core/) and version slug (e.g. /core/v0-61/).
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
  sections: string[];
  versionedSections?: Record<string, string[]>;
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

  return (tree: Root, file: VFile) => {
    if (!file.path) return;

    const relPath = path.relative(srcDir, file.path);
    if (relPath.startsWith('..')) return;

    const segments = relPath.split(path.sep);
    const contentDir = segments[0];

    const productData = sectionsByProduct.get(contentDir);
    if (!productData) return;

    const versionSlug = VERSION_SLUG_PATTERN.test(segments[1] ?? '') ? segments[1] : null;

    // Use version-specific sections if available, otherwise fall back to current.
    const sections = versionSlug
      ? productData.versionedSections[versionSlug] ?? productData.sections
      : productData.sections;

    const prefix = versionSlug
      ? `/${contentDir}/${versionSlug}`
      : `/${contentDir}`;

    // Rewrite markdown links: [text](/section/...) → [text](/core/section/...)
    visit(tree, 'link', (node) => {
      node.url = rewriteUrl(node.url, prefix, sections);
    });

    // Rewrite raw HTML href attributes in .md files
    visit(tree, 'html', (node) => {
      for (const section of sections) {
        node.value = node.value.replaceAll(
          `href="/${section}/`,
          `href="${prefix}/${section}/`
        );
      }
    });

    // Rewrite href attributes in MDX JSX elements (e.g. <LinkCard href="/section/..." />)
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node: any) => {
      if (!node.attributes) return;
      for (const attr of node.attributes) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === 'href' && typeof attr.value === 'string') {
          attr.value = rewriteUrl(attr.value, prefix, sections);
        }
      }
    });
  };
}
