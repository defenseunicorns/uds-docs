---
title: Overview
sidebar:
  order: 1
---

# UDS Registry

## What It Is
UDS Registry provides enterprise artifact storage and distribution for UDS bundles and packages.

## When to Use It
- Need centralized bundle/package distribution
- Require access control for artifacts
- Want artifact versioning and metadata

## Integration with UDS Core

### Publishing Bundles to Registry
Bundles created using UDS Core can be published to Registry:
```bash
uds create my-bundle
uds publish my-bundle.tar.zst oci://registry.example.com/bundles/my-bundle:v1.0.0
```

For more on creating bundles, see [UDS Core: How-To > Packaging Applications > Adding Packages to Bundles].

### Using Registry as Bundle Source
Configure UDS CLI to pull from Registry:
[Product-specific configuration]
