# UDS Core Documentation Restructure Plan

This plan provides a comprehensive, step-by-step approach to migrating all content from `src/content/docs-old` to the new Information Architecture (IA), focusing solely on content movement and template application without any docsite infrastructure changes.

## Scope and Focus

**Primary Focus:** Content migration and template application only
- Move existing content from `docs-old` to new IA structure
- Apply consistent templates for unified user experience
- Rewrite content to match new section purposes
- **Out of Scope:** Docsite infrastructure, navigation configuration, redirects, search functionality

**Key Reference Documents:**
This plan relies heavily on three reference documents for detailed guidance:

1. **`docs-ia-overview.md`** - Complete IA structure and section definitions
   - Target 6-section structure: Overview, Getting Started, Concepts, How-To Guides, Reference, Operations & Maintenance
   - Detailed section purposes and content types
   - Navigation features and user experience patterns
   - **Where to find details:** Section breakdowns starting at line 70, detailed section descriptions starting at line 193

2. **`docs-movement.md`** - Source-to-destination mapping for all content
   - Complete mapping of every `docs-old` file to its new location
   - Action types: keep, split, rework, delete
   - Specific destination paths and transformation requirements
   - **Where to find details:** Section-by-section mappings starting at line 15, complete file-by-file breakdown

3. **`docs-ia-templates.md`** - Template definitions and examples
   - 4 core templates: How-To Guide, Troubleshooting Runbook, Version-Specific Upgrade Guide, CRD Reference
   - Complete template structures with required sections
   - Writing guidelines and examples for each template type
   - **Where to find details:** Template definitions starting at line 9, complete template examples throughout

## Current State Analysis

**Existing Structure:**
- `src/content/docs-old/` contains 130 files across 10 directories
- `src/content/docs/` contains 94 files across 9 directories (new IA partially implemented)
- Key old content areas: Overview, Getting Started, Tutorials, Reference (CLI, Configuration, UDS Core, bundles, deployment, troubleshooting), Security, Structure

**New IA Target:**
- 6 top-level sections: Overview, Getting Started, Concepts, How-To Guides, Reference, Operations & Maintenance
- Multi-product tabs (UDS Core, Registry, Fleet)
- Consistent templates for all content types

## Phase 1: Content Audit and Mapping Validation

### 1.1 Complete Content Inventory
Create a comprehensive mapping table of every file in `docs-old` with its destination and transformation requirements:

| Source File | Destination | Action Type | Template Required | Dependencies |
|-------------|-------------|------------|------------------|--------------|
| `overview/why-uds.md` | `overview/uds-ecosystem.md` | rework | Overview page | Combine with uds-mission-relevance |
| `overview/uds-mission-relevance.md` | `overview/uds-ecosystem.md` | merge | Overview page | Combine with why-uds |
| `overview/uds-structure.md` | Multiple destinations | split | Multiple templates | Platform concepts + Core capabilities |
| `overview/prerequisites.md` | Multiple destinations | split | Getting Started + Ops | Local vs Production prereqs |
| `getting-started/basic-requirements.mdx` | `getting-started/local-demo/basic-requirements.mdx` | keep | Getting Started | Minor updates for new flow |
| `getting-started/install-and-deploy-uds.md` | Multiple destinations | split | Getting Started templates | Local vs Production paths |
| `tutorials/create-uds-package.md` | `getting-started/local-demo/integrate-your-package.md` | rework | Getting Started | Combine with add-package-to-bundle |
| `tutorials/add-package-to-bundle.md` | `getting-started/local-demo/integrate-your-package.md` | merge | Getting Started | Combine with create-package |
| `structure/bundles.md` | Multiple destinations | split | Concepts + Reference | Configuration concepts |
| `structure/packages.md` | Multiple destinations | split | Concepts + Reference | Package CRD reference |
| `reference/CLI/overview.md` | `reference/cli.md` | keep | Reference template | CLI consolidation |
| `reference/CLI/quickstart-and-usage.md` | Multiple destinations | split | Reference + How-To | Usage examples to How-To |
| `reference/UDS Core/functional-layers.md` | `concepts/platform/flavors.md` | rework | Concepts template | Flavors concept |
| `reference/UDS Core/distribution-support.md` | `reference/uds-core.md` or delete | rework | Reference template | May be outdated |
| `reference/configuration/*` | Multiple destinations | split/rework | How-To + Reference | Feature-specific guides |
| `reference/troubleshooting/*` | `operations/troubleshooting/` | rework | Troubleshooting template | Runbook format |
| `security/overview.md` | `overview/security.md` | keep | Overview template | Security posture |

### 1.2 Validate Movement Plan Accuracy
Review each mapping in `docs-movement.md` against actual content to ensure:
- Content type matches destination section purpose
- No important content is marked for deletion inappropriately
- Split operations have clear separation logic
- Template assignments are correct

## Phase 2: Content Migration by Section

### 2.1 Content Migration Strategy and Approach

**Migration Philosophy:** This is the core work of the restructure - moving existing content from `docs-old` to the new IA while maximizing reuse and minimizing new content creation. The approach is:

1. **Content First, Structure Second** - Focus on getting the content moved correctly, then apply templates for consistency
2. **Preserve Value** - Keep valuable existing content intact, just reorganize and reformat it
3. **Split Thoughtfully** - When splitting content, ensure each piece has a clear purpose and audience
4. **Merge Strategically** - Only merge content that truly belongs together for user experience
5. **Delete Judiciously** - Only delete content that is truly outdated or superseded

**Migration Process for Each File:**
1. **Read and Understand** - Analyze the source content's purpose, audience, and key information
2. **Determine Destination** - Based on the mapping in `docs-movement.md` and new IA structure
3. **Plan Transformation** - Decide if content needs to be kept as-is, split, merged, or reworked
4. **Execute Migration** - Move content to new location with appropriate changes
5. **Update References** - Fix any internal links that reference the old location
6. **Validate Completeness** - Ensure no important information was lost in the move

**Content Transformation Examples:**

**Example 1: Simple Keep**
- Source: `getting-started/basic-requirements.mdx`
- Destination: `getting-started/local-demo/basic-requirements.mdx`
- Action: Keep content mostly intact, minor updates for new flow
- Changes: Update references, ensure OS instructions are current

