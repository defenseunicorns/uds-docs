---
title: Install and Deploy UDS (15m)

sidebar:
  order: 2
---

## Getting Started with UDS Bundles

UDS Core provides published [bundles](https://uds.defenseunicorns.com/bundles/) that serve multiple purposes: you can 
utilize them for experimenting with UDS Core or for UDS Package development when you only require specific components 
of UDS Core. These bundles leverage [UDS K3d](https://github.com/defenseunicorns/uds-k3d) to establish a local k3d 
cluster.

UDS Bundles deployed for development and testing purposes are comprised of a shared configuration that equips users with
essential tools, emulating a development environment for convenience. If deploying to a production environment, users 
have the ability to modify variables and configurations to best fit specific mission needs by creating their own bundle.

:::caution
These UDS Bundles are designed specifically for development and testing environments and are *not intended for production use*. Additionally, they serve as examples for creating customized bundles.
:::

For additional information on UDS Bundles, please see the [UDS Bundles](/structure/bundles/) page.

## Deploy UDS Core

In this section, you will deploy UDS Core for the first time.

**Step 1: Install the [UDS CLI](https://uds.defenseunicorns.com/cli/)**

The very first step is installation of the UDS CLI. Having installed Homebrew previously, you can do so with the
following command:

```git
brew tap defenseunicorns/tap && brew install uds
```

:::tip
You can see all releases of the UDS CLI on the 
[UDS CLI GitHub repository](https://github.com/defenseunicorns/uds-cli/releases)
:::

**Step 2: Deploy the UDS Bundle**

The UDS Bundle being deployed in this example is the 
[`k3d-core-demo`](https://github.com/defenseunicorns/uds-core/blob/main/bundles/k3d-standard/README.md) bundle, which 
creates a local k3d cluster with UDS Core installed.

To deploy this bundle, run the `uds deploy k3d-core-demo:X.X.X` command in the terminal, replacing the "X" with the 
current release. 
For example, if the current release is `0.26.0`:

```cli
uds deploy k3d-core-demo:0.26.0

# deploy this bundle?
y
```

:::note
You can view all versions of the package 
[here](https://github.com/defenseunicorns/uds-core/pkgs/container/packages%2Fuds%2Fbundles%2Fk3d-core-demo).
:::

**Optional:**

Use the following command to visualize resources in the cluster via [k9s:](https://k9scli.io/)

```git
uds zarf tools monitor
```

**Step 3: Clean Up**

Use the following command to tear down the k3d cluster:

```git
k3d cluster delete uds
```

If you opted to use Colima, use the following command to tear down the virtual machine that the cluster was running on:

```git
colima delete -f
```

## UDS Bundle Development

In addition to the demo bundle, there is also a 
[`k3d-slim-dev bundle`](https://github.com/defenseunicorns/uds-core/tree/main/bundles/k3d-istio) designed specifically 
for working with UDS Core with *only* Istio, Keycloak, and Pepr installed. To use it, execute the following command:

:::note
Again, be sure to specify the version. The latest version as of this writing is 0.26.0. You can view all versions of the
package [here](https://github.com/defenseunicorns/uds-core/pkgs/container/packages%2Fuds%2Fbundles%2Fk3d-core-slim-dev).
:::

```cli
uds deploy k3d-core-slim-dev:X.X.X
```

## Developing UDS Core

UDS Core development leverages the `uds zarf dev deploy` command. To simplify the setup process, a dedicated UDS Task is available. Please ensure you have [NodeJS](https://nodejs.org/en/download/) version 20 or later installed before proceeding.

Below is an example of the workflow developing the [metrics-server package](https://github.com/defenseunicorns/uds-core/tree/main/src/metrics-server):

```cli
# Create the dev environment
uds run dev-setup

# If developing the Pepr module:
npx pepr dev

# If not developing the Pepr module (can be run multiple times):
npx pepr deploy

# Deploy the package (can be run multiple times)
uds run dev-deploy --set PKG=metrics-server
```

## Testing UDS Core

You can perform a complete test of UDS Core by running the following command:

```cli
uds run test-uds-core
```

This command initiates the creation of a local k3d cluster, installs UDS Core, and executes a set of tests identical to those performed in CI. If you wish to run tests targeting a specific package, you can utilize the `PKG` environment variable.

The example below runs tests against the metrics-server package:

```cli
UDS_PKG=metrics-server uds run test-single-package
```

:::note
You can specify the `--set FLAVOR=registry1` flag to test using Iron Bank images instead of the upstream images.
:::
