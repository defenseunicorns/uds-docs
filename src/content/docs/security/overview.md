---
title: UDS Security Overview
description: A general overview of security in UDS.
prev: false
next: false
---

Defense Unicorns is committed to defense in depth best practices with continuous monitoring, logging, and alerting across a
multi-layered approach. UDS ensures secure runtime by closely managing and monitoring software
interactions within environments, verifying software components, and mitigating vulnerabilities in real-time to
maintain a trusted and resilient operational state.

## What makes UDS secure?
The tooling may change but UDS provides: Identity & Authorization, Metrics Server, Monitoring, Logging, Runtime Security, Backup and Restore. 

### Compliance Alignment: 
* For the U.S. defense sector and other highly regulated environments, UDS satisfies 94% of technical program office security controls for IL-4. All highly regulated programs have some technical and administrative controls due to the very nature of their environments and operations. Defense Unicorns focuses on the areas that the typical DoD program finds more difficult to implement. With your pre-existing security and our built-in security, we fulfill 90% of security controls.
* UDS aligns with NIST 800-53 Rev 5, ensuring deployments meet strict regulatory requirements for DoD and other government agencies. If you are still on Rev 4 baseline, we have experts that can help with the translation between the documents since there is a large control group overlap.

### Air-Gap Compatibility: 
* UDS supports secure, offline environments by ensuring all tools, from package managers to deployment tools like Zarf, operate seamlessly without internet access. UDS is designed from the ground up for airgapped systems to support disconnected, semi-disconnected, or highly secure environments. This is unique that UDS is built for air gap while typical industry products need adaption for airgapped systems.
  * UDS can operate without the internet.
  * UDS can operate without external network dependencies.
  
### Secure Baseline Configurations: 
* UDS incorporates hardened configurations tailored for specific missions. These configurations include hardened images to meet DoD standards, further reducing vulnerabilities and ensuring compliance.

### Network Security: 
* The Istio Service Mesh enforces secure communication between services, providing mutual TLS (mTLS) encryption, traffic policies, and network segmentation. A dedicated admin gateway isolates all administrative services, so that they are unreachable by a standard user.

### Istio-Authservice: 
* Provides automatic authentication and group based authorization to any workload, including custom mission applications.

### Continuous Monitoring and Logging: 
* UDS leverages tools like Prometheus and Grafana to monitor system health, performance, and security in real time. Alerts are triggered for any unusual activity or potential breaches.

### Runtime Security: 
* UDS integrates NeuVector to monitor container runtime behavior, detect and block anomalies, and enforce runtime application security policies.

### Identity and Access Management (IdAM): 
* Keycloak provides centralized authentication, enabling single sign-on (SSO) and role-based access control (RBAC) to restrict access to authorized users.

### Custom Resource Policies:
* [Pepr](https://pepr.dev/) enables the creation of type-safe policies and operators, ensuring security baselines are
enforced automatically within Kubernetes clusters.

### Software Composition Analysis:
* UDS continuously monitors the software supply chain, ensuring only verified components are deployed.

### Backup and Restore 
* Velero: Provides backup and restore functionality for Kubernetes resources and persistent data. This provides protectection of data and configurations, allowing for quick recovery in case of accidental deletion, data corruption, or system failures.*