**Example 2: Strategic Split**
- Source: `getting-started/install-and-deploy-uds.md`
- Destinations: 
  - `getting-started/local-demo/install-and-deploy-uds.md` (k3d demo flow)
  - Content for `getting-started/production/*` pages (production concepts)
- Action: Split content based on user path (demo vs production)
- Changes: Rewrite each piece for its specific audience and use case

**Example 3: Smart Merge**
- Sources: `tutorials/create-uds-package.md` + `tutorials/add-package-to-bundle.md`
- Destination: `getting-started/local-demo/integrate-your-package.md`
- Action: Merge related tutorials into single cohesive flow
- Changes: Create unified narrative: create → add → deploy → access

**Example 4: Complex Split**
- Source: `overview/uds-structure.md`
- Destinations: Multiple concept and overview pages
- Action: Split comprehensive content by topic and purpose
- Changes: 
  - Platform model → `concepts/platform/overview.md`
  - Architecture/layers → `concepts/platform/environments-and-clusters.md`
  - Core capabilities table → distribute across relevant concept pages
  - UDS Core specifics → `overview/uds-core.md`

### 2.2 Overview Section Migration

**Priority: High** (Foundation for all other sections)

**Source Files:**
- `overview/why-uds.md` → `overview/uds-ecosystem.md`
- `overview/uds-mission-relevance.md` → merge into `overview/uds-ecosystem.md`
- `overview/uds-structure.md` → split across multiple pages
- `security/overview.md` → `overview/security.md`

**Detailed Migration Plan:**

1. **Create `overview/uds-ecosystem.md`**
   - Combine content from `why-uds.md` and `uds-mission-relevance.md`
   - Focus on ecosystem-level value proposition
   - Link to UDS Core specifics and other products

2. **Update `overview/uds-core.md`**
   - Extract Core-specific content from `uds-structure.md`
   - Focus on Core platform capabilities
   - Link to Concepts for deep dives

3. **Create `overview/security.md`**
   - Migrate `security/overview.md`
   - High-level security posture
   - Link to security concepts and how-tos

4. **Support Platform Concepts from `uds-structure.md`**
   - Platform model → `concepts/platform/overview.md`
   - Architecture/layers → `concepts/platform/environments-and-clusters.md`
   - Core capabilities table → distribute across relevant concept pages

### 2.3 Getting Started Section Migration

**Priority: High** (Critical user onboarding path)

**Migration Focus:** Transform mixed getting-started content into clear, path-based tutorials (Local Demo vs Production). Getting Started should be completion-oriented with clear steps and verification.

**Source Files:**
- `getting-started/basic-requirements.mdx` → `getting-started/local-demo/basic-requirements.mdx`
- `getting-started/install-and-deploy-uds.md` → split across local/production
- `tutorials/create-uds-package.md` + `tutorials/add-package-to-bundle.md` → merge
- `overview/prerequisites.md` → split across local/production

**Detailed Migration Plan:**

1. **Update `getting-started/local-demo/basic-requirements.mdx`**
   - **Migration Type:** Keep with minor updates
   - **Content Changes:** Update for new flow, ensure OS-specific instructions are current
   - **Add:** Verification commands to confirm tools work
   - **Remove:** Any production-specific prerequisites

2. **Split `install-and-deploy-uds.md`**
   - **Migration Type:** Strategic split by user path
   - **Local Demo Path:** `getting-started/local-demo/install-and-deploy-uds.md`
     - Keep k3d-specific instructions
     - Focus on quick, local deployment
     - Add expected output and timing
   - **Production Content:** Extract concepts for `getting-started/production/*` pages
     - Bundle building concepts
     - Production deployment considerations
     - Infrastructure requirements

3. **Create `getting-started/local-demo/integrate-your-package.md`**
   - **Migration Type:** Smart merge
   - **Sources:** `create-uds-package.md` + `add-package-to-bundle.md`
   - **Unified Flow:** Create simple package → Add to demo bundle → Deploy → Access via ingress
   - **Content Strategy:** Single tutorial that shows the complete package authoring loop

4. **Update Production Prerequisites**
   - **Migration Type:** Split from `overview/prerequisites.md`
   - **Destination:** `getting-started/production/prerequisites.md`
   - **Content Focus:** Production-specific requirements (K8s versions, networking, RBAC, capacity planning)

### 2.4 Concepts Section Migration

**Priority: Medium** (Supports understanding, less time-sensitive)

**Migration Focus:** Extract conceptual content from various sources and organize by topic. Concepts should explain "what" and "why," not "how to."

**Source Files:**
- `overview/uds-structure.md` (platform content)
- `structure/bundles.md` → split
- `structure/packages.md` → split
- `reference/UDS Core/functional-layers.md` → `concepts/platform/flavors.md`
- `reference/configuration/*` (conceptual content)
- `reference/UDS Core/*` (conceptual content)

**Detailed Migration Plan:**

1. **Platform Concepts (from `uds-structure.md`)**
   - **Migration Type:** Complex split by topic
   - `concepts/platform/overview.md` - Platform model, layers, and architecture
   - `concepts/platform/environments-and-clusters.md` - Multi-cluster concepts
   - `concepts/platform/platform-vs-app-layer.md` - Responsibility boundaries
   - `concepts/platform/flavors.md` - Core variants (from functional-layers.md)

2. **Configuration & Packaging Concepts**
   - **Migration Type:** Split and rework
   - **Sources:** `structure/bundles.md` + `structure/packages.md`
   - `concepts/configuration-and-packaging/overview.md` - How UDS packaging works
   - `concepts/configuration-and-packaging/bundles.md` - Bundle concepts and composition
   - `concepts/configuration-and-packaging/core-crds.md` - CRD concepts and purpose

3. **Core Features Concepts**
   - **Migration Type:** Extract from reference docs
   - **Sources:** `reference/configuration/*` conceptual content
   - **Strategy:** Create concept pages for each feature area
   - **Content Focus:** What each feature is, why it matters, how it fits with other features

4. **UDS Core Concepts**
   - **Migration Type:** Extract and consolidate
   - **Sources:** `reference/UDS Core/overview.mdx` and related files
   - **Destination:** `concepts/uds-core/overview.md`
   - **Content Focus:** Platform overview and capabilities

### 2.5 How-To Guides Section Migration

**Priority: Medium** (Task completion, but existing content works)

**Migration Focus:** Transform reference documentation into task-oriented guides. How-To should be single-goal, step-by-step with verification.

