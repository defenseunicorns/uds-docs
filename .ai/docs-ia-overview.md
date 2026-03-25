# UDS Core Documentation IA: Final Structure

## Executive Summary

This document defines the final Information Architecture (IA) for the UDS documentation site, which hosts documentation for multiple UDS products using a tabbed navigation approach.

**Key features:**
- Multi-product navigation using Starlight Sidebar Topics plugin
- 6 top-level sections for UDS Core (primary product)
- Clean separation between product docs without changing sites
- Scalable structure that grows with new products

**Ready for**: Design, Marketing, and PM review and approval

---

## Quick Summary: What's Changing?

- **Complete IA restructure for UDS Core**: sections reorganized (Overview → Getting Started → Concepts → How-To → Reference → Operations) and content moved to new paths; expect URL changes and redirects.
- **Multi-product tabs** at the sidebar top (UDS Core, Registry, Fleet) with shared search and consistent templates.
- **Default-expanded “Overview” + “Getting Started”** for UDS Core; predictable navigation (breadcrumbs, sticky TOC, prev/next links).
- **Task-first organization with Packaging Applications highlighted** to support self-service/Foundry.
- **Anti-duplication:** shared concepts live in Core; other products link back instead of re-explaining.
- **Scalable:** adding a product = add a tab + config, no site-wide restructure.

---

## 1. Multi-Product Navigation

### How It Works

The documentation uses the **Starlight Sidebar Topics** plugin to provide tabbed navigation between product docs.

**User experience:**
- Tabs appear at top of sidebar: `UDS Core` | `Registry` | `Fleet` | etc.
- Clicking a tab switches the sidebar to that product's documentation
- No page reload, stays in same browser tab
- Fast, seamless product switching

### When to Add a New Product Tab

Add a new product tab when:
- ✅ Product has 5+ pages of unique documentation
- ✅ Product is generally available or public beta
- ✅ Product integrates with or extends UDS ecosystem
- ✅ Product has committed support and maintenance

**Do NOT add if:**
- ❌ Product is internal-only or experimental
- ❌ Product has <5 pages (just document in UDS Core How-To instead)
- ❌ Product is deprecated or unmaintained

### Product Documentation Structure

Each product should follow similar structure to UDS Core:
```
Product X Documentation
├── Overview
├── Getting Started
├── How-To Guides (or User Guide)
├── Reference
└── (Optional: Concepts, Operations)
```

**Anti-Duplication Rule:**
Product docs should **link to UDS Core docs** for shared concepts (bundles, packages, operators) rather than re-explaining them.

---

## 2. UDS Core Structure (Primary Product)

### Top-Level Sections (6)

```
1. Overview
2. Getting Started
3. Concepts
4. How-To Guides
5. Reference
6. Operations & Maintenance
```

---

## 3. Complete Sidebar Structure

