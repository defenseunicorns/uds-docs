---
title: Use Istio Ambient Mesh

sidebar:
  order: 4
---

The UDS Operator supports automatically integrating your application with Istio Ambient Mesh. It even supports automically migrating your workfload from Istio Sidecars to Ambient mode if you are updating an existing application.

For the sake of this tutorial, we will cover migrating the podinfo application that was deployed in the previous tutorials to Ambient mode.

### Prerequisites
Istio Ambient Mode was added in UDS Core v0.40.0. Please ensure you are running at this version or higher before proceeding.