**Source Files:**
- `reference/configuration/*` (task-oriented content)
- `tutorials/deploy-with-ambient.md` → rework for networking
- `reference/CLI/quickstart-and-usage.md` (usage examples)
- `reference/deployment/upgrades.md` (upgrade procedures)

**Detailed Migration Plan:**

1. **Feature-Specific How-To Guides**
   - **Migration Type:** Extract and rework
   - **Sources:** `reference/configuration/*` task content
   - **Organization:** By feature area (networking, identity, logging, etc.)
   - **Content Strategy:** Transform reference explanations into step-by-step tasks
   - **Examples:** "Configure ingress" instead of "Ingress configuration reference"

2. **CLI Usage How-Tos**
   - **Migration Type:** Extract and organize
   - **Sources:** `reference/CLI/quickstart-and-usage.md`
   - **Content Strategy:** Create task-oriented guides for common CLI patterns
   - **Focus:** Usage examples, not command reference

3. **Upgrade and Configuration How-Tos**
   - **Migration Type:** Split and categorize
   - **Sources:** `reference/deployment/*`
   - **Configuration Changes:** How-to guides for common config changes
   - **Version-Specific:** Move to Operations section for detailed upgrade guides

### 2.6 Reference Section Migration

**Priority: Low** (Supports experienced users, less urgent)

**Migration Focus:** Consolidate and organize reference material. Reference should be exact configuration details without how-to content.

**Source Files:**
- `reference/CLI/*` (consolidated)
- `reference/UDS Core/*` (reference content)
- `reference/bundles/*` (if kept)
- `structure/packages.md` (CRD schema)
- `reference/UDS Operator/*` and `reference/Custom Resources/*`

**Detailed Migration Plan:**

1. **Consolidate CLI Reference**
   - **Migration Type:** Consolidate multiple files
   - **Sources:** All `reference/CLI/*` content
   - **Destination:** `reference/cli.md`
   - **Content Strategy:** Focus on stable behavior, schema validation, command overview
   - **Remove:** Tutorial-style content (move to How-To)

2. **CRD Reference Pages**
   - **Migration Type:** Create from multiple sources
   - **Sources:** `structure/packages.md`, `reference/UDS Operator/*`, `reference/Custom Resources/*`
   - **Destinations:** Individual CRD reference pages
   - **Content Strategy:** Complete schema, field documentation, examples, validation rules

3. **UDS Core Reference**
   - **Migration Type:** Extract and consolidate
   - **Sources:** `reference/UDS Core/*`
   - **Content Strategy:** Configuration surfaces, supported distributions, versions
   - **Remove:** Conceptual explanations (move to Concepts)

4. **Feature Reference**
   - **Migration Type:** Extract from configuration docs
   - **Sources:** `reference/configuration/*` reference content
   - **Destinations:** Feature-specific reference pages
   - **Content Strategy:** Configuration matrices, options, defaults

### 2.7 Operations & Maintenance Section Migration

**Priority: Medium** (Supports production operations)

**Migration Focus:** Transform troubleshooting and deployment content into operations-focused runbooks and guides.

**Source Files:**
- `reference/troubleshooting/*`
- `reference/deployment/upgrades.md`
- `reference/deployment/pod-reload.md`

**Detailed Migration Plan:**

1. **Troubleshooting Runbooks**
   - **Migration Type:** Rework into runbook format
   - **Sources:** `reference/troubleshooting/*`
   - **Content Strategy:** Symptom-based organization with diagnostic steps
   - **Format:** Symptoms → Causes → Diagnostics → Solutions → Verification

2. **Upgrade Guides**
   - **Migration Type:** Create version-specific guides
   - **Sources:** `reference/deployment/upgrades.md`
   - **Content Strategy:** Per-version upgrade procedures with rollback plans
   - **Include:** Breaking changes, migration steps, validation

3. **Operations Overview**
   - **Migration Type:** Create new
   - **Destination:** `operations/overview.md`
   - **Content Strategy:** Explain operational concerns and where to find help

## Phase 3: Template Implementation and Content Preparation

### 3.1 Section Overview Files Requirement

**Critical Requirement:** Every section must have an `overview.md` file that serves as the entry point for that section. These overview files must be:

- **Brief and descriptive** - 2-3 paragraphs maximum
- **Section-focused** - Explain what this section covers and its purpose
- **Link-rich** - Include 2-3 key links to important sub-pages within the section
- **Navigation-oriented** - Help users understand where to go next within the section
- **Consistent** - Follow the same format across all sections

**Required Overview Files:**
- `overview/overview.md` - Overview of the entire Overview section
- `getting-started/overview.md` - Overview of Getting Started paths (demo vs production)
- `concepts/overview.md` - Overview of Concepts organization
- `how-to-guides/overview.md` - Overview of task-based organization
- `reference/overview.md` - Overview of reference materials
- `operations/overview.md` - Overview of operational guidance

**Overview File Template:**
```markdown
---
title: [Section Name] Overview
description: Brief description of what this section covers
---

# [Section Name] Overview

[1-2 sentences explaining the purpose and scope of this section]

## What You'll Find Here

[Brief paragraph describing the types of content in this section]

## Key Topics

- [Important topic 1] - [Link to relevant sub-page]
- [Important topic 2] - [Link to relevant sub-page] 
- [Important topic 3] - [Link to relevant sub-page]

## Where to Start

[Guidance on which pages to visit first based on user goals]
```

### 3.2 Create Template ADRs
Implement the 4 templates defined in `docs-ia-templates.md`:

1. **How-To Guide Template ADR** - Task-oriented documentation structure
2. **Troubleshooting Runbook Template ADR** - Symptom-based problem resolution
3. **Version-Specific Upgrade Guide Template ADR** - Per-version upgrade procedures
4. **CRD Reference Page Template ADR** - Custom resource documentation

### 3.3 Template Application Guidelines
Establish rules for applying templates to migrated content:

**Overview Pages:**
- High-level, marketing-adjacent content
- Link out to detailed sections
- Avoid step-by-step instructions
- Target audience: buyers, project managers

**Getting Started Pages:**
- Tutorial-style, completion-oriented
- Clear steps with verification
- Progress indicators
- Target audience: new users, package authors

**Concepts Pages:**
- Explain "what" and "why," not "how to"
- Use diagrams and examples
- Link to How-To and Reference
- Target audience: platform engineers understanding

