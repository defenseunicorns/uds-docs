---
title: Troubleshooting

draft: true
---

The below are troubleshooting methods for commonly found roadblocks.

### Package "Stuck" in deploying state
It's possible that a UDS Package can appear to be stalled on a deployment. We will cover one simple scenario that may be possible to get caught up in.

The below screenshot is a standard terminal that has been on the same task for several minutes.


It's common in troubleshooting to want to view `pods` or `deployment` in the cluster, but the information is not always present.
In these instances, it's best to look at `events` in the namespace for your package to determine what is happening.
In the screenshot example above, the UDS Package named `reference-package` is stuck on deployment. 

To get event's in the cluster, the below command was run:
> !Tip
> If you are not comfortable with kubectl commands, this can also be accomplished by using K9s or uds zarf tools monitor.

```sh
kubectl get events -n reference-package
```

Result
```sh
LAST SEEN   TYPE      REASON              OBJECT                                    MESSAGE
8m26s       Warning   FailedCreate        replicaset/reference-package-674cc4c88b   Error creating: admission webhook "pepr-uds-core.pepr.dev" denied the request: Pod level securityContext does not meet the non-root user requirement.
```

This result message shows us that `pepr` is blocking the request because the securityContext in the application helm chart was set to run as root.

To remedy this, you would update your `common-values.yaml`. You can find an example below of what this MAY look like, but you will need to consult the application helm chart you are working with.
```yaml
podSecurityContext:
  runAsUser: 1000
  runAsGroup: 1000
  fsGroup: 1000

securityContext:
  capabilities:
    drop:
    - ALL
  readOnlyRootFilesystem: true
  runAsNonRoot: true
  allowPrivilegeEscalation: false
```

### Bundled Package not communicating with primary package
This issue occurs whenever a dependency is pulled into a UDS Bundle `uds-bundle`, and forgetting to create a network policy using the `network.allow` keys in the `uds-package.yaml`



### How can I remove a package from the cluster?
- Packages can be listed with [zarf package list](https://docs.zarf.dev/commands/zarf_package_list/)
- Packages can be removed with [zarf package remove](https://docs.zarf.dev/commands/zarf_package_remove/)


### Helm Debugging
During the debugging process, being familiar with Helm can be a very valuable resource. The following helm commands can be useful while troubleshooting.

- If you have a helm template you believe is not configured properly: `helm template`
- `helm show values` - If you want to view an upstream chart `Values.yaml` locally, try the following commands:

The below command can be ran as an example

```sh
helm show values oci://ghcr.io/uds-packages/reference-package/helm/reference-package
```

### Kubernetes
- [Kubernetes Troubleshooting Clusters Guide](https://kubernetes.io/docs/tasks/debug/debug-cluster/)
- [Kubernetes Troubleshooting Applications Guide](https://kubernetes.io/docs/tasks/debug/debug-application/)

### UDS Tasks

### These are actual questions I have been asked by developers (multiple times)
- Helm template commands to ensure YAML is valid: `helm template chart chart --debug`

- My package won't deploy. How do I know what to look for in the cluster?
    - Events
    - Statefulset
    - Pods
    - Deployment
    - Service
    - Maybe find and link a general Helm / K8s troubleshooting guide

- I created a new package and am deploying a dependency for it in a bundle. How can I make the two apps communicate with each other? 
    - show how to add netpols / how to troubleshoot in cluster

- how can I remove a package from a cluster? do I have to redeploy the entire cluster?
    - zarf package list
    - zarf package remove

- making sure the proper uds tasks are being ran
- deleting zarf / uds cache