```
[Tabs: UDS Core | Registry | Fleet]  ← Starlight Sidebar Topics

UDS Core Documentation
│
├── 🏠 Overview (Expanded by default)
│   ├── UDS Ecosystem
│   ├── UDS Core
│   └── Security
│
├── 🚀 Getting Started (Expanded by default)
│   ├── Overview
│   ├── Local Demo
│   │   ├── 1. Overview
│   │   ├── 2. Basic Requirements
│   │   ├── 3. Install and Deploy UDS
│   │   └── 4. Add Your own Package (optional)
│   └── Production Deployment
│       ├── 1. Overview
│       ├── 2. Prerequisites
│       ├── 3. Build your Bundle
│       └── 4. Deploy to Production
│
├── 💡 Concepts (collapsed)
│   ├── UDS Core
│   ├── Core Features
│   │   ├── Networking & Service Mesh
│   │   ├── Identity & Authentication
│   │   ├── Logging
│   │   ├── Monitoring
│   │   ├── Runtime Security
│   │   ├── Backup & Restore
│   │   └── Policy & Compliance
│   ├── Platform
│   │   ├── Platform Layers & Environments
│   │   ├── Environments & Clusters
│   │   ├── Platform vs Application Layer
│   │   └── Flavors (Core variants)
│   └── Configuration & Packaging
│       ├── Overview
│       ├── Bundles
│       └── Core CRDs
│
├── 📖 How-To Guides (collapsed)
│   ├── Overview
│   ├── High Availability
│   |   ├── How to configure
|   |   └── etc...
│   ├── Networking
│   |   ├── How to configure
|   |   └── etc...
│   ├── Identity Access
│   |   ├── How to configure
|   |   └── etc...
│   ├── Logging
│   |   ├── How to configure
|   |   └── etc...
│   ├── Monitoring & Observability
│   |   ├── How to configure
|   |   └── etc...
│   ├── Runtime Security
│   |   ├── How to configure
|   |   └── etc...
│   ├── Backup & Restore
│   |   ├── How to configure
|   |   └── etc...
│   ├── Policy & Compliance
│   |   ├── How to configure
|   |   └── etc...
│   └── Packaging Applications   (To be added by Foundry)
│       ├── How to configure
|       └── etc...
│
├── 📚 Reference (collapsed)
│   ├── Operator & CRDs
│   │   ├── Overview
│   │   ├── Package CR
│   │   ├── Exemption CR
│   │   ├── ClusterConfig CR
│   │   └── Resource Tree
│   ├── UDS Core
│   ├── UDS CLI
│   ├── Network & Service Mesh
│   ├── Identity & Access
│   └── Logging
│
└── ⚙️ Operations & Maintenance (collapsed)
    ├── Overview
    ├── Upgrades & Configuration Changes
    │   ├── Upgrade Overview
    │   ├── Version-Specific Guides
    │   └── Configuration Changes
    └── Troubleshooting & Runbooks
        ├── Troubleshooting Overview
        └── By Symptom
```

**Navigation Features:**
- Product tabs at top of sidebar (UDS Core selected by default)
- Search bar (Ctrl+K) searches across all products
- Breadcrumbs show current location within product
- On-page TOC in right sidebar (sticky as you scroll)
- Previous/Next links at bottom of each page

---

## 4. Detailed Section Breakdown (UDS Core)

### 4.1 Overview
**Purpose**: Help readers quickly understand what UDS Core is, why it exists, and whether it's relevant to them.

**Content:**
```
└── 🏠 Overview (Expanded by default)
    ├── UDS Ecosystem
    │   └── Describes the full UDS ecosystem (Core, CLI, packages, bundles, Registry, Fleet) and who each part serves.
    ├── UDS Core
    │   └── High-level introduction to UDS Core: what it is, problems it solves, and who should use it.
    └── Security
        └── Overview of UDS Core's security posture, built-in protections, and defense-in-depth approach.
```

**Authoring guidance:**
- Keep high-level and marketing-adjacent
- Avoid deep configuration details or step-by-step instructions
- Link out to Concepts, Getting Started, and Reference
- When mentioning other UDS products (Registry, Fleet), link to their tabs

---

### 4.2 Getting Started
**Purpose**: Provide clear, end-to-end first experiences with UDS Core.

**Content:**
```
└── 🚀 Getting Started (Expanded by default)
    ├── Overview
    │   └── "Choose your path" landing that compares Demo vs Production options, time, prerequisites, and outcomes.
    ├── Local Demo
    │   ├── 1. Overview
    │   │   └── Sets expectations for the local demo flow and what you'll accomplish on a k3d cluster.
    │   ├── 2. Basic Requirements
    │   │   └── Lists local prerequisites (Docker/Podman, k3d, kubectl, UDS CLI), system requirements, and quick validation commands.
    │   ├── 3. Install and Deploy UDS
    │   │   └── Step-by-step deploying UDS Core to local k3d, with expected output and timing.
    │   └── 4. Add Your own Package (optional)
    │       └── Tutorial to build a simple package (e.g., NGINX), add it to a bundle, deploy, and access via ingress.
    └── Production Deployment
        ├── 1. Overview
        │   └── What the production path delivers, who it's for, and how the checklist-style flow works.
        ├── 2. Prerequisites
        │   └── Production requirements: supported K8s, networking (DNS/LB/certs), external dependencies, RBAC, capacity planning.
        ├── 3. Build your Bundle
        │   └── Create a production-ready bundle: choose Core flavor, configure integrations (IdP, DB, storage), set resource limits and overrides.
        └── 4. Deploy to Production
            └── Deploy the bundle, monitor rollout, handle common issues, and validate components post-deploy.
```