**How-To Guides:**
- Single goal per page
- Prerequisites, steps, verification, troubleshooting
- Working code examples
- Target audience: platform engineers implementing

**Reference Pages:**
- Exact configuration details
- Tables for configuration matrices
- No how-to content
- Target audience: experienced implementers

**Operations Pages:**
- Day-2 operations focus
- Runbook format for troubleshooting
- Version-specific upgrade guides
- Target audience: operations teams

## Phase 4: Content Quality and Consistency

### 4.1 Template Compliance Review
Review all migrated content for template compliance:
- All How-To guides follow the exact structure
- All troubleshooting runbooks use symptom-based format
- All Reference pages focus on configuration details
- All Overview pages avoid deep technical content

### 4.2 Cross-Reference Validation
Ensure proper linking between sections:
- Concepts link to relevant How-To guides
- How-To guides link to Concepts and Reference
- Reference pages link to How-To examples
- Troubleshooting links to relevant How-To and Reference

### 4.3 Content Deduplication
Identify and eliminate duplication:
- Shared concepts explained once in Concepts, linked elsewhere
- Common procedures centralized in How-To guides
- Reference material not duplicated in other sections

## Phase 5: Content Implementation (Documentation Only)

### 5.1 File Structure Operations (Content Only)

**Focus:** Moving and organizing content files only - no infrastructure changes

**Execute Content Moves:**
- Move files according to mapping table from `docs-movement.md`
- Split content files where required (create new files for split content)
- Delete files marked for deletion in movement plan
- Create new files for merged content

**Content File Creation:**
- Create new files for split content pieces
- Create section overview files as defined in Phase 3
- Ensure all new files follow proper naming conventions

**No Infrastructure Changes:**
- **DO NOT** modify `astro.config.mjs`
- **DO NOT** update navigation configuration
- **DO NOT** create redirects
- **DO NOT** modify sidebar configuration

### 5.2 Content Transformation and Template Application

**Focus:** Rewrite content to match templates and section purposes

**Apply Templates:**
- Rewrite content to match appropriate template structure
- Update frontmatter and metadata for consistency
- Apply section-specific writing guidelines

**Content Standards:**
- Ensure all How-To guides follow the exact structure from templates
- Apply troubleshooting runbook format to operations content
- Use consistent formatting and style across all content
- Add verification steps and troubleshooting where appropriate

**Reference Material:**
- Use `docs-ia-templates.md` for exact template structures
- Apply writing guidelines from template definitions
- Follow examples provided in template documentation

### 5.3 Content Link Updates (Internal Only)

**Focus:** Update internal content references only

**Internal Link Updates:**
- Update internal links to point to new content locations
- Fix references between migrated content
- Ensure cross-references between sections work correctly

**No External Infrastructure:**
- **DO NOT** create redirect mappings
- **DO NOT** test external link functionality
- **DO NOT** modify search functionality
- Focus solely on content-to-content references

### 5.4 Content Quality Validation

**Focus:** Content completeness and template compliance

**Template Compliance:**
- Verify all content follows assigned templates
- Check that all How-To guides have required sections
- Ensure troubleshooting content uses runbook format
- Validate overview files are brief and descriptive

**Content Completeness:**
- Verify no important content was lost during migration
- Check that all source material is accounted for
- Ensure split content maintains logical flow
- Validate merged content creates cohesive narratives

**Cross-Reference Validation:**
- Ensure Concepts link to relevant How-To guides
- Verify How-To guides link to Concepts and Reference
- Check Reference pages link to How-To examples
- Validate Troubleshooting links to relevant content

## Phase 6: Content Quality Review and Refinement

### 6.1 Editorial Review (Typos, Grammar, Syntax)

**Focus:** Technical correctness and language quality

**Review Scope:**
- Review every single migrated document for technical errors
- Check for typos, spelling mistakes, and grammatical errors
- Verify syntax consistency in code blocks and examples
- Ensure proper markdown formatting and structure

**Editorial Standards:**
- Consistent terminology across all documents
- Proper spelling and grammar
- Correct markdown syntax and formatting
- Accurate code examples and command syntax

**Review Process:**
1. **Systematic Review** - Go through each document methodically
2. **Error Documentation** - Track all issues found and fixed
3. **Consistency Check** - Ensure terminology and style consistency
4. **Final Validation** - Verify all corrections are properly implemented

### 6.2 Content Clarity Review

**Focus:** Understandability and communication effectiveness

**Review Criteria:**
- **Clarity of Purpose** - Is the document's purpose immediately clear?
- **Audience Appropriateness** - Is content written for the right audience?
- **Concept Explanation** - Are complex concepts explained clearly?
- **Instruction Clarity** - Are steps and instructions easy to follow?

**Clarity Standards:**
- Simple, direct language appropriate to the audience
- Clear explanations of technical concepts
- Unambiguous instructions and procedures
- Proper context and background information

**Review Process:**
1. **Audience Validation** - Ensure content matches target audience for each section
2. **Concept Clarity** - Verify complex topics are explained understandably
3. **Instruction Review** - Check that procedures are clear and actionable
4. **Context Assessment** - Ensure adequate background information is provided

### 6.3 Document Flow Review

**Focus:** Logical organization and user journey

**Flow Review Criteria:**
- **Section Organization** - Does content flow logically within each section?
- **Cross-Section Navigation** - Are users guided effectively between sections?
- **Progressive Disclosure** - Is information presented in the right order?
- **User Journey** - Does the documentation support natural user workflows?

**Flow Standards:**
- Logical progression from simple to complex concepts
- Clear paths from Overview to Getting Started to Concepts to How-To
- Effective cross-references between related content
- Intuitive organization that matches user mental models

**Review Process:**
1. **Section Flow Analysis** - Review content organization within each section
2. **Cross-Section Mapping** - Validate connections between sections
3. **User Journey Testing** - Follow typical user paths through documentation
4. **Navigation Assessment** - Ensure users can find information efficiently

### 6.4 Quality Assurance Framework

**Review Methodology:**
1. **First Pass - Technical Review** - Focus on typos, grammar, syntax
2. **Second Pass - Clarity Review** - Focus on understandability and communication
3. **Third Pass - Flow Review** - Focus on organization and user experience
4. **Final Pass - Integration Review** - Ensure all elements work together

