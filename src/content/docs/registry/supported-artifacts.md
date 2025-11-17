---
title: Supported Artifact Types

sidebar:
  order: 4
---

The following table describes Registry's current level of support for each well-known artifact type:

| Artifact Type | Pull and Push | Metadata in UI | SBOM scan | Vulnerability scan |
|-|-|-|-|-|
| Docker Images         | Yes | Yes | Coming Soon | Coming Soon |
| Helm Charts           | Yes | Yes | No | No |
| OpenTofu Modules      | Yes | Yes | No | No |
| OpenTofu Providers    | Yes | Yes | No | No |
| OCI Artifacts | Yes | Yes | No | No |
| OCI Images            | Yes | Yes | Coming Soon | Coming Soon |
| Zarf Packages         | Yes | Yes | Yes | Yes

Beyond the artifact types explicitly listed here, any artifact that is packaged according to the [Open Container Initiative (OCI) Image specification](https://github.com/opencontainers/image-spec) can be published into and pulled from UDS Registry using OCI-compliant tooling.