**Industry Standard Pattern:**
- Simple tutorials: Direct to Step 1
- Complex installations: Overview page first

**Each page includes:**
- Clear "Step X of Y" indicator
- "Previous" / "Next" buttons at bottom
- Progress breadcrumb
- Success criteria at the END of each step

**Authoring guidance:**
- Everything tutorial-style and completion-oriented
- Assume minimal prior knowledge of UDS Core
- Link to Concepts for background, Reference for details
- Each step ends with verification: "How do I know it worked?"

---

### 4.3 Concepts
**Purpose**: Explain how UDS Core works conceptually and how its major pieces fit together.

**Content:**
```
└── 💡 Concepts (collapsed by default)
    ├── UDS Core
    │   └── Platform overview of how UDS Core works under the hood and how its layers interact.
    ├── Core Features
    │   ├── Networking & Service Mesh
    │   │   └── How Istio-based mesh provides mTLS, traffic management, and ingress/egress architecture.
    │   ├── Identity & Authentication
    │   │   └── Keycloak-backed SSO model, Authservice protection, and group-based authorization flows.
    │   ├── Logging
    │   │   └── How logs are aggregated with Loki, what's collected by default, and how apps send logs.
    │   ├── Monitoring
    │   │   └── Prometheus/Grafana monitoring model, metrics collection out-of-box, and alerting basics.
    │   ├── Runtime Security
    │   │   └── Falco-based runtime threat detection and how alerts integrate with platform monitoring.
    │   ├── Backup & Restore
    │   │   └── Velero-based backup strategy, what's backed up, and common restore scenarios.
    │   └── Policy & Compliance
    │       └── Pepr admission policies, default enforcement, and exemption model for compliance.
    ├── Platform
    │   ├── Platform Layers & Environments
    │   │   └── How infrastructure, Core platform, and applications align across cloud, on-prem, edge, and air-gapped setups.
    │   ├── Environments & Clusters
    │   │   └── How Core adapts across multiple clusters and environments, and what varies vs. stays consistent.
    │   ├── Platform vs Application Layer
    │   │   └── Clarifies responsibilities between Core platform services and deployed applications.
    │   └── Flavors (Core variants)
    │       └── How different Core flavors map to deployment scenarios and constraints.
    └── Configuration & Packaging
        ├── Overview
        │   └── How UDS packaging and configuration work: packages, bundles, operator, overrides, and Zarf relationship.
        ├── Bundles
        │   └── Bundle structure, how packages combine, and how overrides tailor environments.
        └── Core CRDs
            └── Role of operator CRDs (Package, Exemption, ClusterConfig) in managing platform behavior.
```

**Authoring guidance:**
- Explain *what* and *why*, not *how to*
- Use diagrams and examples where useful
- Link out to How-To Guides and Reference for concrete steps
- Each Concept page should end with "Ready to configure this? See [relevant How-To guide]"
- Keep it high-level; resist putting configuration details here

---

### 4.4 How-To Guides
**Purpose**: Show platform engineers how to complete specific tasks with UDS Core.

