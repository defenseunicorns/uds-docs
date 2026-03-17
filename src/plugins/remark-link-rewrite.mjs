// src/plugins/remark-link-rewrite.mjs
//
// Remark plugin that rewrites root-relative internal links to include
// the product prefix (e.g. /core/) and version slug (e.g. /core/v0-61/).
//
// Works on both copied files (production build) and symlinks (dev mode)
// because it derives context from file.path at render time.

import { visit } from 'unist-util-visit';
import path from 'node:path';

/**
 * @param {Object} options
 * @param {Array<{contentDir: string, sections: string[], versionedSections: Record<string, string[]>}>} options.products
 * @param {string} options.srcDir - Absolute path to src/content/docs/
 */
export function remarkLinkRewrite(options) {
  const { products, srcDir } = options;

  // Build a lookup of section prefixes per product (and per version when available).
  const sectionsByProduct = new Map(
    products.map(p => [p.contentDir, { sections: new Set(p.sections), versionedSections: p.versionedSections ?? {} }])
  );

  /** Check if a URL starts with a known section and return the section name, or null. */
  function matchSection(url, sections) {
    for (const section of sections) {
      if (url.startsWith(`/${section}/`)) return section;
    }
    return null;
  }

  /** Prepend prefix to a URL if it starts with a known section. */
  function rewriteUrl(url, prefix, sections) {
    if (matchSection(url, sections)) return `${prefix}${url}`;
    return url;
  }

  return (tree, file) => {
    if (!file.path) return;

    const relPath = path.relative(srcDir, file.path);
    if (relPath.startsWith('..')) return;

    const segments = relPath.split(path.sep);
    const contentDir = segments[0];

    const productData = sectionsByProduct.get(contentDir);
    if (!productData) return;

    // Same pattern as VERSION_SLUG_PATTERN in src/productUtils.ts
    const versionMatch = segments[1]?.match(/^v\d+-\d+$/);
    const versionSlug = versionMatch ? segments[1] : null;

    // Use version-specific sections if available, otherwise fall back to current.
    const sectionsArr = versionSlug && productData.versionedSections[versionSlug]
      ? productData.versionedSections[versionSlug]
      : [...productData.sections];
    const sections = new Set(sectionsArr);

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
    visit(tree, ['mdxJsxFlowElement', 'mdxJsxTextElement'], (node) => {
      if (!node.attributes) return;
      for (const attr of node.attributes) {
        if (attr.type === 'mdxJsxAttribute' && attr.name === 'href' && typeof attr.value === 'string') {
          attr.value = rewriteUrl(attr.value, prefix, sections);
        }
      }
    });
  };
}