**Quality Metrics:**
- Zero typos or grammatical errors
- Clear, audience-appropriate language
- Logical content organization
- Effective user navigation paths

**Documentation of Issues:**
- Track all issues found during reviews
- Document corrections made
- Note any content gaps or inconsistencies
- Record decisions on ambiguous content

### 6.5 Review Success Criteria

**Editorial Excellence:**
- [ ] Zero typos, spelling errors, or grammatical mistakes
- [ ] Consistent terminology and style across all documents
- [ ] Proper markdown formatting and syntax
- [ ] Accurate code examples and technical details

**Content Clarity:**
- [ ] All content is appropriate for target audience
- [ ] Complex concepts are explained clearly and simply
- [ ] Instructions are unambiguous and actionable
- [ ] Adequate context provided for all topics

**Document Flow:**
- [ ] Logical progression within each section
- [ ] Effective cross-references between sections
- [ ] Clear user paths from overview to implementation
- [ ] Intuitive organization that supports user workflows

**Overall Quality:**
- [ ] Documentation meets professional standards
- [ ] Content is ready for public release
- [ ] User experience is smooth and intuitive
- [ ] Documentation effectively supports user goals

## Implementation Guidelines

### Content-First Approach
1. **Move Content First** - Get all content in right locations before template application
2. **Apply Templates Second** - Rewrite content to match template structures
3. **Validate Third** - Check completeness and compliance
4. **Review Fourth** - Conduct comprehensive quality reviews

### Reference Document Usage
**For IA Structure:** Refer to `docs-ia-overview.md`
- Section definitions and purposes (lines 193-456)
- Content type guidance for each section
- User experience patterns

**For Content Mapping:** Refer to `docs-movement.md`
- Exact file-by-file mappings (lines 15-217)
- Action types and transformation requirements
- Destination paths and split decisions

**For Template Application:** Refer to `docs-ia-templates.md`
- Complete template structures (lines 9-932)
- Writing guidelines and examples
- Required sections and formatting

### What to Avoid
- **DO NOT** modify any docsite infrastructure files
- **DO NOT** change navigation or sidebar configuration
- **DO NOT** create redirects or modify routing
- **DO NOT** update search functionality
- **DO NOT** modify build or deployment configuration

### Success Criteria

### Content Completeness
- [ ] All content from `docs-old` accounted for in new structure
- [ ] No important content lost during migration
- [ ] All templates applied correctly according to reference docs
- [ ] Cross-references established between sections

### Template Compliance
- [ ] All How-To guides follow exact template structure
- [ ] All troubleshooting content uses runbook format
- [ ] All Reference pages focus on configuration details
- [ ] All Overview pages are brief and descriptive

### Content Quality
- [ ] All code examples tested and working
- [ ] Consistent formatting and style across sections
- [ ] Proper frontmatter and metadata
- [ ] Content matches section purposes defined in IA

### Editorial Excellence
- [ ] Zero typos, spelling errors, or grammatical mistakes
- [ ] Clear, audience-appropriate language throughout
- [ ] Logical content organization and flow
- [ ] Professional-quality documentation ready for release

## Phase 7: Content Migration Tracking and Documentation

### 7.1 Meticulous Content Movement Log

**Purpose:** Create a comprehensive, granular record of every piece of content movement during the migration process. This serves as both a documentation of changes and a reference for future content management.

**Tracking Level:** Paragraph-by-paragraph movement documentation

**Movement Log Structure:**
For each source file, document every content piece and its destination:

```
## Source: docs-old/overview/why-uds.md

### Paragraph 1 (Lines 8-11)
**Original Content:** "UDS creates, supports, and maintains a secure runtime platform that simplifies software delivery and deployment for both application development teams and platform teams..."
**Destination:** docs/overview/uds-ecosystem.md (Paragraph 1)
**Transformation:** Minor rewording for ecosystem focus
**Notes:** Combined with content from uds-mission-relevance.md

### Paragraph 2 (Lines 13-20)
**Original Content:** "With UDS, mission teams can: Deploy a new authorizable software environment swiftly..."
**Destination:** docs/overview/uds-ecosystem.md (Benefits section)
**Transformation:** Converted to bullet points, added ecosystem context
**Notes:** Enhanced with additional benefits from merged content

### Section: Security and Compliance (Lines 21-27)
**Original Content:** "UDS places a strong emphasis on security and compliance..."
**Destination:** docs/overview/security.md (Introduction)
**Transformation:** Expanded with additional security concepts
**Notes:** Enhanced with dedicated security overview content
```

### 7.2 Content Transformation Documentation

**Transformation Categories:**
- **Keep** - Content moved with minimal changes
- **Split** - Content divided into multiple destinations
- **Merge** - Content combined from multiple sources
- **Rework** - Content significantly rewritten for new purpose
- **Delete** - Content removed with justification

**Transformation Log Format:**
```
## Content Transformation Log

### Keep Operations
- docs-old/getting-started/basic-requirements.mdx → docs/getting-started/local-demo/basic-requirements.mdx
  - Changes: Updated OS-specific instructions, added verification commands
  - Rationale: Content already fits new structure perfectly

### Split Operations
- docs-old/getting-started/install-and-deploy-uds.md → Multiple destinations
  - Paragraphs 1-15 → docs/getting-started/local-demo/install-and-deploy-uds.md
  - Paragraphs 16-30 → Concepts for production deployment
  - Rationale: Separate demo vs production user paths

### Merge Operations
- docs-old/tutorials/create-uds-package.md + docs-old/tutorials/add-package-to-bundle.md
  - Destination: docs/getting-started/local-demo/integrate-your-package.md
  - Combined Flow: Create package → Add to bundle → Deploy → Access
  - Rationale: Single cohesive tutorial experience

### Rework Operations
- docs-old/reference/configuration/Service Mesh/* → docs/how-to-guides/networking/*
  - Transformation: Reference → Task-oriented guides
  - Rationale: Better user experience for implementation guidance

### Delete Operations
- docs-old/overview/acronyms-and-terms.md
  - Rationale: Outdated, superseded by inline definitions
  - Justification: Better user experience without separate glossary
```

### 7.3 Content Mapping Matrix

**Matrix Structure:** Comprehensive mapping from source to destination with transformation details