**Content:**
```
└── 📖 How-To Guides (collapsed, with "Common Tasks" featured)
    ├── Overview
    │   └── Sets the stage for task-based guides and how to navigate by goal.
    ├── High Availability
    │   └── Guides on how to configure component redundancy, scaling, pod disruption budgets, and resilience patterns for production deployments.
    ├── Networking
    │   └── Guides on how to configure ingress, egress, custom gateways, and non-HTTP traffic through the mesh.
    ├── Identity Access
    │   └── Guides on how to configure integrating IdPs, protecting apps with Authservice, group-based auth, device flow, and service accounts.
    ├── Logging
    │   └── Guides on how to configure Validate collection, query in Grafana, and manage log retention.
    ├── Monitoring & Observability
    │   └── Guides on how to configure Validate metrics, build dashboards, configure alerts, and set up blackbox monitoring.
    ├── Runtime Security
    │   └── Guides on how to configure  Falco detections, route alerts, and tune security policies.
    ├── Backup & Restore
    │   └── Guides on how to configure  backup storage, schedules, restores, and volume snapshots.
    ├── Policy & Compliance
    │   └── Guides on how to configure Apply Pepr policies and configure exemptions for compliant workloads.
    └── Packaging Applications
        └── Guides on how to package applications and integrate with UDS Core
```

**Common Tasks Index Page:**
Organizes by user goal, not feature area:
- "Enable external access to my application" → Networking/Ingress
- "Set up single sign-on" → Identity/SSO
- "Debug why logs aren't appearing" → Logging validation
- "Create a backup schedule" → Backup & Restore
- "Package my application for UDS" → Packaging Applications

**Standard How-To Template:**
Every guide follows same structure (see ADR for template details):
- What You'll Accomplish
- Prerequisites
- Steps (with code examples)
- Verification
- Troubleshooting
- Next Steps

**Authoring guidance:**
- Each page represents a single goal
- Include prerequisites, steps, verification, basic troubleshooting
- Link to Concepts for background
- Link to Reference for full configuration matrices
- Link to Operations for related runbooks
- Use version banners when content is version-specific

---

### 4.5 Reference
**Purpose**: Provide exact, authoritative details for UDS Core-specific configuration.

**Content:**
```
└── 📚 Reference (collapsed)
    ├── Operator & CRDs
    │   ├── Overview
    │   ├── Package CR
    │   ├── Exemption CR
    │   ├── ClusterConfig CR
    │   └── Resource Tree
    ├── UDS Core
    │   └── Core-specific reference material (flavors, distributions, etc.)
    ├── UDS CLI
    │   └── CLI behavior, schema validation, command index (links to CLI repo for full docs)
    ├── Network & Service Mesh
    │   └── Ingress, egress, gateway configuration reference
    ├── Identity & Access
    │   └── SSO, client configuration, session management reference
    └── Logging
        └── Loki storage configuration reference
```

**What Belongs Here:**
- ✅ UDS Core-specific configuration surfaces and schemas
- ✅ CLI behavior and validation (hand-authored, not autogenerated)
- ✅ Operator and CRD reference (complete field documentation)
- ✅ UDS-specific networking/identity/logging config

**What Does NOT Belong Here:**
- ❌ Autogenerated CLI per-command docs (link to CLI repo instead)
- ❌ Upstream product documentation (Grafana, Prometheus, Istio - link to their docs)
- ❌ How-to content (belongs in How-To Guides)

**Authoring guidance:**
- Keep small and focused on UDS Core-specific surfaces
- Don't duplicate upstream product docs
- Use tables for configuration matrices
- Include working examples for common use cases
- Link to How-To Guides for usage patterns

---

### 4.6 Operations & Maintenance
**Purpose**: Support day-2 operations, debugging, upgrades, and long-term ownership of UDS Core.

**Content:**
```
└──  ⚙️ Operations & Maintenance (collapsed)
    ├── Overview
    │   └── Introduction to operational concerns and where to find specific guidance.
    ├── Upgrades & Configuration Changes
    │   ├── Upgrade Overview
    │   │   └── General upgrade procedures, pre/post-upgrade checklists, rollback plans.
    │   ├── Version-Specific Guides
    │   │   └── Detailed guides for each version (breaking changes, migration steps).
    │   └── Configuration Changes
    │       └── How to apply config changes, pod reload behavior, secret rotation.
    └── Troubleshooting & Runbooks
        ├── Troubleshooting Overview
        │   └── How to use runbooks, escalation paths, getting help.
        └── By Symptom
            ├── Pods Not Starting
            ├── Applications Not Accessible
            ├── Logs Missing
            ├── Authentication Failures
            ├── Performance Issues
            └── Storage Problems
```

