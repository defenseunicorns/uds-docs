---
title: Example CNCF App to UDS Package

sidebar:
  order: 2
---

## Deploy Harbor as UDS Package

This tutorial takes the CNCF Application, Harbor, and creates a Zarf Package, deploys it with Zarf, turns it into a UDS Package, deploys it with UDS, and then creates a UDS Bundle to deploy Harbor with an external Postgres.

### Audience

Operators

### Prerequisites

- [Zarf](https://docs.zarf.dev/getting-started/)
- [UDS CLI](https://uds.defenseunicorns.com/cli/)
- [Docker](https://www.docker.com/)
- [k3d](https://k3d.io/v5.6.0/)
- helm

### Background Knowledge

#### Key Terms & Concepts

- Flavor (in the context of UDS Packages)
- UDS Package is a directory containing multiple Zarf packages at where at least one of them
deploys the UDS 'package' k8s resource. -- A UDS Package is a Zarf Package made for UDS. This means it has a Package CR at minimum, and are generally setup to work in the UDS ecosystem. See TODO best practices document.
- OCI Registry and how it relates - all Zarf Packages and UDS Packages are stored via the same spec as a docker container, and so in registries meant for docker containers.

### Create Zarf Package to Deploy Harbor

#### Make a Directory

Make a new directory for this package using the following command:

```bash
mkdir package
```

Create the following `zarf.yaml` in the new directory:

```yaml
kind: ZarfPackageConfig
metadata:
  name: harbor
  version: 0.0.1
  architecture: amd64

components:
  - name: harbor
    required: true
    only:
      cluster:
        architecture: amd64
    charts:
      - name: harbor
        version: 1.15.0
        namespace: harbor
        url: https://helm.goharbor.io
    images:
      - goharbor/nginx-photon:v2.11.0
      - goharbor/harbor-portal:v2.11.0
      - goharbor/harbor-core:v2.11.0
      - goharbor/harbor-jobservice:v2.11.0
      - goharbor/registry-photon:v2.11.0
      - goharbor/harbor-registryctl:v2.11.0
      - goharbor/trivy-adapter-photon:v2.11.0
      - goharbor/harbor-db:v2.11.0
      - goharbor/redis-photon:v2.11.0
      - goharbor/harbor-exporter:v2.11.0
```

#### Create the Zarf Package

Run the following command in the same directory as the above `zarf.yaml`. This will create a Zarf Package named `zarf-package-harbor-amd64-0.0.1.tar.zst`:

```bash
zarf package create --confirm
```

#### Create the UDS Bundle

Create the UDS Bundle in the same directory as the `package` directory. The following bundle includes:

- k3d cluster:  `uds-k3d`.
- Zarf init package: `init`.
- UDS Core: `core`.
- Locally built example application: `harbor`.

Create the following `uds-bundle.yaml`:

```yaml
kind: UDSBundle
metadata:
  name: harbor-bundle
  description: Bundle with k3d, Zarf init, UDS Core, and harbor.
  architecture: amd64
  version: 0.0.1

packages:
  - name: uds-k3d
    repository: ghcr.io/defenseunicorns/packages/uds-k3d
    ref: 0.8.0

  - name: init
    repository: oci://ghcr.io/defenseunicorns/packages/init
    ref: v0.36.1

  - name: core
    repository: oci://ghcr.io/defenseunicorns/packages/uds/core
    ref: 0.26.0-upstream

  - name: harbor
    path: ./package/
    ref: 0.0.1
```

#### Create and Confirm the UDS Bundle

This process will take a few minutes while UDS CLI pulls down the images that will be deployed. This command will produce a UDS Bundle named `uds-bundle-harbor-bundle-amd64-0.0.1.tar.zst`:

```bash
uds create --confirm
```

#### Deploy

You can now deploy the bundle to create the k3d cluster in order to deploy UDS Core and `harbor`. This process can take a long time (over 30 minutes) to complete depending on available system resources:

```bash
uds deploy uds-bundle-harbor-bundle-amd64-0.0.1.tar.zst --confirm
```

#### Interact with Cluster (Optional)

Once successfully deployed, you have the option interact with the deployed cluster and applications using [kubectl](https://kubernetes.io/docs/tasks/tools/) or [k9s](https://k9scli.io/topics/install/). Please note that the output for your `harbor` pods will likely have a different name. Additionally, it is normal for some of the pods, especially core and jobservice, to have some restarts as they wait for other pods to complete their startup process:

```bash
kubectl get pods -n harbor
NAME                                 READY   STATUS    RESTARTS        AGE
harbor-core-7f6448f746-txzhf         1/1     Running   1 (8m15s ago)   11m
harbor-database-0                    1/1     Running   0               11m
harbor-jobservice-6679dfbb7f-x5kr7   1/1     Running   5 (7m39s ago)   11m
harbor-portal-7c5d84cbb8-qg4mb       1/1     Running   0               11m
harbor-redis-0                       1/1     Running   0               11m
harbor-registry-745ccc6bf4-65r5r     2/2     Running   0               11m
harbor-trivy-0                       1/1     Running   0               11m
```

Connect to `harbor` using `kubectl port-forward`:

```bash
kubectl port-forward -n harbor svc/harbor-portal <local_port>>:80
```

You can now use a web browser to naviage to `http://localhost:<local_port>` to interact with `harbor`.

#### Clean up

Execute the following command to clean up your cluster:

```bash
k3d cluster delete uds
```

#### Troubleshooting

Occasionally, some components of the deployment may require additional resources in order to launch successfully.  By using overrides, cpu and memory limits can be adjusted:

```yaml
kind: UDSBundle
metadata:
  name: harbor-bundle
  description: Bundle with k3d, Zarf init, UDS Core, and harbor.
  architecture: amd64
  version: 0.0.1

packages:
  - name: uds-k3d
    repository: ghcr.io/defenseunicorns/packages/uds-k3d
    ref: 0.8.0

  - name: init
    repository: oci://ghcr.io/defenseunicorns/packages/init
    ref: v0.36.1

  - name: core
    repository: oci://ghcr.io/defenseunicorns/packages/uds/core
    ref: 0.26.0-upstream
    overrides:
      pepr-uds-core:
        module:
          values:
            - path: "watcher.resources.limits.cpu"
              value: "1000m"
            - path: "admission.resources.limits.cpu"
              value: "1000m"
      keycloak:
        keycloak:
          values:
            - path: "resources.limits.cpu"
              value: "2000m"
            - path: "resources.limits.memory"
              value: "2Gi"

  - name: harbor
    path: ./package/
    ref: 0.0.1
```

Refer to the documentation for the respective helm charts for value paths and defaults


### Create UDS Package to Deploy Harbor

A UDS Package is made of one or more Zarf Packages.

Outside of the `package` resource type in k8s, there is no top-level UDS Package definition file. Just a bunch of zarf files. I'm really confused on this atm because I know I can create a UDS Package,
so there is some defining boundary there. But I'm really foggy on what it is.

### Create UDS Bundle to Deploy Harbor with External Postgres

A UDS Bundle is made of one or more UDS Packages. To use an external* Postgres with Harbor, we'l bring in another UDS Package and together form them into a bundle. We will
be using the [UDS Package Postgres Operator](https://github.com/defenseunicorns/uds-package-postgres-operator) which is encapsulating [Zalando's Postgres Operator](https://github.com/zalando/postgres-operator).

  > Note:
  > *external in the sense it is not what's bundled in the Harbor Helm Chart, it is still being deployed by UDS in Kubernetes

#### 1. Remove Postgres from Harbor UDS Package

We can remove the postgres image from the Harbor zarf.yaml file. Delete `goharbor/harbor-db` from the list of images.
This isn't strictly necessary but it'll keep our zarf package size down.

#### 2. Create UDS Bundle Directory and Files

To do this we'll create a new root level directory in our repo called `bundle/`:

```bash
mkdir -p bundle/
```

In this bundle we'll create two files with the following contents. Rather than walking through each configuration detail here and then pasting them into the file,
each configuration detail is explained in-line with YAML comments.

```yaml
# filename: bundle/uds-bundle.yaml
kind: UDSBundle
metadata:
  name: harbor-bundle  # Pick any name you like
  description: A UDS bundle for deploying Harbor and an external Postgres  # Describe it clearly
  version: 0.0.1-uds.0  # Increment this as you update the bundle

# Two packages, Harbor and the Postgres-Operator
packages:
  # We list the postgres operator first because the packages will be installed in order, and the DB
  # must be up before Harbor can succesfully install.
  
  # Determine the name, repository, and ref by inspecting the packages in the UDS Package repository:
  # https://github.com/defenseunicorns/uds-package-postgres-operator/pkgs/container/packages%2Fuds%2Fpostgres-operator
  - name: postgres-operator
    repository: ghcr.io/defenseunicorns/packages/uds/postgres-operator
    # Update this to be the latest postgres-operator release. Note the final part '-upstream' or '-registry1' selects the
    # image flavor. For simplicity, we recommend selecting upstream (i.e. the default image set).
    ref: 1.12.2-uds.2-upstream

  # Because we're in the Harbor UDS Package repository, we reference it by path instead of pulling it pre-built from an OCI registry
  - name: harbor
    path: ../
    # x-release-please-start-version
    ref: 0.1.0-uds.0
    # x-release-please-end

```

```yaml
# filename: bundle/uds-config.yaml

# This file will be very empty for now. It's actually recommended that as little as possible is done via uds-config Zarf variables.
variables:
  harbor: {}
```

These files as-is are incomplete. However, to keep learning chunks small, we'll go ahead and deploy what we have and watch it fail. This will provide a full iteration loop for the reader which should make it easier to comprehend the rest
of the tutorial and easier to troubleshoot in the event problems arise.

There are a number of commands to enter to build and deploy this bundle. During
ordinary UDS package and bundle development, these are encapsulated in UDS Tasks
and imported from [UDS-common](https://github.com/defenseunicorns/uds-common/tree/main).
For the sake of learning, we will be using the individual commands directly with
links to uds common where the most up-to-date version of the given step is maintained.

#### 3. Add a values.yaml file to the Harbor Zarf Package

There are a number of other customzations needed to get Harbor to work with UDS Core. Those settings are in
the values.yaml file below

```yaml
# TODO: paste it in here - ideally with collapsible enabled.
```

TODO: tell them somewhere that makes sense that we also need to remove the `goharbor/nginx-photon` image. B/c Istio.

#### 3. Setup Cluster w/ UDS Core

First, we need a K3D Cluster with UDS-core installed on it. If your cluster from earlier
is still running, you can reset it by running `kubectl delete namespace harbor` and skip
to the next step.

```bash
# Deploy UDS Core via UDS. UDS will automagically create a properly configured K3D cluster.
# https://github.com/defenseunicorns/uds-common/blob/main/tasks/setup.yaml#L19C14-L19C262
#
# Set CORE_VERSION to the latest from
# https://github.com/defenseunicorns/uds-core/pkgs/container/packages%2Fuds%2Fbundles%2Fk3d-core-slim-dev.
# TODO: do we want to pull 'latest' or explicitly version? Explicit versions may give
# snapshots in time where the tutorial worked, latest has all the typical challenges
# in debugging.
export CORE_VERSION=0.26.0
uds deploy oci://defenseunicorns/uds/bundles/k3d-core-slim-dev:latest --set INSECURE_ADMIN_PASSWORD_GENERATION=true --confirm --no-progress
# This command will take a good 10-20 minutes. Even though you're only installing the slimmed
# down copy of UDS Core, there's still a lot that's being loaded in. Go stretch your legs.

# Set your KUBECONFIG to point at the uds cluster so all your CLI tools know how to
# talk to it. Repeat the final `export` command in any new terminal.
#
# If you're going to be doing this often, Kubie can make this easier https://github.com/sbstp/kubie
# but it entirely unnecessary for this tutorial.
mkdir -p ~/.kube
k3d kubeconfig get uds > ~/.kube/uds.yaml
export KUBECONFIG=~/.kube/uds.yaml

# Test your connection to the cluster. If it fails, google 'KUBECONFIG' and 'k3d' to troubleshoot.
kubectl cluster-info
```

#### 4. Build the Bundle

We need to build the bundle.

```bash
# 1. Create Zarf Package (note Zarf is encapsulated in the UDS CLI tool)
# https://github.com/defenseunicorns/uds-common/blob/main/tasks/create.yaml#L20C12-L20C167
#
# It is not uncommon during this step to get WARNINGs about writing errors. These occur as Zarf downloads
# gobs of container images and caches them. As long as they are warnings not errors, you're fine.
uds zarf package create . --confirm --architecture=amd64 --flavor upstream

# 2. Build Bundle
# https://github.com/defenseunicorns/uds-common/blob/main/tasks/create.yaml#L42C13-L42C188
UDS_CONFIG=bundle/uds-config.yaml uds create bundle/ --confirm --no-progress --architecture=amd64
```

#### 5. Deploy Harbor and Postgres Bundle

We will deploy the bundle we've built to the K3D cluster with UDS Core pre-installed on it.

```bash
UDS_CONFIG=bundle/uds-config.yaml uds deploy bundle/uds-bundle-harbor-bundle-amd64-0.0.1-uds.0.tar.zst --confirm --no-progress
```

-----------------
We need to add a step now to build these dependencies.

We need to specify the location of the UDS Config file now

If you're updating a statefulset, heads up, you should scale it to 0 before you deploy unless you know enough to know
why you don't need to with your particular set of changes.
