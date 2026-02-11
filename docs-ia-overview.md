# UDS Core Documentation Architecture

This document outlines the top-level information architecture for the UDS Core docs, the intent of each section, and how we plan to use them when authoring new content.

## Top-Level Sections

1. **Overview**
2. **Getting Started**
3. **Concepts**
4. **How-to Guides**
5. **Reference**
6. **Operations & Maintenance**

---

## 1. Overview

**Intent:** Help readers quickly understand what UDS Core is, why it exists, and whether it’s relevant to them.

**Typical content:**

- What is UDS Core?
- Key capabilities and use cases.
- High-level architecture.
- Supported environments and prerequisites (at a glance).
- High-level UDS security overview.
- Quick links by persona (platform engineer, new hire, etc.).

**Authoring guidance:**  
Keep this high-level and marketing-adjacent. Avoid deep configuration details or step-by-step instructions. Link out to Concepts, Getting Started, and Reference.

---

## 2. Getting Started

**Intent:** Provide clear, end-to-end first experiences with UDS Core.

**Typical content:**

- “Choose your path”: demo/sandbox vs production/mission.
- Demo path:
  - Local prerequisites (e.g., Docker, k3d).
  - Deploy UDS Core locally with a demo bundle.
  - Optionally integrate your own package into the demo.
- Production path:
  - Production prerequisites (compute, external dependencies, cert/domain, etc).
  - Making your bundle config (things to consider).

**Authoring guidance:**  
Everything here should be tutorial-style and completion-oriented. Assume minimal prior knowledge of UDS Core; link to Concepts for background and to Reference for details.

---

## 3. Concepts

**Intent:** Explain how UDS Core works conceptually and how its major pieces fit together.

**Typical content:**

- UDS Core platform feature overviews (networking & service mesh, logging, identity/auth, backup & restore, monitoring, runtime security, policy engine).
- Platform layers & environments (how Core relates to application workloads and common environments).
- Security & access model.
- Configuration & packaging (UDS Bundles, packages, flavors, and core CRDs at a high level).

**Authoring guidance:**  
Explain *what* and *why*, not *how to*. Use diagrams and examples where useful. Link out to How-to Guides and Reference for concrete steps and options.

---

## 4. How-to Guides

**Intent:** Show platform engineers how to complete specific tasks with UDS Core.

**Typical content (by feature area):**

- Networking & service mesh:
  - Configure ingress, egress, and gateways.
  - Wire applications through the mesh safely.
- Identity & authentication:
  - Integrate with an external IdP.
  - Protect apps with Authservice and group-based access.
- Logging:
  - Validate that logs are being collected.
  - Query logs for troubleshooting.
- Monitoring & observability:
  - Validate metrics collection.
  - Create and tune dashboards and alerts.
- Backup & restore:
  - Configure and run backups and restores.
- Runtime security:
  - Configure runtime detection.
  - Route and tune security alerts.
- Policy & compliance:
  - Apply and tune Pepr policies.
  - Configure policy exemptions.
 - Packaging:
   - Author and test packages and bundles used with UDS Core.
   - Manage overrides and environment-specific configuration for those bundles.
   - This will be contributed by the Foundry team.

**Authoring guidance:**  
Each page should represent a single goal (“Configure X”, “Troubleshoot Y”), with prerequisites, steps, verification, and basic troubleshooting. Link to Concepts for background and to Reference for full configuration matrices.

For any guide that is **version-specific**, include a clear banner near the top (for example, a note callout) that
states which UDS Core versions the guide applies to and where to find upgrade notes or changes.

---

## 5. Reference

**Intent:** Provide exact, authoritative details for UDS Core and related configuration.

**Typical content:**

- CLI behavior and validation (what the CLI does, how it reads config/flags/env vars).
- UDS Operator and CRD reference (schemas, fields, and stable behavior).
- UDS-specific networking configuration on top of Istio.
- Identity & access configuration surfaces (SSO/IDAM behavior and knobs).
- Logging storage configuration that is unique to UDS Core.

**Authoring guidance:**  
Keep this section small and focused on UDS Core–specific configuration surfaces and schemas. Avoid duplicating upstream product documentation (Grafana, Prometheus, Falco, Velero, etc.). Reference pages are the target for “looking for more detail?” links from Concepts and How-to Guides.

---

## 6. Operations & Maintenance

**Intent:** Support day-2 operations, debugging, upgrades, and long-term ownership of UDS Core.

**Typical content:**

- Operate UDS Core:
  - Health checks and SLOs.
  - Scaling and high availability patterns.
- Upgrading UDS Core and applying planned changes:
  - Release and upgrade guidance, including safe rollback.
  - Configuration and secret changes on a running cluster (including pod-reload behavior).
- Backup and restore procedures at the platform level.
- Troubleshooting runbooks, organized by:
  - Symptom (e.g., “Logs missing”, “Users can’t log in”).
  - Feature area (logging, monitoring, identity/auth, networking & service mesh, runtime security, backup & restore).
- Security & compliance operations.

**Authoring guidance:**  
Write for operations scenarios. Focus on detection, diagnosis, and resolution. Link heavily to Reference (for exact settings) and to Concepts only as necessary.

---

## 7. Where does this doc belong?

When adding or moving docs, use this quick guide:

- **Narrative "what/why" about UDS or UDS Core?**  
  - High-level ecosystem explanation → **Overview / What is UDS?**  
  - Runtime platform capabilities and posture → **Overview / UDS Core overview** or **Concepts**.

- **First-time, end-to-end experience?**  
  - Getting someone from zero to a working environment (demo or production) → **Getting Started**.

- **Explaining how a thing works conceptually?**  
  - Platform layers & environments, configuration/packaging, or feature internals → **Concepts**.

- **Step-by-step "do X" for a specific feature?**  
  - Configure or change one capability (networking, SSO, logging, monitoring, backup, runtime security, policy) → **How-to Guides** under that feature area.

- **Exact knobs, fields, and schemas?**  
  - CRDs, configuration tables, CLI flags, and bundle/package fields → **Reference**.

- **Running and owning the platform over time?**  
  - Scaling and HA, upgrades, runbooks, incident response, day‑2 operations → **Operations & Maintenance**.

- **Capability-specific products (Registry, Tactical Edge, etc.)?**  
  - These are **out of scope** for the UDS Core docs IA. They should live in their own capability docs (or product
    sites), with Overview pages in UDS Core linking out where appropriate.
