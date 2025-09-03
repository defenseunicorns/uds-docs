---
title: Getting Started

sidebar:
  order: 2
---
### Explore Our Public Registry
- View the Public Unicorn Registry - [UDS Registry](https://registry.defenseunicorns.com/)
- Create a free [account](https://registry.defenseunicorns.com/sign-in)
  - **Free account benefits:**
    - Gain access to our public organization, and download related packages at no cost.
    - Create and manage tokens for automated package retrieval and CI/CD integration.
- Browse available packages and explore registry features without authentication
  - [Airgap Store](https://registry.defenseunicorns.com/org/airgap-store/packages) - lists all UDS Packages published by Defense Unicorns. All packages in this organization are view-only: you can access configuration, SBOM and vulnerability data, but you cannot pull or deploy a package directly from this organization.
  - [Public](https://registry.defenseunicorns.com/org/public/packages) - contains public packages that can be pulled and deployed.

### Deploy Your Own Registry
- [Contact us](https://defenseunicorns.com/registry-inquiry) to get access to the UDS Registry package.
- Use the UDS Registry package in your [UDS Bundle](https://uds.defenseunicorns.com/reference/bundles/overview/)
- [UDS Registry Configuration Guide](/registry/configuration)

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

**[Contact us](https://defenseunicorns.com/registry-inquiry) for more information on how UDS Registry can accelerate your mission!**

## Related Documentation
[Why UDS](https://uds.defenseunicorns.com/overview/why-uds/)<br>
[Mission and Technical Relevance](https://uds.defenseunicorns.com/overview/uds-mission-relevance/)<br>
[UDS Packages](https://uds.defenseunicorns.com/structure/packages/)<br>
[UDS Security Overview](https://uds.defenseunicorns.com/security/overview/)<br>
[Published Package Flavors](https://uds.defenseunicorns.com/reference/deployment/flavors/)<br>

## Support
For assistance with the UDS Registry, contact the UDS support team at hello@defenseunicorns.com or through the internal support channels.