| Source File | Source Paragraph/Section | Destination File | Destination Location | Transformation Type | Notes |
|-------------|-------------------------|------------------|---------------------|-------------------|-------|
| `docs-old/overview/why-uds.md` | Paragraph 1 (lines 8-11) | `docs/overview/uds-ecosystem.md` | Introduction | Merge | Combined with uds-mission-relevance |
| `docs-old/overview/why-uds.md` | Security section (lines 21-27) | `docs/overview/security.md` | Introduction | Keep | Enhanced with additional content |
| `docs-old/overview/uds-structure.md` | Platform model (lines 8-13) | `docs/concepts/platform/overview.md` | Platform Overview | Rework | Expanded for conceptual depth |
| `docs-old/structure/bundles.md` | Entire document | Multiple destinations | Split | Concepts + Reference | Divided by content type |

### 7.4 Content Loss and Gain Documentation

**Content Loss Tracking:**
- Document any content that was intentionally removed
- Provide justification for each removal decision
- Note any content that was deprecated but might be needed later

**Content Gain Tracking:**
- Document new content created during migration
- Note content that was enhanced or expanded
- Track any content that was added to fill gaps

```
## Content Changes Summary

### Content Removed
- docs-old/overview/acronyms-and-terms.md
  - Reason: Outdated, better handled inline
  - Impact: Minimal, terms now defined in context
  
- docs-old/mission-capabilities/* (5 files)
  - Reason: Out of scope for UDS Core platform docs
  - Impact: Mission-specific content moved to separate documentation

### Content Enhanced
- docs/overview/uds-ecosystem.md
  - Enhancement: Combined why-uds + uds-mission-relevance
  - Value: More comprehensive ecosystem overview

- docs/getting-started/local-demo/integrate-your-package.md
  - Enhancement: Merged two tutorials into cohesive flow
  - Value: Better user experience for package authoring

### Content Added
- docs/concepts/platform/overview.md
  - Addition: New platform concepts extracted from multiple sources
  - Value: Centralized platform understanding

- All section overview.md files
  - Addition: New overview files for each section
  - Value: Consistent navigation and section entry points
```

### 7.5 Migration Decision Log

**Purpose:** Document key decisions made during the migration process for future reference.

```
## Migration Decision Log

### Decision 001: Bundle Content Split
**Date:** [Date]
**Issue:** How to handle structure/bundles.md content
**Options:** 
  A. Keep as single reference document
  B. Split into concepts + reference
  C. Move entirely to concepts
**Decision:** Option B - Split into concepts + reference
**Rationale:** Better separation of conceptual understanding vs reference details
**Impact:** Creates two focused documents instead of one broad document

### Decision 002: Tutorial Merge Strategy
**Date:** [Date]
**Issue:** How to handle create-package + add-package tutorials
**Options:**
  A. Keep as separate tutorials
  B. Merge into single comprehensive tutorial
  C. Combine into series with clear parts
**Decision:** Option B - Merge into single tutorial
**Rationale:** Users want complete package authoring flow in one experience
**Impact:** Creates more cohesive Getting Started experience
```

### 7.6 Migration Success Validation

**Completeness Verification:**
- Cross-reference movement log with original content inventory
- Validate that every piece of content is accounted for
- Ensure no content was lost without proper documentation

**Quality Assurance:**
- Review movement log for accuracy and completeness
- Validate transformation decisions against IA requirements
- Ensure all merges and splits are properly documented

**Future Reference:**
- Movement log serves as reference for future content updates
- Documentation of decisions provides context for future changes
- Complete audit trail of the migration process

### 7.7 Content Gap Analysis and GitHub Issue Generation

**Purpose:** Identify gaps in UDS Core documentation coverage during the migration process and create actionable GitHub issues to address missing content.

**Gap Discovery Process:**
As content is migrated, systematically identify areas where the current documentation is incomplete or missing important information that users need.

**Gap Categories:**
- **Conceptual Gaps** - Missing explanations of how things work
- **Procedural Gaps** - Missing step-by-step instructions
- **Reference Gaps** - Missing configuration details or examples
- **Troubleshooting Gaps** - Missing common problems and solutions
- **Integration Gaps** - Missing information about how components work together

**Gap Tracking Format:**
```
## Content Gap Log

### Gap 001: Production Deployment Scaling
**Discovered During:** Migration of getting-started/install-and-deploy-uds.md
**Section:** Getting Started → Production Deployment
**Missing Content:** 
- How to scale UDS Core for production workloads
- Resource planning guidelines for different cluster sizes
- Performance tuning recommendations
**Impact:** Users cannot properly size production deployments
**Priority:** High
**Proposed GitHub Issue:** "Add Production Scaling and Performance Tuning Guide"
**Suggested Location:** docs/getting-started/production/scaling-and-performance.md

### Gap 002: Advanced Networking Configuration
**Discovered During:** Migration of reference/configuration/Service Mesh/*
**Section:** How-To Guides → Networking
**Missing Content:**
- Custom gateway configuration examples
- Egress traffic management for external services
- Multi-cluster networking setup
- Network policy customization
**Impact:** Users with advanced networking needs lack guidance
**Priority:** Medium
**Proposed GitHub Issue:** "Add Advanced Networking How-To Guides"
**Suggested Location:** docs/how-to-guides/networking/advanced-configuration.md

### Gap 003: Backup and Restore Testing Procedures
**Discovered During:** Migration of reference/configuration/Backup And Restore/*
**Section:** How-To Guides → Backup & Restore
**Missing Content:**
- How to test backup validity
- Disaster recovery testing procedures
- Backup verification automation
- Restore testing in different environments
**Impact:** Users cannot validate their backup strategy
**Priority:** High
**Proposed GitHub Issue:** "Add Backup Testing and Disaster Recovery Procedures"
**Suggested Location:** docs/how-to-guides/backup-restore/testing-procedures.md

### Gap 004: Package Authoring Best Practices
**Discovered During:** Migration of tutorials/create-uds-package.md
**Section:** Getting Started → Local Demo
**Missing Content:**
- Package versioning strategies
- Dependency management best practices
- Package testing and validation
- Common packaging pitfalls and solutions
**Impact:** Package authors lack guidance for production-quality packages
**Priority:** Medium
**Proposed GitHub Issue:** "Add Package Authoring Best Practices Guide"
**Suggested Location:** docs/how-to-guides/packaging/best-practices.md

### Gap 005: Runtime Security Alert Management
**Discovered During:** Migration of reference/configuration/Runtime Security/*
**Section:** How-To Guides → Runtime Security
**Missing Content:**
- How to configure Falco alert routing
- Alert severity classification
- Security alert response procedures
- Integration with external monitoring systems
**Impact:** Security teams cannot effectively manage runtime alerts
**Priority:** Medium
**Proposed GitHub Issue:** "Add Runtime Security Alert Management Guide"
**Suggested Location:** docs/how-to-guides/runtime-security/alert-management.md
```