**Troubleshooting Runbook Template:**
Every runbook follows consistent structure (see ADR for template):
- Symptoms (what users observe)
- Common Causes
- Diagnostic Steps
- Solutions (per cause)
- Verification
- Prevention

**Authoring guidance:**
- Write for operations scenarios
- Focus on detection, diagnosis, and resolution
- Organize troubleshooting by BOTH symptom AND feature area
- Link heavily to Reference for exact settings
- Link to Concepts only as necessary for understanding
- Keep upgrade guides version-specific with clear banners

---

## 5. Other Product Tabs (Example Structure)

### Registry Tab (Examples)
```
UDS Registry Documentation
├── Overview
│   └── What is UDS Registry, when to use it
├── Getting Started
│   ├── Prerequisites
│   ├── Installation
│   └── First Steps
├── How-To Guides
│   ├── Publishing Artifacts
│   ├── Managing Access Control
│   └── Integration with UDS Core  ← Links back to Core docs
└── Reference
    ├── CLI Commands
    └── Configuration
```

### Fleet Tab (Examples)
```
UDS Fleet Documentation
├── Overview
│   └── What is UDS Fleet, cluster management concepts
├── Getting Started
│   ├── Prerequisites
│   ├── Installation
│   └── Add Your First Cluster
├── User Guide
│   ├── Managing Clusters
│   ├── Deploying Workloads
│   └── Monitoring Fleet
└── Reference
    └── Fleet Configuration
```

**Anti-Duplication Enforcement:**
- ✅ Registry/Fleet docs explain product-specific features
- ✅ Link to UDS Core docs for bundles, packages, operators
- ❌ Don't re-explain UDS Core concepts
- ❌ Don't duplicate deployment procedures

---

## 6. Key Design Principles

### 6.1 Progressive Disclosure
- Start simple (Overview, Getting Started)
- Layer in complexity (Concepts, How-To)
- Expert content at the end (Reference, Operations)

### 6.2 Task-Oriented Organization
- Organize by what users want to accomplish, not by features
- "Configure ingress" not "Networking feature documentation"
- "Common Tasks" index helps users find goals quickly

### 6.3 Consistent Templates
- Every How-To guide follows same structure (see ADRs)
- Every troubleshooting runbook follows same format
- Every reference page has same layout
- Predictability helps users navigate faster

### 6.4 Clear Separation of Concerns
- **Concepts** = what and why
- **How-To** = step-by-step tasks
- **Reference** = exact configuration details
- **Operations** = troubleshooting and day-2
- No mixing of content types

### 6.5 Minimize Duplication
- Single source of truth for each concept (in UDS Core docs)
- Other products link to Core, don't copy
- Link between sections, don't repeat

### 6.6 Scalability
- Structure supports adding new feature areas
- **Multi-product tabs** handle new products cleanly
- Packaging section can grow without disrupting other sections

### 6.7 Multi-Product Cohesion
- All products use same Astro Starlight template
- Consistent navigation patterns across products
- Shared search across all product docs
- Cross-linking encouraged (Registry links to Core, Fleet links to Core)

---

## 7. Migration Risks & Mitigations

**Risk: Broken external links**
- **Impact:** High - External sites, bookmarks, search results may link to old URLs
- **Mitigation:** Comprehensive redirect mapping from old → new URLs in Astro config
- **Owner:** Engineering team

**Risk: User confusion during transition**
- **Impact:** Medium - Regular users may not find familiar content
- **Mitigation:** 
  - Clear announcement of changes
  - "What moved?" guide showing old → new mappings
  - Temporary banner on old docs pointing to new structure
- **Owner:** Documentation team

**Risk: Incomplete content migration**
- **Impact:** Medium - Some content may get lost in transition
- **Mitigation:**
  - Use docs-movement.md as source of truth
  - Review checklist for each old page → new location
  - Test all internal links after migration
- **Owner:** Documentation team

