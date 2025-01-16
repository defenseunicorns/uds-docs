---
title: Exemption and Package Updates (5m)

sidebar:
  order: 1
---


## Exemptions and Package Updates in the Cluster

This guide provides steps to debug issues with `Exemptions` and `Packages` not being applied or updated in your Kubernetes cluster. Common symptoms include:
- Changes to Exemptions or Packages are not reflected in the cluster.
- Expected behavior in workloads remains unaffected.
- Logs indicate potential Kubernetes Watch failures.

Follow this guide to identify and resolve these issues.

## Initial Checklist

Before diving into detailed debugging, ensure the following:

- **Verify Configuration**:
   - Ensure that Exemptions and Packages are defined correctly in your manifests.
   - Refer to the specification documents for correct schema and examples:
     - [Packages Specification](https://github.com/defenseunicorns/uds-core/blob/main/docs/reference/configuration/custom%20resources/packages-v1alpha1-cr.md)
     - [Exemptions Specification](https://github.com/defenseunicorns/uds-core/blob/main/docs/reference/configuration/custom%20resources/exemptions-v1alpha1-cr.md)

- **Namespace for Exemptions**:
   - Ensure Exemptions are applied in the `uds-policy-exemptions` namespace.

- **Cluster and Deployment Status**:
   - Confirm the cluster and relevant controller deployments are running without errors: 
      ```bash
        kubectl get pods -n pepr-system
      ```

## Troubleshooting Kubernetes Watch

Kubernetes Watch is a mechanism used to monitor resource changes in real-time. Failures in Watch can cause Exemptions and Package updates to not propagate.

### Steps to Check Watch Logs

1. **Identify the Controller Pod**:
   - Check the logs of the controller managing Exemptions using the following command:
     ```bash
     kubectl logs -n pepr-system -l app -f | egrep "Processing exemption"
     ```

   - If the logs **do not show entries similar to the following**, it may indicate that the Watch missed the event:
     ```json
     {"...":"...", "msg":"Processing exemption nvidia-gpu-operator, watch phase: MODIFIED"}
     ```

2. **Verify Package Processing**:
   - Use the following command to check logs for Package processing:
     ```bash
     kubectl logs -n pepr-system -l app -f | egrep "Processing Package"
     ```

   - If the logs **do not show entries similar to the following**, it may indicate an issue with the Watch:
     ```json
     {"...":"...","msg":"Processing Package authservice-test-app/mouse, status.phase: Pending, observedGeneration: undefined, retryAttempt: undefined"}
     {"...":"...","msg":"Processing Package authservice-test-app/mouse, status.phase: Ready, observedGeneration: 1, retryAttempt: 0"}
     ```

3. **Common Watch Issues**:
   - If no logs are produced:
     - Check for Kubernetes API Server for throttling or timeouts in the logs.

## Related Links

- [Packages Specification](https://github.com/defenseunicorns/uds-core/blob/main/docs/reference/configuration/custom%20resources/packages-v1alpha1-cr.md)
- [Exemptions Specification](https://github.com/defenseunicorns/uds-core/blob/main/docs/reference/configuration/custom%20resources/exemptions-v1alpha1-cr.md)
- [Kubernetes Watch](https://kubernetes.io/docs/reference/using-api/api-concepts/#efficient-detection-of-changes)
