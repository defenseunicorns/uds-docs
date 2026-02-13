---
title: Disaster recovery for edge sites
sidebar:
  order: 5
---

## **Purpose**: Introduce related products that extend or integrate with UDS Core.

**No overview page** - goes directly to product sections.

**Per-Product Content Template:**
```markdown
# [Product Name]

## What It Is
[1-2 paragraph description]

## When to Use It
- Use case 1
- Use case 2
- Use case 3

## Key Features
- Feature A
- Feature B
- Feature C

## Relationship to UDS Core
[How it integrates with or extends Core]

## Getting Started
→ [Link to separate product doc site, if it exists]
→ Or: Quick start guide here if no separate site

## Integration with UDS Core
[How-to style content on using Product WITH Core]
- Configuring bundles to use Product
- Authentication with Product
- Common integration patterns
```

**Anti-Duplication Rules:**

✅ **Do This:**
- UDS Core docs explain concepts (bundles, packages, operators)
- Product pages in Ecosystem section reference Core concepts, don't re-explain
- Product pages focus on product-specific features and integration
- Link back to Core docs: "For more on UDS Bundles, see [Core: Concepts > Bundles]"

❌ **Don't Do This:**
- Re-explain what a bundle is in product pages
- Copy-paste networking setup from Core to product pages
- Create separate "how to deploy" guides that duplicate Core content

**When to Create Separate Doc Site:**
If a product needs more than 10 pages of unique (non-Core) content, create a separate doc site:
- Use same Astro Starlight template for consistency
- Keep integration overview in UDS Core Ecosystem Products section
- Full product docs on separate site
- Link back to Core for shared concepts

**Future Product Onboarding Checklist:**
When adding a new product to Ecosystem Products:
- [ ] Create product section in `/ecosystem-products/[product]/`
- [ ] Write "What It Is" and "When to Use It" sections
- [ ] Create integration guide (how product works WITH UDS Core)
- [ ] Identify shared concepts → link to Core docs, don't duplicate
- [ ] If product needs >10 pages → create separate doc site
- [ ] Ensure separate doc site links back to Core for shared concepts

**Note**: Registry and Tactical Edge are shown as examples but will NOT be included in the initial restructure. They may be added later when technical documentation exists for them.
