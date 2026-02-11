---
title: Getting Started

sidebar:
  order: 2
---
### Explore Our Public Registry

[registry.defenseunicorns.com](https://registry.defenseunicorns.com/) is a hosted instance of UDS Registry and is **free to try**. It is the easiest way to explore UDS packages and see how the registry works. There are two main organizations to explore, each serving different purposes for package distribution and evaluation.

- **[Airgap Store](https://registry.defenseunicorns.com/org/airgap-store/packages)** - lists all UDS Packages published by Defense Unicorns. All packages in this organization are view-only: you can access configuration, SBOM and vulnerability data, but you cannot pull or deploy a package directly from this organization.
- **[Public](https://registry.defenseunicorns.com/org/public/packages)** - contains public packages that can be pulled and deployed.

**Create a free account** at [registry.defenseunicorns.com/sign-in](https://registry.defenseunicorns.com/sign-in) for additional benefits:
- Gain access to our public organization and download related packages at no cost
- Create and manage tokens for automated package retrieval and CI/CD integration

### Deploy Your Own Registry
UDS Registry is Airgap native and can be self hosted! [Contact us](https://defenseunicorns.com/registry-inquiry) to get access to the UDS Registry package.


Deploy the UDS Registry package in your [UDS Bundle](https://uds.defenseunicorns.com/reference/bundles/overview/), see the [UDS Registry Configuration Guide](/registry/configuration) for more details.

```yaml
# Example: uds-bundle.yaml
kind: UDSBundle
metadata:
  name: registry
  description: A UDS bundle for deploying UDS Registry package
  version: dev
packages:
  - name: uds-registry
    path: "path/to/uds-registry/package"
    ref: 0.0.1
    overrides:
      uds-registry:
        uds-registry:
          values:
            # List of orgs that can be accessed without authentication in the UI, but no implicit access to OCI endpoints
            - path: registry.auth.publicOrgs.metadataAccess
              value:
                - view-only
            # List of orgs that can be accessed without authentication in the UI, but still require authentication for OCI endpoints
            - path: registry.auth.publicOrgs.readAccess
              value:
                - public
            # Specify initial admin users
            - path: registry.auth.access.admins
              value:
                - admin-user@defenseunicorns.com
```

## Support
For assistance with the UDS Registry, contact the UDS support team at hello@defenseunicorns.com or through the internal support channels.