**Gap Severity Classification:**
- **Critical** - Missing essential information that blocks core functionality
- **High** - Important gaps that significantly impact user experience
- **Medium** - Useful but not essential information
- **Low** - Nice-to-have information that enhances completeness

**GitHub Issue Template Generation:**
```
## GitHub Issue Templates for Content Gaps

### Template: Missing How-To Guide
---
title: [Feature Area]: [Specific Task] Guide
labels: ["documentation", "content-gap", "how-to", "[priority]"]
assignee: "[team-member]"
---

## Content Gap Identified
**Area:** [Feature Area]
**Missing Guide:** [Specific task that needs documentation]
**Discovered During:** [Migration phase/file]
**User Impact:** [How this gap affects users]

## Proposed Content
### Target Audience
[Who this guide is for]

### Content Outline
1. [Prerequisites]
2. [Step 1: Task description]
3. [Step 2: Task description]
4. [Verification steps]
5. [Troubleshooting]

### Success Criteria
- [ ] Clear step-by-step instructions
- [ ] Working code examples
- [ ] Verification procedures
- [ ] Common troubleshooting steps

### Additional Notes
[Any other relevant information]

---

### Template: Missing Conceptual Content
---
title: [Concept Area]: [Specific Concept] Explanation
labels: ["documentation", "content-gap", "concepts", "[priority]"]
assignee: "[team-member]"
---

## Content Gap Identified
**Concept Area:** [Concept area]
**Missing Explanation:** [Specific concept that needs explanation]
**Discovered During:** [Migration phase/file]
**User Impact:** [How this gap affects user understanding]

## Proposed Content
### Target Audience
[Who this explanation is for]

### Content Outline
1. [What is the concept]
2. [Why it matters]
3. [How it works with other components]
4. [Common use cases]
5. [Related concepts]

### Success Criteria
- [ ] Clear conceptual explanation
- [ ] Relevant examples
- [ ] Links to related How-To guides
- [ ] Diagrams or visual aids if applicable

### Additional Notes
[Any other relevant information]
```

**Gap Analysis Process:**
1. **Discovery During Migration** - Note gaps as content is moved and reviewed
2. **Categorization** - Classify gaps by type and severity
3. **Impact Assessment** - Evaluate how each gap affects users
4. **Issue Generation** - Create GitHub issues with detailed requirements
5. **Prioritization** - Order issues by business impact and user need

**Gap Tracking Matrix:**
| Gap ID | Area | Missing Content | Severity | User Impact | Proposed Issue | Status |
|--------|------|----------------|----------|-------------|----------------|--------|
| GAP001 | Production Scaling | Resource planning guidelines | High | Users can't size deployments | #XXX | Open |
| GAP002 | Advanced Networking | Custom gateway configuration | Medium | Limited networking capabilities | #XXX | Open |
| GAP003 | Backup Testing | Disaster recovery procedures | High | No backup validation | #XXX | Open |

**Integration with Migration Process:**
- Gap identification happens concurrently with content migration
- Each migration phase includes gap analysis activities
- Gap log is updated in real-time as issues are discovered
- GitHub issues are created weekly during migration work

**Success Metrics:**
- All critical and high gaps have GitHub issues created
- Gap analysis is complete before migration finalization
- Issues are prioritized and ready for content team to address
- Gap tracking provides roadmap for future documentation improvements

## Phase 8: Persona and Information Level Validation

### 8.1 Persona Definition and Mapping

**Purpose:** Ensure all documentation is written from the correct persona perspective with appropriate information depth for each target audience.

**Primary Personas (from docs-ia-overview.md Appendix):**

1. **Platform Engineer** (Primary Persona)
   - **Needs:** Deploy, configure, maintain UDS Core
   - **Primary Sections:** Getting Started (Production), How-To Guides, Operations
   - **Secondary Sections:** Concepts, Reference
   - **Information Level:** Technical depth, practical implementation focus

2. **Buyer/Project Manager** (Secondary Persona)
   - **Needs:** Understand what UDS Core is and why it matters
   - **Primary Sections:** Overview
   - **Secondary Sections:** Getting Started (Demo), Concepts
   - **Information Level:** High-level, business value focused

3. **Package Author** (Emerging Persona)
   - **Needs:** Package applications for UDS deployment
   - **Primary Sections:** Getting Started (Demo), How-To Guides (Packaging)
   - **Secondary Sections:** Concepts (Configuration & Packaging), Reference (Operator & CRDs)
   - **Information Level:** Technical but focused on packaging workflows

### 8.2 Persona Validation Framework

**Validation Criteria by Section:**

**Overview Section:**
- **Target Persona:** Buyer/Project Manager
- **Information Level:** High-level, marketing-adjacent
- **Validation Points:**
  - Language focuses on business value and capabilities
  - Technical depth is appropriate for decision-makers
  - Avoids deep implementation details
  - Links appropriately to technical sections

**Getting Started Section:**
- **Target Personas:** Platform Engineer (Production), Package Author (Demo)
- **Information Level:** Tutorial-style, completion-oriented
- **Validation Points:**
  - Local Demo: Accessible to new users and package authors
  - Production: Technical depth for platform engineers
  - Step-by-step instructions with verification
  - Assumes appropriate prior knowledge

**Concepts Section:**
- **Target Personas:** Platform Engineer, Package Author
- **Information Level:** Conceptual understanding, not implementation
- **Validation Points:**
  - Explains "what" and "why," not "how to"
  - Technical depth appropriate for engineers
  - Uses diagrams and examples effectively
  - Links to practical implementation guides

**How-To Guides Section:**
- **Target Persona:** Platform Engineer
- **Information Level:** Task-oriented, practical implementation
- **Validation Points:**
  - Single goal per guide with clear outcomes
  - Assumes platform engineering knowledge
  - Provides working code examples
  - Includes troubleshooting for common issues

