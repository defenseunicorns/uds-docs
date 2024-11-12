---
title: Bundling Your Application with UDS Core

sidebar:
  order: 3
---

## Add the Package Custom Resource to Podinfo Zarf Package

You may wish to always deploy your application as a fully integrated [UDS Package](https://uds.defenseunicorns.com/structure/packages/). In this section, we will cover adding the `podinfo-package.yaml` to the sample UDS Bundle that we created in the first tutorial. 

### Prerequisites
This guide assumes that you created the UDS `Package` Custom Resource in the previous tutorial. 

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
      - name: podinfo-uds-package
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

Re-run the `zarf package create` and `uds-create` commands to generate new artifacts that now include the `Package` Custom Resource for `podinfo`.