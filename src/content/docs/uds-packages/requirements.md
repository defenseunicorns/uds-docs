---
title: Requirements

sidebar:
  order: 1
draft: true
---

This document describes the standards for UDS Package Requirements. This is not a _guide_ on how to create a UDS Package, but instead a list of requirements for a UDS Package to be properly and confidently integrated and operated in production environments.

:::note
This document follows [RFC-2119](https://datatracker.ietf.org/doc/html/rfc2119) for definitions of requirement levels (e.g. must, should and may).
:::

:::note
For a `Markdown` version of this that is easy to copy, see here.
:::

### Requirements for all UDS Package Integrators
- [ ]  **Must** be declaratively defined as a [Zarf package](https://docs.zarf.dev/ref/create/).
- [ ]  **Must** minimize the scope and number of exemptions, to only what is absolutely required by the application. UDS Packages may make use of the [UDS Exemption custom resource](https://uds.defenseunicorns.com/reference/configuration/uds-operator/exemption/) for exempting any Pepr policies, but in doing so they **Must** document rationale for the exemptions. Exemptions should be documented in `docs/justifications.md` of the UDS Package repository.
- [ ]  **Must** declaratively implement any available application hardening guidelines by default (Example: [GitLab Hardening guidelines](https://docs.gitlab.com/ee/security/hardening.html)).
- [ ]  **Must** define network policies under the `allow` key as required in the [UDS Package Custom Resource](https://uds.defenseunicorns.com/reference/configuration/uds-operator/package/#example-uds-package-cr). These policies must adhere to the principle of least privilege, permitting only strictly necessary traffic.
- [ ]  **Must** use and create a Keycloak client through the `sso` key for any UDS Package providing an end User Login. [SSO Resource](https://uds.defenseunicorns.com/tutorials/create-uds-package/#integrate-with-single-sign-on)
- [ ]  **Must** (except if the application provides no application metrics) implement monitors for each application metrics endpoint using it's built-in chart monitors, `monitor` key, or manual monitors in the config chart. [Monitor Resource](https://uds.defenseunicorns.com/reference/configuration/observability/monitoring-metrics/)
- [ ]  **Must** integrate declaratively (i.e. no clickops) with the UDS Operator.
- [ ]  **Must** define any external interfaces under the `expose` key in the [UDS Package Custom Resource](https://uds.defenseunicorns.com/reference/configuration/uds-operator/package/#example-uds-package-cr).
- [ ]  **Must** deploy and operate successfully with Istio enabled. (links to Ambient and Sidecar)
- [ ]  **Must** implement Journey testing, covering the basic user flows and features of the application. (see [Testing Guidelines](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/guidelines/testing-guidelines.md))
- [ ]  **Must** implement Upgrade Testing to ensure that the current development package works when deployed over the previously released one. (see [Testing Guidelines](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/guidelines/testing-guidelines.md))
- [ ]  **Must** be capable of operating within an airgap (internet-disconnected) environment.
- [ ]  **Must** be versioned using the UDS Package [Versioning scheme](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/requirements/uds-package-requirements.md#versioning).
- [ ]  **Must** contain documentation under a `docs` folder at the root that describes how to configure the package and outlines package dependencies.
- [ ]  **Must** not use local commands outside of `coreutils` or `./zarf` self references within  `zarf actions`.
- [ ]  **Must** not rely on exposed interfaces (e.g., `.uds.dev`) being accessible from the deployment environment (bastion or pipeline).
- [ ]  **Must** include application [metadata for UDS Registry](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/guidelines/metadata-guidelines.md) publishing.
- [ ]  **Should** use Istio Ambient unless specific technical constraints require otherwise.
- [ ]  **Should** avoid workarounds with Istio such as disabling strict mTLS peer authentication.
- [ ]  **Should** expose all configuration (`uds.dev` CRs, additional `Secrets`/`ConfigMaps`, etc) through a Helm chart (ideally in a `chart` or `charts` directory).
    > This allows UDS bundles to override configuration with Helm overrides and enables downstream teams to fully control their bundle configurations.
- [ ]  **Should** implement or allow for multiple flavors (ideally with common definitions in a common directory).
    > This allows for different images or configurations to be delivered consistently to customers.
- [ ]  **Should** consider security options during implementation to provide the most secure default possible (i.e. SAML w/SCIM vs OIDC).
- [ ]  **Should** name the Keycloak client `<App> Login` (i.e. `Mattermost Login`) to provide login UX consistency.
- [ ]  **Should** clearly mark the Keycloak client id with the group and app name `uds-<group>-<application>` (i.e. `uds-swf-mattermost`) to provide consistency in the Keycloak UI.
- [ ]  **Should** limit the use of Zarf variable templates and prioritize configuring packages via Helm value overrides.
    > This ensures that the package is configured the same way that the bundle would be and avoids any side effect issues of Zarf's `###` templating.
- [ ]  **May** use Istio Sidecars, when Istio Ambient(Insert link here to “Should use Ambient” section) is not technically feasible. Must document in the specific technical restraints in `docs/justifications.md` if using Sidecars.
- [ ]  **May** template network policy keys to provide flexibility for delivery customers to configure.
- [ ]  **May** end any generated Keycloak client secrets with `sso` to easily locate them when querying the cluster.
- [ ]  **May** template Keycloak fields to provide flexibility for delivery customers to configure.
- [ ]  **Should** be created from the [UDS Package Template](https://github.com/uds-packages/template).
- [ ]  **Should** lint their configurations with appropriate tooling, such as [`yamllint`](https://github.com/adrienverge/yamllint) and [`zarf dev lint`](https://docs.zarf.dev/commands/zarf_dev_lint/).

### Requirements Specific to Internal Unicorn Engineers
- [ ] **Must** be actively maintained by the package maintainers identified in CODEOWNERS [see #CODEOWNERS section for more information](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/requirements/uds-package-requirements.md#codeowners)
- [ ] **Must** have a dependency management bot (such as renovate) configured to open PRs to update the core package and support dependencies.
- [ ] **Must** release its package to the ghcr.io/uds-packages/<group> namespace as the application's name (i.e. ghcr.io/uds-packages/nexus).
