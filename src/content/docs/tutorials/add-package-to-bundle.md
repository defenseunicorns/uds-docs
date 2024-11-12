---
title: Adding UDS Configuration to a Zarf Package

sidebar:
  order: 3
---

To consider `podinfo` as a fully integrated [UDS Package](https://uds.defenseunicorns.com/structure/packages/), the `Package` Custom Resource for the UDS Operator must be included as part of the Zarf Package for `podinfo`. In this section, we will cover adding the `podinfo-package.yaml` to the sample UDS Bundle that we created in the [first](/tutorials/deploy-with-uds-core) tutorial. 

### Prerequisites
This guide assumes that you created the UDS `Package` Custom Resource in the [previous](/tutorials/create-uds-package) tutorial. 

### Adding Package Manifest to Podinfo

Within the `zarf.yaml` file that exists in the `package` directory, modify the `podinfo` component to reference the manifest created in the previous tutorial:'

```yaml
kind: ZarfPackageConfig
metadata:
  name: podinfo
  version: 0.0.1

components:
  - name: podinfo
    required: true
    charts:
      - name: podinfo
        version: 6.4.0
        namespace: podinfo
        url: https://github.com/stefanprodan/podinfo.git
        gitPath: charts/podinfo
    manifests:
      - name: podinfo-uds-config
        namespace: podinfo
        files:
          - podinfo-package.yaml
    images:
      - ghcr.io/stefanprodan/podinfo:6.4.0
    actions:
      onDeploy:
        after:
          - wait:
              cluster:
                kind: deployment
                name: podinfo
                namespace: podinfo
                condition: available
```

Re-run the `zarf package create` and `uds create` commands to generate new artifacts that now include the `Package` Custom Resource for `podinfo`. From there, the bundle can be re-deployed and `podinfo` will be automatically integrated with UDS Core.

#### Clean up

Execute the following command to clean up your cluster:

```bash
k3d cluster delete uds
```