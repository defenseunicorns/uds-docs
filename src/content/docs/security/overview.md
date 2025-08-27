---
title: UDS Security Overview
description: A general overview of security in UDS.
prev: false
next: false
---

UDS Core provides a secure, airgap-ready runtime for Kubernetes workloads with opinionated defaults and automation that reduce toil and risk. Security is layered across the **software supply chain**, **network and service mesh**, **identity and access**, **admission control**, **runtime monitoring**, and **observability/audit**. The goal is a practical, least‑privilege baseline that’s easy to operate and easy to verify.

## Overview

UDS Core ships a defense-in-depth baseline that provides real security through the entire software delivery process:

- **Hardened supply chain** with CVE data and per-release SBOMs, distributed as **Zarf** packages for predictable, airgap-friendly installs.
- **Zero‑trust networking** with default‑deny Kubernetes `NetworkPolicy`, Istio **STRICT mTLS**, and ALLOW‑based `AuthorizationPolicy`.
- **Identity & SSO** via Keycloak and Authservice so apps can be protected consistently, whether they natively support authentication or not.
- **Workload guardrails** enforced by **Pepr** admission policies (non‑root, drop caps, block privileged/host access, etc.).
- **Runtime visibility** using **NeuVector** in **alerting (detection-first)** mode by default.
- **Observability & audit**: centralized logs (Vector → Loki) and dashboards/metrics (Grafana/Prometheus).

:::note
Security defaults are intentionally restrictive. End users can loosen controls, but changing defaults may reduce your security posture. This should be done carefully and any reductions in security should be documented.
:::

## Secure Supply Chain

**What you get:**

- **Per-release CVE scanning and SBOMs**: View CVEs and full SBOMs for every Core release in the UDS Registry
- **Built with Zarf**: Packages include only what is needed for your environment and support offline/airgapped deployment through Zarf

**Why it matters:**

- You can verify exactly what ships with each release through SBOMs and CVE scans.
- Deterministic packages reduce drift and surprise dependencies.
- You can deploy and operate securely in offline environments without introducing “backdoor” network dependencies.
- Supports mission-critical use cases in highly secure networks where connectivity cannot be assumed.

**References:**
- UDS Registry: https://registry.defenseunicorns.com/repo/public/core/versions
- Zarf: https://zarf.dev/

## Identity & SSO

**What you get:**

- **Keycloak** for SSO management with opinionated defaults for realms, clients, and group-based access.
- **Authservice** integration to protect apps that don’t natively speak OIDC—enforced at the mesh edge.

**Why it matters:**

- Consistent login, token handling, and group mapping across apps.
- Centralized access control that is easy to audit.

**References:**
- Keycloak SSO: https://uds.defenseunicorns.com/reference/configuration/single-sign-on/overview/
- Authservice Protection: https://uds.defenseunicorns.com/reference/configuration/single-sign-on/auth-service/

## Zero‑Trust Networking & Service Mesh

**What you get:**

- **Default‑deny network posture**: Per‑namespace `NetworkPolicy` isolates workloads by default with explicit allow rules generated from your package’s declared needs.
- **Istio STRICT mTLS**: All in-mesh traffic is encrypted and identity-authenticated by default.
- **ALLOW‑based authorization**: `AuthorizationPolicy` enforces least privilege at the service layer.
- **Explicit egress**: Outbound access is explicitly declared to both in-cluster endpoints and remote hosts.
- **Admin vs Tenant ingress**: Administrative UIs are isolated behind a dedicated admin gateway.

**Why it matters:**

- Lateral movement is constrained by both the Kubernetes networking layer and Istio.
- Connectivity to/from your application is explicitly declared and easily reviewable.

**References:**
- Istio mTLS: https://istio.io/latest/blog/2023/secure-apps-with-istio/
- Ingress Gateways: https://uds.defenseunicorns.com/reference/configuration/service-mesh/ingress/#gateways
- Authorization Policies: https://uds.defenseunicorns.com/reference/configuration/service-mesh/authorization-policies/

## Admission Control (Pepr Policies)

**What you get:**

- **Secure defaults** that block overly privileged workloads.
- **Security mutations** to force workloads to use more secure configuration.
- **Controlled exemptions** for edge cases, keeping RBAC tight and changes auditable.

**Why it matters:**

- Misconfigurations and overly-permissive settings are blocked before they reach the cluster.
- In some cases workloads are automatically "downgraded" to least privilege.
- Exemptions are explicit and reviewable.

**References:**
- Pepr Policies: https://uds.defenseunicorns.com/reference/configuration/pepr-policies/
- Exemptions: https://uds.defenseunicorns.com/reference/configuration/uds-operator/exemption/

## Runtime Security

**What you get:**

- **Runtime/container security** from NeuVector, used in alerting/monitor mode by default.
- **Visibility** into suspicious process, network, and file activity with alerts routed to your ops tooling.

**Why it matters:**

- You get actionable detection without the risk of blocking production traffic.
- Malicious behavior is instantly detected, allowing for quick triage and resolution.

## Observability & Audit

**What you get:**

- **Centralized logging**: Vector collects and ships all cluster and application logs for searchable audit trails.
- **Metrics & dashboards**: Prometheus scrapes metrics and Grafana provides pre‑wired datasources and dashboards.

**Why it matters:**

- Unified troubleshooting across logs and metrics.
- Auditability for change control and incident response.
