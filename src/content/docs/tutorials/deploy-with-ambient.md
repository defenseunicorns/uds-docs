---
title: Use Istio Ambient Mesh

sidebar:
  order: 4
---

The UDS Operator supports automatically integrating your application with Istio Ambient Mesh. It also supports automatically migrating your workfload from Istio Sidecars to Ambient mode if you are upgrading an existing application.

For the sake of this tutorial, we will cover migrating the podinfo application that was deployed in the previous tutorials to Ambient mode.

### Prerequisites
Istio Ambient Mode was added in UDS Core v0.40.0. Please ensure you are running at this version or higher before proceeding.

Run `zarf package list` and check the version number for the `core-base` package:
```bash
zarf package list
     Package | Version | Components
     core    | 0.42.0  | [uds-operator-config prometheus-operator-crds pepr-uds-core istio-controlplane gateway-api-crds istio-admin-gateway istio-tenant-gateway keycloak neuvector loki kube-prometheus-stack vector grafana authservice velero]
     init    | v0.42.2 | [zarf-injector zarf-seed-registry zarf-registry zarf-agent]
     uds-k3d | 0.14.0  | [destroy-cluster create-cluster uds-dev-stack]
     podinfo |         | [podinfo]
```

### Migrate Podinfo To Istio Ambient Mode
While not explicitly called out in the previous tutorials, the UDS Operator automatically handled setting up Istio injection for the podinfo application. The default method for Istio mesh integration in UDS is [Sidecar](https://istio.io/latest/docs/reference/config/networking/sidecar/). If you look at the podinfo application and its namespace, you will notice that the UDS Operator added the proper attributes for the workload to be recognized by istio and have sidecar injection enabled:

```bash
kubectl get ns podinfo --show-labels
NAME      STATUS   AGE     LABELS
podinfo   Active   2m   app.kubernetes.io/managed-by=zarf,istio-injection=enabled,kubernetes.io/metadata.name=podinfo

kubectl get pods -n podinfo
NAME                           READY   STATUS    RESTARTS   AGE
podinfo-5cbbf59f6d-bqhsk       2/2     Running   0          2m
```

By default, UDS Core ships with all required components to support both Istio Sidecar mode and Ambient mode starting in release v0.40.0 and onward. That means that migrating the podinfo to Istio Ambient mode is as simple as making a single change to the Package Custom Resource.

In the Package Custom Resource definition, add a new entry for `spec.network.serviceMesh.mode: ambient`:
```yaml
apiVersion: uds.dev/v1alpha1
kind: Package
metadata:
  name: podinfo
  namespace: podinfo
spec:
  network:
    # Configure Istio Mode - can be either ambient or sidecar. Default is sidecar.
    serviceMesh:
      mode: ambient
    # Expose rules generate Istio VirtualServices and related network policies
    expose:
      - service: podinfo
        selector:
          app.kubernetes.io/name: podinfo
        gateway: tenant
        host: podinfo
        port: 9898
  monitor:
    - selector:
        app.kubernetes.io/name: podinfo
      targetPort: 9898
      portName: http
      description: "podmonitor"
      kind: PodMonitor
    - selector:
        app.kubernetes.io/name: podinfo
      targetPort: 9898
      portName: http
      description: "svcmonitor"
      kind: ServiceMonitor
```

:::note
Authservice Clients are currently not supported in Ambient mode. As a result, the SSO configuration above was removed. You can track the status of this feature [here](https://github.com/defenseunicorns/uds-core/issues/1200).
:::

Save your changes and re-apply the Package Custom Resource.

Once applied, the UDS Operator will migrate the podinfo workload to Ambient mode by first updating the Istio label on the namespace:

```bash
kubectl get ns podinfo --show-labels
NAME      STATUS   AGE    LABELS
podinfo   Active   120m   app.kubernetes.io/managed-by=zarf,istio.io/dataplane-mode=ambient,kubernetes.io/metadata.name=podinfo
```

The `istio.io/dataplane-mode=ambient` label tells Istio that all workloads in the `podinfo` namespace will use Ambient mode.

Next, the operator performed a rolling restart of the podinfo application. This is required to decommission the sidecar that was previously present:
```bash
k get po -n podinfo
NAME                       READY   STATUS    RESTARTS   AGE
podinfo-86f5548c59-qnlmk   1/1     Running   0          8s
```

Notice how the pod only has a single container. The podinfo application has been successfully migrated to Ambient!

:::note
Learn more about the changes introduced in Ambient mode [here](https://istio.io/latest/docs/ambient/overview/).
:::

#### Clean up

Execute the following command to clean up your cluster:

```bash
k3d cluster delete uds
```