---
title: Overview

sidebar:
  order: 1
draft: true
---

## Package Integration
The following documents are created for a UDS Package Integrator, this being the developer or engineer responsible for bringing an application into the UDS ecosystem. As an integrator, the focus will be taking an existing application, turning it into a UDS-compatible artifact, and ensuring it deploys, runs, and behaves correctly within UDS workflows.

UDS Packages are developed against the UDS platform, leveraging tools and patterns that make integration repeatable and consistent. In practice this means creating a package repository that conforms to UDS standards, uses common tooling to build and test artifacts, and integrates with the UDS runtime environment and operator automation. The resources listed here are starting points to reference routinely through the UDS Package integration process.  ￼

## Package Integration Resources
This below is a collection of documentation, repositories, and tooling that are commonly useful when building, testing, and publishing UDS Packages.

- [UDS Core](https://github.com/defenseunicorns/uds-core) - The platform baseline UDS Packages are designed to deploy on top of (includes the operator/policy engine behavior packages integrate with).
- [UDS Package Custom Resource reference](https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/) ￼- Schema/behavior details for the UDSPackage resource used by packages to integrate with UDS Core.  ￼
- [UDS Common](https://github.com/defenseunicorns/uds-common/blob/main/README.md) - UDS Package Framework to assist in package integration.
- [Maru Runner](https://github.com/defenseunicorns/maru-runner) - Task runner that enables developers to automate builds and perform common shell tasks.
- [UDS Package Template](https://github.com/uds-packages/template) - Template to assist in creating a UDS package. 
- [Reference Package](https://github.com/uds-packages/reference-package) - Sample UDS Package that can serve to show what a UDS package may look like. 
- [UDS CLI](https://uds.defenseunicorns.com/reference/cli/overview/)
- [Zarf](https://docs.zarf.dev/getting-started/)