**Reference Section:**
- **Target Persona:** Platform Engineer (experienced)
- **Information Level:** Exact technical details
- **Validation Points:**
  - Assumes familiarity with UDS Core concepts
  - Provides complete configuration details
  - Focuses on technical accuracy over explanation
  - Serves as authoritative reference

**Operations Section:**
- **Target Persona:** Platform Engineer (operations focus)
- **Information Level:** Day-2 operations, troubleshooting
- **Validation Points:**
  - Assumes production deployment experience
  - Focuses on operational concerns
  - Provides runbook-style guidance
  - Addresses production-specific issues

### 8.3 Information Level Validation

**Information Depth Continuum:**
1. **Executive Level** - Business value, high-level benefits (Overview)
2. **Introduction Level** - Getting started basics, tutorials (Getting Started)
3. **Conceptual Level** - How things work, relationships (Concepts)
4. **Implementation Level** - Step-by-step tasks (How-To Guides)
5. **Reference Level** - Complete technical details (Reference)
6. **Operations Level** - Production troubleshooting (Operations)

**Validation Process:**
```
## Persona Validation Checklist

### Overview Section Validation
- [ ] Language appropriate for decision-makers
- [ ] Focus on business value and capabilities
- [ ] Technical concepts explained at high level
- [ ] No deep implementation details
- [ ] Clear paths to technical sections

### Getting Started Validation
- [ ] Local demo accessible to new users
- [ ] Production content technical enough for engineers
- [ ] Step-by-step instructions with verification
- [ ] Assumes appropriate prior knowledge
- [ ] Clear success criteria for each path

### Concepts Validation
- [ ] Explains what and why, not how to
- [ ] Technical depth appropriate for engineers
- [ ] Effective use of diagrams and examples
- [ ] Links to practical implementation
- [ ] Consistent conceptual framework

### How-To Guides Validation
- [ ] Single goal per guide
- [ ] Assumes platform engineering knowledge
- [ ] Working code examples provided
- [ ] Includes troubleshooting
- [ ] Clear prerequisites and verification

### Reference Validation
- [ ] Assumes UDS Core familiarity
- [ ] Complete configuration details
- [ ] Technical accuracy prioritized
- [ ] Authoritative reference material
- [ ] Links to implementation examples

### Operations Validation
- [ ] Assumes production experience
- [ ] Focus on operational concerns
- [ ] Runbook-style guidance
- [ ] Production-specific issues addressed
- [ ] Clear escalation procedures
```

### 8.4 Persona Consistency Review

**Cross-Section Persona Alignment:**
- Ensure consistent persona treatment across sections
- Validate that information levels progress logically
- Check that cross-references respect persona differences
- Verify that terminology is consistent for target personas

**Common Persona Validation Issues:**
- **Technical Depth Mismatch** - Content too technical or too simple for target persona
- **Assumption Gaps** - Content assumes knowledge persona doesn't have
- **Terminology Inconsistency** - Different terms used for same concept across sections
- **Information Level Drift** - Content drifts to inappropriate complexity level

### 8.5 Persona-Specific Quality Metrics

**Platform Engineer Metrics:**
- Technical accuracy and completeness
- Practical implementation guidance
- Working examples and configurations
- Troubleshooting and operational guidance

**Buyer/Project Manager Metrics:**
- Clear business value communication
- Appropriate technical depth
- Decision-making support
- Clear paths to technical information

**Package Author Metrics:**
- Clear packaging workflows
- Integration guidance with UDS Core
- Best practices and examples
- Troubleshooting for packaging issues

### 8.6 Validation Process and Deliverables

**Validation Methodology:**
1. **Persona Mapping Review** - Validate each section's target persona
2. **Information Level Assessment** - Check appropriate technical depth
3. **Terminology Consistency** - Ensure consistent language across sections
4. **Cross-Reference Validation** - Check that links respect persona differences
5. **User Journey Testing** - Follow paths for each persona through documentation

**Validation Deliverables:**
```
## Persona Validation Report

### Section-by-Section Analysis
**Overview Section:**
- Target Persona: Buyer/Project Manager ✓
- Information Level: Appropriate ✓
- Issues Found: [List any issues]
- Recommendations: [Improvement suggestions]

**Getting Started Section:**
- Target Personas: Platform Engineer (Production), Package Author (Demo) ✓
- Information Level: Appropriate for each path ✓
- Issues Found: [List any issues]
- Recommendations: [Improvement suggestions]

[Continue for all sections...]

### Cross-Section Consistency
- Terminology Consistency: [Assessment]
- Information Progression: [Assessment]
- Cross-Reference Appropriateness: [Assessment]

### Overall Persona Alignment
- Primary Persona (Platform Engineer): [Coverage assessment]
- Secondary Persona (Buyer/Project Manager): [Coverage assessment]
- Emerging Persona (Package Author): [Coverage assessment]

### Action Items
- [ ] Fix persona mismatches in [specific sections]
- [ ] Adjust information level in [specific documents]
- [ ] Standardize terminology across [sections]
- [ ] Improve cross-references for [persona transitions]
```

### 8.7 Success Criteria

**Persona Alignment Success:**
- [ ] All sections written for appropriate target personas
- [ ] Information levels match persona needs and expertise
- [ ] Consistent terminology across all sections
- [ ] Clear progression of information depth
- [ ] Effective cross-references that respect persona differences

**User Experience Success:**
- [ ] Platform Engineers can find implementation guidance quickly
- [ ] Buyers can understand value without technical overwhelm
- [ ] Package Authors have clear workflow guidance
- [ ] Each persona has appropriate entry points and paths
- [ ] Documentation supports complete user journeys for each persona

This comprehensive persona validation ensures that the restructured documentation effectively serves all target audiences with appropriate information depth and consistent user experiences.

**Primary Deliverables:**
1. **Content Movement Log** - Paragraph-by-paragraph tracking
2. **Transformation Matrix** - Complete mapping table
3. **Decision Log** - Key migration decisions and rationale
4. **Content Changes Summary** - Loss/gain documentation

**Format Standards:**
- All documentation in markdown for version control
- Consistent formatting across all deliverables
- Clear cross-references between related documents
- Searchable structure for future reference

This meticulous documentation ensures complete transparency of the migration process and provides valuable reference material for future content management and documentation updates.

This comprehensive plan ensures that all existing content is properly migrated to the new IA while improving user experience, maintainability, and consistency across the documentation site.
