---
title: Deploying UDS on RKE2
sidebar:
  order: 5
tableOfContents:
  maxHeadingLevel: 3
---

This tutorial demonstrates how to deploy UDS onto a VM-based RKE2 Kubernetes cluster. This scenario is common in on-prem and airgap environments where cloud-based deployments are not feasible. 

:::caution
The deployment in this tutorial is designed specifically for development and testing environments and is *not intended for production use*.
:::

### Prerequisites

- Recommended [system requirements](https://uds.defenseunicorns.com/getting-started/basic-requirements/#system-requirements)
- Hypervisor for running VMs (recommend [Lima](https://lima-vm.io/))
- [UDS CLI](https://uds.defenseunicorns.com/reference/cli/overview/)

### Quickstart

The fastest way to get up and running with UDS Core on RKE2 is using the automation and configuration provided in the [uds-rke2-demo](https://github.com/defenseunicorns-labs/uds-rke2-demo) repo. Follow the instructions in the `README` to either provision a VM running RKE2 with UDS, or install UDS on an RKE2 cluster directly.

### Starting the VM and Installing RKE2

#### Lima (recommended)

Lima provides a template for quickly spinning up an Ubuntu VM running RKE2 with appropriate shared network configs, follow the instructions in [uds-rke2-demo](https://github.com/defenseunicorns-labs/uds-rke2-demo) to quickly get up and running. The [automation](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/303c146fffb9e6660e38902fa6ee4c8a8ca6e98d/tasks.yaml#L39) in the demo repo uses the following Lima command to provision an Ubuntu VM running RKE2:
```
if [[ "$(uname)" == "Darwin" ]]; then
  limactl start template://experimental/rke2 \
    --memory 20 --cpus 10 --vm-type=vz --network=vzNAT -y
else
  limactl start template://experimental/rke2 \
    --memory 20 --cpus 10 --vm-type=qemu -y
fi
```

After the VM has been created and RKE2 installed, ensure connectivity by setting the `KUBECONFIG`:

```
export KUBECONFIG="$HOME"/.lima/rke2/copied-from-guest/kubeconfig.yaml
```

Then run `kubectl get pods -A` to verify that the pods are running.

#### Other Hypervisors

##### VM Requirements

Aside from the system requirements mentioned in the prerequisites, you will need to provision a VM running a Linux instance [compatible with RKE2](https://docs.rke2.io/install/requirements#operating-systems). Additionally, this tutorial assumes the following network configuration:
- The VM has its own IP and is accessible to the host machine by both SSH and HTTPS
  - Recommend either a shared network or bridge setup (hypervisor port forwarding can also be useful but is often unnecessary)
- Ability to configure DNS resolution (often done by modifying `/etc/hosts`)


#### Installing RKE2

SSH into the newly created Linux VM and follow the [official quickstart](https://docs.rke2.io/install/quickstart) to install RKE2 on the VM. Note that this is a single server node setup, no need to add agent nodes.

After RKE2 is installed, ensure connectivity by running `kubectl get pods -A` and verifying that the native RKE2 pods are running. You may need to `export KUBECONFIG=/etc/rancher/rke2/rke2.yaml` (read the [official docs](https://docs.rke2.io/install/quickstart#server-node-installation)). Depending on your VM setup, it may be easier to run this command from the VM itself as opposed to the host machine. If running from the host machine, you will need to ensure the Kube API (port 6443) is exposed to the host.

### Bootstrapping the Cluster

In order to take advantage of the full range of capabilities UDS provides, the cluster must have the following prerequisites installed:

- Default Storage Class
- Load Balancer Controller
- Object Store

Each of these prereqs is covered in greater detail below.

:::note
The `uds-rke2-demo` repo contains a [zarf.yaml](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/main/zarf.yaml) that will install the necessary prereqs on your cluster.
:::

#### Default Storage Class

Since RKE2 does not ship with a `default` [storage class](https://kubernetes.io/docs/tasks/administer-cluster/change-default-storage-class/), you will need to install one. For demo purposes, we recommend using the [local-path-provisioner](https://github.com/rancher/local-path-provisioner) by Rancher.

#### Load Balancer Controller

Although RKE2 ships with an NGINX ingress controller, UDS uses Istio ingress gateways to logically separate admin traffic from other types of traffic coming into the cluster. Using Istio also ensures that traffic within the cluster is encrypted and all applications are integrated into a secure service mesh. More information can be found in the [UDS service mesh](https://uds.defenseunicorns.com/reference/configuration/service-mesh/ingress/) docs.

UDS ingress gateways are K8s `Services` of type `LoadBalancer`. In order to provide an IP to these load balancer services, a load balancer controller, such as [MetalLB](https://metallb.io/), must be installed. An example configuration for MetalLB can be found in the [demo repo](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/main/chart/templates/metallb.yaml). Note that the base IP used for the MetalLB `IPAddressPool` will come from the internal IP of the cluster nodes, and can be found with:
```
uds zarf tools kubectl get nodes -o=jsonpath='{.items[0].status.addresses[?(@.type=="InternalIP")].address}'
```

Note the [Zarf package](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/303c146fffb9e6660e38902fa6ee4c8a8ca6e98d/zarf.yaml#L30) in the demo repo configures this IP for you.

#### Object Store

The UDS log store ([Loki](https://github.com/grafana/loki)) uses object storage to store cluster logs. For demo purposes, we recommend installing [Minio](https://github.com/minio/minio) to provide object storage. Example Helm values for Minio can be found [here](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/main/values/minio-values.yaml).

Loki can be configured to use other buckets or storage providers by using UDS bundle overrides to configure the UDS Loki Helm chart [values](https://github.com/defenseunicorns/uds-core/blob/main/src/loki/values/values.yaml#L32).

#### Zarf

The [zarf init](https://docs.zarf.dev/ref/init-package/#_top) package will bootstrap your cluster and make it airgap-ready. This is typically included as part of the `uds-bundle.yaml` when installing UDS.

### Installing UDS

With all prerequisites satisfied, UDS is ready to be installed in the cluster. You can use the [automation](https://github.com/defenseunicorns-labs/uds-rke2-demo?tab=readme-ov-file#quickstart-rke2-already-running) in the demo repo to install UDS with a single command:

```
uds run install
```


Otherwise, a sample [uds-bundle.yaml](https://github.com/defenseunicorns-labs/uds-rke2-demo/blob/main/uds-bundle.yaml) is provided for reference and is partially shown below:

```
kind: UDSBundle
metadata:
  name: uds-rke2-demo
  description: A UDS bundle for deploying the standard UDS Core package on a development cluster
  version: "0.1.0"

packages:

  # prereq packages go here
  ...

  - name: init
    repository: ghcr.io/zarf-dev/packages/init
    ref: <latest>

  - name: core
    repository: ghcr.io/defenseunicorns/packages/uds/core
    ref: <latest>
    # additional configuration overrides go here
```

### Accessing UDS Apps

:::note
UDS web apps are protected by Keycloak. See the "Configuring Keycloak SSO" section below to create a user for demo purposes.
:::

After installing UDS Core, find the IPs of the Istio ingress gateway services. The following command run from the root of the [demo repo](https://github.com/defenseunicorns-labs/uds-rke2-demo) will show the ingress gateway IPs.
```
uds run get-gw-ips
```

You can also use the vendored `kubectl` to get the IPs:
```
# admin gateway ips (repeat for other gateways)
uds zarf tools kubectl get svc admin-ingressgateway -n istio-admin-gateway -o jsonpath='{.status.loadBalancer.ingress[0].ip}'
```

:::note
It takes a moment for MetalLB to assign IPs to the ingress gateway services, so the IP may not show up right away.
:::

After getting the IP, use `/etc/hosts` (or configure a DNS provider) to enable resolution of UDS Core app hostnames, for example:
```
# /etc/hosts

...
# admin apps use the admin-ingressgateway IP
192.168.64.200 keycloak.admin.uds.dev grafana.admin.uds.dev neuvector.admin.uds.dev

# tenant apps use the tenant-ingressgateway IP
192.168.64.201 sso.uds.dev podinfo.uds.dev

```

UDS Core apps should now be accessible via the host machine's web browser.

### Configuring Keycloak SSO

Keycloak is hardened by default and can be configured further as per the documentation in the [UDS IdAM](https://uds.defenseunicorns.com/reference/uds-core/idam/uds-identity-config-overview/) docs. To explore the demo environment, we recommend using the following command, ran from the root of the demo repo, to run a UDS task to create a user we can use to access UDS services:

```
uds run setup:keycloak-user --set KEYCLOAK_USER_GROUP="/UDS Core/Admin"
```

This will create an admin user with the following credentials:
```
username: doug
password: unicorn123!@#UN
role: /UDS Core/Admin
```

These credentials can be used to log into any of the apps in UDS.

### Integrating a Mission App

UDS uses a custom `Package` resource backed by a UDS K8s controller to automatically integrate and secure mission applications with minimal configuration. An example of such a configuration for the app [PodInfo](https://github.com/stefanprodan/podinfo) exists in the [demo repo](https://github.com/defenseunicorns-labs/uds-rke2-demo/tree/main/podinfo). It can be deployed into the UDS RKE2 cluster by running the following command from the root of the repo:

```
uds run deploy-podinfo
```

For a more in-depth explanation of `Package` resources, see the [Package CR](https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/) reference docs and the [Integrating an Application with UDS Core](https://uds.defenseunicorns.com/tutorials/create-uds-package/) tutorial.
