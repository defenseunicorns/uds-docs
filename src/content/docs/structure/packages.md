---
title: UDS Packages
description: UDS Package Reference
sidebar:
  order: 3
---

A UDS Package is a [Zarf Package](https://docs.zarf.dev/ref/packages/) with two additions:

1. It is meant to be deployed on top of [UDS Core](core.md).
2. It contains the UDS Package Kubernetes custom resource.

These packages include all the [OCI images](https://opencontainers.org/) (docker containers), [Helm charts](https://circleci.com/blog/what-is-helm/#:~:text=A%20Helm%20chart%20is%20a,up%20your%20application%20as%20needed.), and supplemental Kubernetes manifests required for the app to communicate with UDS core. The UDS Operator in turn auto-applies appropriate security and network policies to assure a secure and compliant running environment. A UDS package _does not_ include dependencies like databases or object storage*. These external dependencies are deployed next to a UDS Package inside a [UDS Bundles](bundles.md).

To move from the theoretical to the concrete, see the next section on the Anatomy of a UDS Package Repo.

## Anatomy of a UDS Package Repo

_Disclaimer: the exact file structure of UDS Packages is subject to change. This document will fall out of date but should retain conceptual accuracy. After understanding this point-in-time snapshot of how a UDS package is built, it should be fairly trivial to extend that knowledge to grasp UDS packages as improved in the interim. To aid in it's utility as a teaching tool, links to source code are pinned to ensure a 1:1 match between code referenced here, and code visible to the reader._

<!-- WARNING: if UDS Packages are ever made private this document needs substantially re-written as most links will break for readers. -->

For an in-depth developer-focused treatment of UDS Packages, see [the documentation in GitHub](https://github.com/defenseunicorns/uds-common/blob/main/docs/uds-packages/guide.md). You can also view the UDS package template [in GitHub here](https://github.com/defenseunicorns/uds-package-template/tree/main). This document will go over the main components of a UDS package and their functions at an over-view level, and then show specifically how these components are tied together in the case of GitLab.

### Anatomy Overview

| Directory / Top-level file | Role | Function |
| :--- | :------------------------- | :------- |
| `.github/` | CI/CD | Directives to GitLab, primarily it contains the build, test, and release pipeline(s). |
| `adr/` | Docs | `adr` stands for Architectural Decision Records. These documents record key architectural decisions and their reasoning. |
| `bundle/` | Testing & Development | When you're testing a UDS Package, you need to be able to deploy it with other applications such as databases in order to test your configuration. The `bundle/` directories in a UDS Package repo (they never enter the package itself) are for just that. They deploy light-weight databases, key-value stores, and object stores as needed alongside the application to permit testing. They also serve as an example of how to use the UDS Package in a bundle. |
| `charts/` | UDS Package Component | This is for helm charts which are created supplementally to the application. This includes at minimum the UDS Package manifest and the SAML/OIDC configuration for automatic integration with our Keycloak SSO application (which is part of UDS-core). Not infrequently it will also include another resource or two as needed to fully integrate into the UDS ecosystem on an app-specific basis.
| `common/` | UDS Package Component | This directory holds a single `zarf.yaml` file which is the base Zarf package definition. It is imported by the top-level `zarf.yaml`. You can think of it like the parent-class object in an object-oriented-programming model. This generally pulls the charts from the `charts/` directory and the main application's helm chart into the Zarf package but leaves [flavor]() specific details out. |
| `docs/` | Docs | Documentation about the UDS Package. |
| `src/` | Testing & Development | This contains plain kubernetes resource manifests with a zarf.yaml package in each leaf-directory. These are never made into a part of the UDS Package. Rather, they are included in the test bundle to help glue the application to the larger ecosystem.
| `tasks/` | Testing & Development | These tasks run via the [UDS CLI](https://github.com/defenseunicorns/uds-cli) which uses the [maru task runner](https://github.com/defenseunicorns/maru-runner) under the surface to perform workflows like "build, deploy, test" (normally called `dev`) or "publish built artifact". These tasks are a mixture of bespoke repo-specific tasks and included tasks from the [uds-common repo](https://github.com/defenseunicorns/uds-common/tree/main/tasks). The entrypoint to these tasks is the top-level `tasks.yaml` file which is to the UDS CLI what a [Makefile](https://www.gnu.org/software/make/manual/make.html#Simple-Makefile) is to [GNU make](https://www.gnu.org/software/make/manual/make.html). These tasks are also called as part of the CI/CD pipeline defined under `.github/`.
| `tests/` | Testing & Development | This contains files related to the playbook tests which are used to verify that the application in a UDS Package appears to be working as configured in the test bundle (in `bundle/`). These tests are integration-level tests focused on validating connections between the application and the UDS ecosystem.
| `values/` | UDS Package Component | This directory typicaly contains four helm `values.yaml` files which are fed into the main application's helm chart to configure it. Of note, the `common-values.yaml` file typically contains all typical values and the `<flavor>-values.yaml` files contain the image URLs for the given value and any configuration changes required to make it work with this specific [flavor](../overview/acronyms-and-terms.md#flavor-as-in-uds-package-or-bundle-flavor) of images. |
| _misc top-level files_ | Licensing, tool configurations, etc. | Most of the top-level files are self-explanatory or largely irrelevant to most users. The remainder of this table will include only the most important ones. |
| `tasks.yaml` | Testing & Development | As mentioned when discussing the `tasks/` directory. This file defines all tasks accessible to the command `uds run <task>`. View them by running `uds run --list`. |
| `uds-config.yaml` | Testing & Development | This uds-config file is fed into the test bundle at deploy time to set Zarf and UDS variables. |
| `zarf.yaml` | UDS Package Component | This is _the_ Zarf package which is in this case also a UDS Package. If this were a code repository, this file would be the `main` function. It defines all top-level Zarf variables, and then includes one component per flavor, each component importing the `common/zarf.yaml` package. Each component (which stands for a package flavor) adds the `values/<flavor>-values.yaml` file to set the images to the desired flavor in the helm chart and lists the needed images so Zarf can pull them down and add them to the package at build time. These components are turned on or off by the "flavor" variable value at build time producing only one of the components at any time in the final UDS Package.

### GitLab's UDS Package Anatomy

GitLab is the cornerstone application in the UDS Software Factory. It has a mature UDS Package with a [public repo on Defense Unicorn's GitHub](https://github.com/defenseunicorns/uds-package-gitlab). This dive into UDS Package anatomy is using the repo specifically as it existed as of [v17.3.6-uds.1](https://github.com/defenseunicorns/uds-package-gitlab/tree/v17.3.6-uds.1).

#### GitLab's UDS Package Components

Starting with [`common/zarf.yaml`](https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/common/zarf.yaml) we have the base [`ZarfPackageConfig`](https://docs.zarf.dev/ref/packages/#zarfpackageconfig). It is reprinted in abbreviated form below with comments added for clear in-line explanation.

```yaml
kind: ZarfPackageConfig  # A UDS Package is just a kind of Zarf Package
metadata:
  name: gitlab-common
  description: "UDS GitLab Common Package"

# Recall later that all three helm charts below are part of a single zarf component, GitLab.
components:
  - name: gitlab
    required: true
    charts:  # These charts are deployed in the order listed, use this to your advantage

      # Adds SSO, postgre, and redis auth secrets which are expected (required) by the main app
      # (if missing, will break the deployment). Also includes the UDS Package resource which makes
      # this Zarf Package also a UDS Package.
      - name: uds-gitlab-config
        namespace: gitlab
        version: 0.2.0
        localPath: ../charts/config   # Note the filepath, this references charts/config
      # The GitLab application
      - name: gitlab
        namespace: gitlab
        url: https://charts.gitlab.io/  # The upstream helm chart. Note the repo url given is NOT
                                        # the git repo which is https://gitlab.com/gitlab-org/charts/gitlab.
                                        # Googling can be required to connect a helm chart repo
                                        # to it's source code repo. Some UDS Packages will use
                                        # the Big Bang helm chart instead, or, rarely, a Defense
                                        # Unicorns produced helm chart.
        gitPath: chart
        version: "8.5.1"
        valuesFiles:
          - ../values/common-values.yaml  # Note we pull in the common values file. The top-level 
                                          # zarf.yaml will add overrides for the desired flavor.

      # If you inspect https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/charts/settings/templates/_settings-pod.tpl
      # you will see this chart creates a job that further configures GitLab in ways that could not
      # be done via Helm at deploy-time.
      - name: uds-gitlab-settings
        namespace: gitlab
        version: 0.1.0  # These "helper" charts rarely change version. Often, they are forever
                        # this version 0.1.0.
        localPath: ../charts/settings  # Note the filepath, this references charts/settings
    actions:
      onDeploy:
        after:
          ...
          # multiple zarf jobs to ensure each part of GitLab is happy after deployment
```

If we go now to the top-level [zarf.yaml](https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/zarf.yaml) file we can see the [Zarf variables](https://docs.zarf.dev/ref/values/) and [flavors](../overview/acronyms-and-terms.md#flavor-as-in-uds-package-or-bundle-flavor) get added in.

```yaml
kind: ZarfPackageConfig  # As before, a UDS Package is just a Zarf Package with particular contents
metadata:
  name: gitlab
  description: "UDS GitLab Package"
  version: "17.3.6-uds.1"  # As mentioned earlier, this document is locked to a specific version for consistency.

# These variables are given values within the UDS ecosystem in one of two ways: either they are given a value in
# the UDS bundle definition (if the correct value can be known at bundle build time) or in the UDS configuration
# (use only if the correct value cannot be known until deploy time).
variables:
  - name: DOMAIN
    default: "uds.dev"
  - name: BUCKET_PREFIX  # Incidentally, buckets refer to object storage such as S3.
    default: "uds-"
  - name: BUCKET_SUFFIX
    default: ""
  - name: GITLAB_REDIS_ENDPOINT  # Redis is always replaced with valkey in a UDS deployment
    default: ""
  - name: GITLAB_REDIS_SCHEME
    default: "redis"
  - name: GITLAB_DB_NAME  # This refers to the Postgresql db. Often is off-cluster though we support on-cluster.
    default: "gitlabdb"
  - name: GITLAB_DB_USERNAME
    default: "gitlab"
  - name: GITLAB_DB_ENDPOINT
    default: "postgresql"
  - name: GITLAB_PAGES_ENABLED  # A GitLab documentation feature
    default: "false"
  - name: GITLAB_SIGNUP_ENABLED  # A GitLab feature related account creation
    default: "true"
  - name: DISABLE_REGISTRY_REDIRECT  # See descriptions for helpful info when more context is needed
    default: "false"
    description: "If your storage endpoint is not publicly accessible set this to true"

components:
  # For each component, notice the "only" keyword and how each component requires a 
  # different flavor. Consequently, only one of the following components are included.
  # Notice too, that each one imports the gitlab component from the common/zarf.yaml
  # file discussed above, and so automatically includes both "helper" charts (from charts/).

  # Registry1 flavor as shown by the 'only' block.
  - name: gitlab
    required: true
    description: "Deploy gitlab with registry1 images"
    import:
      path: common  # The crucial import
    only:
      flavor: registry1  # This is the Ironbank flavor
      cluster:
        architecture: amd64  # The architecture _must_ be amd64 because Ironbank does not have 
                             # all the ARM-based images required for GitLab.
    charts:
      - name: gitlab
        valuesFiles:
          - values/registry1-values.yaml  # Add the registry1-values.yaml file to further configure the chart and
                                          # override values in the values/common-values.yaml file if necessary.
      - name: uds-gitlab-settings
        valuesFiles:
          # Because the gitlab settings setting job runs in an image, also grab the ironbank 
          # version of the required image. See:
          # https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/charts/settings/values.yaml#L8
          - values/registry1-values.yaml
    images:
      # Here we list all the images referenced in the values.yaml files. This is how Zarf knows
      # which images to pull down, package with the helm charts & manifests, and deploy to the
      # image registry it will put in-cluster (this is part of how it enables air-gapped 
      # deployments). List abbreviated for space. For more, see:
      # https://docs.zarf.dev/ref/components/#container-images
      - "registry1.dso.mil/ironbank/gitlab/gitlab/certificates:17.3.6"
      ...
      - "registry1.dso.mil/ironbank/gitlab/gitlab/gitlab-exporter:17.3.6"

  # Upstream flavor as shown by the 'only' block.
  - name: gitlab
    required: true
    description: "Deploy gitlab"
    import:
      path: common  # The crucial import again
    only:
      flavor: upstream  # This component is what we get if flavor is upstream.
      # Note no processor architecture restrictions. The upstream Gitlab registry has ARM-based images.
    charts:
      - name: gitlab
        valuesFiles:
          - values/upstream-values.yaml  # Using the upstream values file.
      - name: uds-gitlab-settings
        valuesFiles:
          - values/upstream-values.yaml  # Handing upstream image values similarly to the settings chart
    images:
      # The upstream image URLs, again abbreviated for the sake of space.
      - "registry.gitlab.com/gitlab-org/build/cng/certificates:v17.3.6"
      ...
      - "registry.gitlab.com/gitlab-org/build/cng/gitlab-exporter:v17.3.6"

  # Unicorn flavor as shown by the 'only' block.
  - name: gitlab
    required: true
    description: "Deploy gitlab with chainguard images"
    import:  # See this
      path: common
    only:
      flavor: unicorn  # See this
    charts:
      - name: gitlab
        valuesFiles:
          - values/unicorn-values.yaml  # See this
      - name: uds-gitlab-settings
        valuesFiles:
          - values/unicorn-values.yaml  # And this
    images:
      # And finally the chainguard OCI image URLs 
      - "cgr.dev/du-uds-defenseunicorns/gitlab-certificates-fips:17.3.6"
      ...
      - "cgr.dev/du-uds-defenseunicorns/gitlab-exporter-fips:17.3.6"
```

#### GitLab's Testing & Development

As explained in the [anatomy overview](#anatomy-of-a-uds-package), the [bundle/](https://github.com/defenseunicorns/uds-package-gitlab/tree/v17.3.6-uds.1/bundle) directory contains a bundle using the GitLab UDS Package and serves two functions. First, it provides a way to deploy and test GitLab as configured by the UDS Package. Second, like any good test, it is a form of documentation showing how Gitlab may be connected into a bundle.

Bundle files get larger than the `zarf.yaml` files previously explored so this one will be more severely abbreviated.
 
[uds-bundle.yaml](https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/bundle/uds-bundle.yaml) excerpts:
```yaml
kind: UDSBundle
metadata:
  name: gitlab-test
  description: A UDS bundle for deploying Gitlab and it's dependencies on a development cluster
  version: 17.3.6-uds.1

# A UDS Bbundle contains many UDS Packages. UDS Bundles never contain other bundles.
packages:
  # This provides object storage with the AWS S3 API in-cluster. While useful for development
  # and testing, this service is often provided by an off-cluster service in large deployments.
  # Repo behind the package: https://github.com/defenseunicorns/uds-package-minio-operator
  - name: dev-minio
    repository: ghcr.io/defenseunicorns/packages/uds/dev-minio
    ref: 0.0.2

  # This is a bit of an odd duck. We create the namespace for GitLab ahead of time so if we run
  # `zarf package remove gitlab` we don't lose the namespace. This keeps secrets generated by
  # applications like postgres around so the re-deployed GitLab package can still discover how
  # to authenticate with these services. This is frequently helpful.
  - name: dev-namespace
    path: ../  # Note the path, when `uds run dev` is executed, one of the build jobs will put
               # the built zarf package defined in src/namespace/zarf.yaml in the root directory.
               # This path anticipates this fact as the bundle is built after the zarf packages
               # are built.
    ref: 0.1.0

  # This provides a postgres database in cluster.
  # Repo behind the package: https://github.com/defenseunicorns/uds-package-postgres-operator
  - name: postgres-operator
    repository: ghcr.io/defenseunicorns/packages/uds/postgres-operator
    ref: 1.13.0-uds.2-upstream
    overrides:
      postgres-operator:
        uds-postgres-config:
          values:
            - path: postgresql
              value:
                enabled: true
                teamId: "uds"
                volume:
                  size: "10Gi"
                numberOfInstances: 2
                users:
                  gitlab.gitlab: []  # heads up, usernames are always namespace.app
                databases:
                  gitlabdb: gitlab.gitlab
                version: "14"
                ingress:
                  - remoteNamespace: gitlab

  # This is our Redis replacement because it's totally open source.
  # Repo behind the package: https://github.com/defenseunicorns/uds-package-valkey
  - name: valkey
    repository: ghcr.io/defenseunicorns/packages/uds/valkey
    ref: 7.2.7-uds.0-upstream
    overrides:
      valkey:
        uds-valkey-config:
          values:
            - path: custom
              value:
                - direction: Ingress
                  selector:
                    app.kubernetes.io/name: valkey
                  remoteNamespace: gitlab
                  port: 6379
                  description: "Ingress from GitLab"
            - path: copyPassword  # Note this is how we get the access secret where GitLab expects it.
              value:
                enabled: true
                namespace: gitlab
                secretName: gitlab-redis
                secretKey: password

  # This puts a secret in the gitlab namespace containing access information for MinIO (S3 mimic)
  # It's in src/dev-secrets in the GitLab repo.
  - name: dev-secrets
    path: ../
    ref: 0.1.0
  
  # This is where we add the GitLab UDS Package to the bundle. Recall that it had two charts included:
  # - https://github.com/defenseunicorns/uds-package-gitlab/tree/v17.3.6-uds.1/charts
  # - https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/common/zarf.yaml#L14
  # - https://github.com/defenseunicorns/uds-package-gitlab/blob/v17.3.6-uds.1/common/zarf.yaml#L25
  - name: gitlab
    # Note that the path for the GitLab Zarf package (which is a UDS package) is '../' same as for
    # the dev-secret package because all zarf packages are built before the bundle is built, and put
    # in the repo's root dir.
    path: ../ 
    ref: 17.3.6-uds.1  # FYI: versions tend to be <application version>-uds.<uds release of that version>
    overrides:
      gitlab:
        # This is the chart in `charts/` which we're configuring here.
        # Notice how we can hardcode a value to a path (under values:) OR we can add a variable and assign
        # it to a path (everything under variables). These variables can be overriden at deploy-time via entries
        # in the uds-config.yaml. Creating variables in your bundle is a super powerful way to expose parts of
        # the underlying helm chart for deploy-time configuration. Full lists and dictionaries can be given as
        # a variable value too, so it's very maleable.
        uds-gitlab-config:
          values:
            - path: ssh.enabled
              value: true
            - path: ssh.port
              value: 2223
          variables:
            - name: GITLAB_SSO_ENABLED
              description: "Boolean to enable or disable sso things"
              path: "sso.enabled"
              ...
            - name: GITLAB_REQUIRED_GROUPS
              description: "Array of group names that are required for GitLab acess."
              path: "sso.requiredGroups"
        gitlab:
          values:
            - path: gitlab.gitlab-shell.enabled
              value: true
            - path: global.shell.port
              value: 2223
            # The hostname is known after deploying it once and from knowing the namespace we're
            # putting the operator in.
            - path: global.psql.host
              value: pg-cluster.postgres.svc.cluster.local
            # The username is known from the yaml above. As warned there too, don't try to get
            # away from the app.app usernames, or, if you're having problems, try app.namespace.
            # See postgre operator package docs for more here, if you can avoid changing it, you'll
            # avoid a set of problems.
            - path: "global.psql.username"
              value: "gitlab.gitlab"
            # These hard-coded values are known via experience combined with what's given to the
            # postgres operator above. The name of the secret the operator creates is predictable.
            - path: "global.psql.password.secret" 
              value: "gitlab.gitlab.pg-cluster.credentials.postgresql.acid.zalan.do"
            # This hostname is known based on experience (deploying once and seeing what the service
            # name was) and knowing the namespace the valkey package is deploying too.
            - path: global.redis.host
              value: valkey-master.valkey.svc.cluster.local
          variables:
            - name: GITLAB_SSO_ENABLED
              description: "Boolean to enable or disable sso things"
              path: "global.appConfig.omniauth.enabled"
              ...
            - name: SHELL_REPLICAS
              description: "Gitlab Shell Min Replicas"
              path: "gitlab.gitlab-shell.minReplicas"
        uds-gitlab-settings:  
          values:
            - path: settingsJob.application.enabled_git_access_protocol
              value: all
          variables:
            - name: BOT_ACCOUNTS
              description: "Bot Accounts to Create"
              path: "botAccounts"
```

## Footnotes

*object storage is the type of storage most commonly associated with AWS' S3 service. In Azure it's called Blob Storage, in Kubernetes it is typicaly MinIO, and it goes by various other names in other storage platforms.