**Risk: Multi-product confusion**
- **Impact:** Low - Users may not realize they can switch products
- **Mitigation:**
  - Clear product switcher at top of sidebar
  - Landing page mentions all available products
  - Cross-links between products where relevant
- **Owner:** Design + Documentation teams

---

## 8. Implementation Phases
**Phase 1: Review Proposal**
- Review proposal
- Gather feedback
- Make adjustments

**Phase 2: Foundation**
- Create new directory structure
- Implement documentation templates (ADRs)

**Phase 3: High-Priority Content**
- Migrate Everything
- Actively maintain "What moved?" guide
- Where possible, use templates

**Phase 4: Polish & Launch**
- Set up redirects
- Create migration announcement
- Gather initial feedback
- Make adjustments

**Ongoing: Continuous Improvement**
- Monitor user feedback and metrics
- Expand packaging documentation (Foundry)
- Add new How-To guides as features evolve
- Refine based on support ticket trends
- [Utilize Astro plugin for future products to combine docs](https://starlight-sidebar-topics.netlify.app/docs/getting-started/)
- migrate to new templates

---

## Appendix: LLM-Friendly Documentation

The docs site generates `llms.txt`, `llms-full.txt`, and `llms-small.txt` via the `starlight-llms-txt` plugin. These files allow AI coding assistants and LLMs to consume the full documentation as structured text.

### Required: `description` frontmatter on every page

Every page must have a `description` field in its frontmatter. This is not optional.

```yaml
---
title: Configure TLS certificates for gateways
description: Configure valid TLS certificates for UDS Core ingress gateways using cert-manager, manual secrets, or cloud-managed certificate options.
---
```

The description is used by:
- **`llms.txt`**: listed as the page's purpose so LLMs can decide which document set to retrieve
- **Pagefind search**: displayed as the snippet below each search result
- **SEO**: used as the HTML `<meta name="description">` tag

### Writing good descriptions

| Page type | Pattern | Example |
|---|---|---|
| How-to guide | "Configure/Enable/Set up... [what] [for whom/when]." | "Configure Keycloak for production HA with an external PostgreSQL database and horizontal pod autoscaling." |
| Reference | "Complete reference for... [surface] including [key fields]." | "Complete reference for the Package v1alpha1 custom resource, which declares an application's network access, SSO clients, and monitoring configuration." |
| Concept | "How [component] [does thing] in UDS Core." | "How UDS Core uses Falco to detect runtime threats by monitoring system calls, file access, and network connections inside running containers." |
| Runbook | "Diagnose and resolve [problem]." | "Diagnose and resolve issues where UDS Exemption or Package CRs are not being reconciled by the UDS Operator." |
| Overview/index | "Index of/Guides for [section] covering [topics]." | "Guides for common Keycloak and Authservice tasks: SSO configuration, identity providers, login policies, and branding." |

### Adding a new product

When adding a new product to the docs site:
- All docs pages in the product's repo must have `description` frontmatter
- The product's `index.mdx` description is especially important; the `promote` config in `astro.config.mjs` explicitly promotes product index pages ahead of all section pages so LLMs encounter the product summary before individual pages in `llms-full.txt` and `llms-small.txt`
- `customSets` and `promote` in `astro.config.mjs` auto-derive from `sidebarOrder`; no manual update required when adding a product

---

## Appendix: Persona Mapping

### Primary Persona: Platform Engineer
- **Needs**: Deploy, configure, maintain UDS Core
- **Primary Sections**: Getting Started (Production), How-To Guides, Operations
- **Secondary Sections**: Concepts, Reference

### Secondary Persona: Buyer/Project Manager
- **Needs**: Understand what UDS Core is and why it matters
- **Primary Sections**: Overview
- **Secondary Sections**: Getting Started (Demo), Concepts

### Emerging Persona: Package Author
- **Needs**: Package applications for UDS deployment
- **Primary Sections**: Getting Started (Demo), How-To Guides (Packaging)
- **Secondary Sections**: Concepts (Configuration & Packaging), Reference (Operator & CRDs)
