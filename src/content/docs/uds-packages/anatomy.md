---
title: Anatomy

sidebar:
  order: 2
draft: true
---
<!-- Before going live, will need to remove this Anatomy Reference: https://uds.defenseunicorns.com/structure/packages/ -->

## Anatomy of a UDS Package Repository

The goal of this document is to cover the main components of a UDS Package and their functions at an overview level. It will then aim to show specifically how these components are tied together in the case of the [Reference Package](https://github.com/uds-packages/reference-package).

### Anatomy Overview

| Directory / Top-level file | Role | Function |
| :--- | :------------------------- | :------- |
| `.github/` | CI/CD | Directives to Reference Package, primarily it contains the build, test, and release pipeline(s). |
| `adr/` | Docs | "ADR" stands for Architectural Decision Records. These documents record key architectural decisions and their reasoning. |
| `bundle/` | Testing & Development | Utilizes [Bundle Overrides](https://uds.defenseunicorns.com/structure/bundles/), in order to bring in other applications, such as a database, in order to test the package configuration. The `bundle/` directory in a UDS Package repo is utilized specifically for other applications and dependencies required to test the UDS Package. It is important to note, that when the UDS Package is created, the `bundle/` directory is not included. |
| `chart/` | UDS Package Component | Directory for the `uds-config` chart and supplemental resources. This includes at minimum the [UDS Package Custom Resource](https://uds.defenseunicorns.com/reference/configuration/custom-resources/packages-v1alpha1-cr/), in the `uds-package.yaml`. This directory is also used for any custom helm templates that need to be created, such as a [postgres database secret](https://github.com/uds-packages/reference-package/blob/main/chart/templates/postgres-secret.yaml).
| `common/` | UDS Package Component | This directory holds a single `zarf.yaml` file. This file is imported by the root-level `zarf.yaml`. It is is used to support multiple [UDS Package Flavors](https://uds.defenseunicorns.com/overview/acronyms-and-terms/#flavor-as-in-uds-package-or-bundle-flavor). It pulls in the  shared [values/common-values.yaml](https://github.com/uds-packages/reference-package/blob/main/values/common-values.yaml), to apply values across all flavors. The separate flavor specific application values can be found in the root-level [zarf.yaml](https://github.com/uds-packages/reference-package/blob/3f54b283890b8ed8b441c559d007b6652f676eae/zarf.yaml#L39C18-L39C19)|
| `docs/` | Docs | Documentation about the UDS Package. This can include things such as `configuration` docs. |
| `tasks/` | Testing & Development | An extension of the tasks ran by the Maru Runner as shown below in the `tasks.yaml` section. These extended tasks typically hold tasks to execute automated testing, or to run required dependencies. |
| `tests/` | Testing & Development | Contains files which are used to verify the application in a UDS Package is properly integrated with UDS Core and any specified dependencies. The tests are integration-level tests focused on validating connections between the application and the UDS ecosystem. |
| `values/` | UDS Package Component | Contains all the helm `values.yaml` files, required for the main application's helm chart. This directory typically contains a `common-values.yaml`, which pertains to all flavors, as well as, specific flavors files, named `<flavor>-values.yaml`, for each flavor required in the UDS Package. |
| `tasks.yaml` | Testing & Development | Entrypoint for utilizing workflows for UDS Package integration. [UDS Runner Tasks](https://uds.defenseunicorns.com/reference/cli/uds-runner/) perform workflows such as `run`, `deploy`, `test`, to execute a series of tasks. Visit [UDS Common](https://github.com/defenseunicorns/uds-common/blob/main/tasks.yaml) for a list of commonly used tasks. |
| `zarf.yaml` | UDS Package Component | The primary Zarf Config to define the overall UDS Package. Defines all top-level Zarf variables, and includes components for every required `flavor`. Each component imports the `common/zarf.yaml` file. 
