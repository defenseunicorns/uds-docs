---
title: Deploy with UDS Core
type: docs
sidebar:
  order: 1
---

## Sample Application with UDS Core

This tutorial uses UDS CLI to deploy an example application, [podinfo](https://github.com/stefanprodan/podinfo), on top of UDS Core as a UDS Bundle.

### Prerequisites

- [Zarf](https://docs.zarf.dev/getting-started/)
- [UDS CLI](https://uds.defenseunicorns.com/cli/)
- [Docker](https://www.docker.com/)
- [k3d](https://k3d.io/v5.6.0/)

### Quickstart

To begin, a Zarf Package needs to be created for `podinfo`. See the [Zarf documentation](https://docs.zarf.dev/) for in-depth information on how to create a Zarf Package, or simply use the information provided below.

#### Make a Directory

Make a new directory for this package using the following command:

```bash
mkdir package
```

Create the following `zarf.yaml` in the new directory:

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

#### Create the Zarf Package

Run the following command in the same directory as the above `zarf.yaml`. This will create a Zarf Package named `zarf-package-podinfo-amd64-0.0.1.tar.zst`:

```bash
zarf package create --confirm
```

#### Create the UDS Bundle

Create the UDS Bundle in the same directory as the `package` directory. The following bundle includes:

- k3d cluster:  `uds-k3d`.
- Zarf init package: `init`.
- UDS Core: `core`.
- Locally built example application: `podinfo`.

Create the following `uds-bundle.yaml`:

```yaml
kind: UDSBundle
metadata:
  name: podinfo-bundle
  description: Bundle with k3d, Zarf init, UDS Core, and podinfo.
  architecture: amd64
  version: 0.0.1

packages:
  - name: uds-k3d
    repository: ghcr.io/defenseunicorns/packages/uds-k3d
    ref: 0.3.1
    overrides:
      uds-dev-stack:
        minio:
          variables:
            - name: buckets
              description: "Set Minio Buckets"
              path: buckets
            - name: svcaccts
              description: "Minio Service Accounts"
              path: svcaccts
            - name: users
              description: "Minio Users"
              path: users
            - name: policies
              description: "Minio policies"
              path: policies

  - name: init
    repository: oci://ghcr.io/defenseunicorns/packages/init
    ref: v0.32.1

  - name: core
    repository: oci://ghcr.io/defenseunicorns/packages/uds/core
    ref: 0.9.1-upstream

  - name: podinfo
    path: ./package/
    ref: 0.0.1
```

UDS Bundles can easily be configured to include additional applications and capabilities. For example, if you would like to deploy [dos-games](https://docs.zarf.dev/tutorials/3-deploy-a-retro-arcade/) instead of `podinfo`, in the `uds-bundle.yaml` simply replace:

```yaml
- name: podinfo
  path: ./package/
  ref: 0.0.1
```

with:

```yaml
- name: dos-games
  repository: oci://defenseunicorns/dos-games
  ref: 1.0.0
```

{{% alert-note %}}
Most UDS Packages are published as Zarf Packages in an OCI registry. This makes it easier to pull packages down into a UDS Bundle. If no OCI artifact is published for a certain application or capability, a new `zarf.yaml` and Zarf Package must be created. Alternatively, you have the option to publish a Zarf Package to an [OCI compliant registry](https://docs.zarf.dev/tutorials/6-publish-and-deploy/).
{{% /alert-note %}}

#### Create and Confirm the UDS Bundle

This process will take a few minutes while UDS CLI pulls down the images that will be deployed. This command will produce a UDS Bundle named `uds-bundle-podinfo-bundle-amd64-0.0.1.tar.zst`:

```bash
uds create --confirm
```

#### Deploy

You can now deploy the bundle to create the k3d cluster in order to deploy UDS Core and `podinfo`. This process will take approximately 5 to 10 minutes to complete:

```bash
uds deploy uds-bundle-podinfo-bundle-amd64-0.0.1.tar.zst --confirm
```

#### Interact with Cluster (Optional)

Once successfully deployed, you have the option interact with the deployed cluster and applications using [kubectl](https://kubernetes.io/docs/tasks/tools/) or [k9s](https://k9scli.io/topics/install/). Please note that the output for your `podinfo` pod will likely have a different name:

```bash
kubectl get pods -n podinfo
NAME                       READY   STATUS    RESTARTS   AGE
podinfo-67bf846d65-hrl59   1/1     Running   0          66s
```

Connect to `podinfo` using `kubectl port-forward`:

```bash
kubectl port-forward pod/<pod_name> <local_port>:9898
```

Example command using the above sample output from `get pods`:

```bash
kubectl port-forward pod/podinfo-67bf846d65-hrl59 9898:9898 -n podinfo
```

You can now use a web browser to naviage to `http://localhost:<local_port>` to interact with `podinfo`.

#### Clean up

Execute the following command to clean up your cluster:

```bash
k3d cluster delete uds
```
