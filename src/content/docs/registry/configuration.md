---
title: Configuration Guide

sidebar:
  order: 3
---

This document provides a comprehensive overview of all configuration options available in the UDS Registry Helm chart.

:::tip
UDS Registry uses sensible defaults, most deployments will need to only require a minimal set of configuration.
:::

## Table of Contents

- [Configuration Parameters](#configuration-parameters)
- [Configuration Examples](#configuration-examples)

## Configuration Parameters

<div class="configuration-tables">

<style>
.configuration-tables table {
    border-collapse: collapse !important;
}
.configuration-tables table tr {
    border-bottom: 1px solid #4b5563 !important;
}
.configuration-tables table thead tr {
    border-bottom: 2px solid #4b5563 !important;
}
.configuration-tables table th:nth-child(1),
.configuration-tables table th:nth-child(2),
.configuration-tables table td:nth-child(1),
.configuration-tables table td:nth-child(2) {
    white-space: nowrap !important;
    min-width: max-content !important;
}
</style>

### Basic Configuration <small>[(example)](#basic-development-setup)</small>

| Parameter | Default | Description |
|-----------|---------|-------------|
| `replicaCount` | `1` | Number of registry replicas to deploy |

### Image Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `image.repository` | `ghcr.io/defenseunicorns/uds-registry` | Container image repository |
| `image.tag` | `0.20.1` | Container image tag |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy |

### Package Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `package.gateway` | `tenant` | Gateway configuration for the package |
| `package.host` | `registry` | Hostname for the registry service |
| `package.domain` | `###ZARF_VAR_DOMAIN###` | Domain name (uses Zarf variable) |
| `package.useRootDomain` | `false` | Use root domain instead of subdomain |
| `package.serviceMeshMode` | `ambient` | Service mesh mode configuration |

### Resource Configuration <small>[(example)](#basic-development-setup)</small>
:::Note
Default resource values are suitable for uds-core only. Increase for production workloads.
:::
| Parameter | Default | Description |
|-----------|---------|-------------|
| `resources.requests.memory` | `128Mi` | Memory request |
| `resources.requests.cpu` | `250m` | CPU request |
| `resources.limits.memory` | `1Gi` | Memory limit |
| `resources.limits.cpu` | `750m` | CPU limit |

### Storage Configuration <small>[(example)](#basic-development-setup)</small>
:::Note
Two storage backends are available:
- **filesystem** - Uses persistent volumes for storage
- **s3** - Uses S3-compatible object storage
:::
:::Important
When `haDatabase` is enabled:
- `ociStorage` must be set to `s3`
- Database PVC creation is disabled
- External database must be configured via `database.connectionString`
:::

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `ociStorage` | `filesystem` | `filesystem`, `s3` | Storage backend for OCI artifacts |
| `haDatabase` | `false` | - | Enable HA database (requires S3 storage) |

### Registry Configuration <small>[(example)](#filesystem-storage-configuration)</small>

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `registry.logging.level` | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` | Log level |

### Authentication Configuration <small>[(example)](#authentication-and-session-configuration)</small>

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.access.admins` | `["admin"]` | List of initial admin usernames |
| `registry.auth.publicOrgs.metadataAccess` | `["public"]` | Organizations with UI access (no OCI access) |
| `registry.auth.publicOrgs.readAccess` | `["library"]` | Organizations with UI access (auth required for OCI) |
| `registry.auth.webSession.duration` | `8h` | User session duration |
| `registry.auth.personalTokens.defaultExpiry` | `720h` | Default token expiry (30 days) |
| `registry.auth.personalTokens.maxExpiry` | `4320h` | Maximum token expiry (180 days) |
| `registry.auth.serviceTokens.defaultExpiry` | `1440h` | Default token expiry (60 days) |
| `registry.auth.serviceTokens.maxExpiry` | `8760h` | Maximum token expiry (365 days) |

### Scanner Configuration <small>[(example)](#scanner-configuration)</small>

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.scanner.enabled` | `true` | Enable vulnerability scanning |
| `registry.scanner.updateInterval` | `12h` | Scanner database update interval |
| `registry.scanner.scanInterval` | `24h` | Image scanning interval |

### Feature Flags <small>[(example)](#feature-flags-configuration)</small>

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.features.registryAnalytics` | `false` | Enable registry analytics |
| `registry.features.servePrivate` | `true` | Serve private repositories |

### Database Persistence

| Parameter | Default | Description |
|-----------|---------|-------------|
| `persistence.database.pv.storageClassName` | `""` | Storage class (empty = default) |
| `persistence.database.pv.accessModes` | `["ReadWriteOnce"]` | Access modes |
| `persistence.database.pv.size` | `256Mi` | Storage size |
| `persistence.database.pv.annotations` | `{}` | Persistent volume annotations |
| `persistence.database.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | Persistent volume finalizers |
| `persistence.database.pv.existingClaim` | `""` | Use existing PVC |
| `persistence.database.pv.extraPvcLabels` | `{}` | Extra PVC labels |

### Registry Persistence

| Parameter | Default | Description |
|-----------|---------|-------------|
| `persistence.registry.pv.storageClassName` | `""` | Storage class (empty = default) |
| `persistence.registry.pv.accessModes` | `["ReadWriteOnce"]` | Access modes |
| `persistence.registry.pv.size` | `10Gi` | Storage size |
| `persistence.registry.pv.annotations` | `{}` | Persistent volume annotations |
| `persistence.registry.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | Persistent volume finalizers |
| `persistence.registry.pv.existingClaim` | `""` | Use existing PVC |
| `persistence.registry.pv.extraPvcLabels` | `{}` | Extra PVC labels |

### Distribution Configuration <small>[(example)](#filesystem-storage-configuration)</small>
:::Important
Set a secure random string for production deployments to ensure consistency across replicas.
:::

| Parameter | Default | Description |
|-----------|---------|-------------|
| `distribution.http.secret` | `""` | HTTP secret for upload resumption |
| `distribution.storage.filesystem.rootDirectory` | `/app/data/registry` | Root directory for registry data |

### S3 Storage Configuration <small>[(example)](#s3-storage-configuration)</small>

| Parameter | Default | Required | Description |
|-----------|---------|----------|-------------|
| `distribution.storage.s3.region` | `us-west-1` | Yes | AWS region |
| `distribution.storage.s3.regionEndpoint` | `""` | No | Custom S3 endpoint |
| `distribution.storage.s3.bucket` | `uds-registry` | Yes | S3 bucket name |
| `distribution.storage.s3.rootDirectory` | `registry` | No | Root directory in bucket |
| `distribution.storage.s3.secure` | `false` | No | Use HTTPS |
| `distribution.storage.s3.v4Auth` | `true` | No | Use AWS Signature Version 4 |
| `distribution.storage.s3.chunkSize` | `5242880` | No | Chunk size for multipart uploads |
| `distribution.storage.s3.multipartCopyChunkSize` | `33554432` | No | Chunk size for multipart copy |
| `distribution.storage.s3.multipartCopyMaxConcurrency` | `100` | No | Max concurrency for multipart copy |
| `distribution.storage.s3.multipartCopyThresholdSize` | `33554432` | No | Threshold for multipart copy |
| `distribution.storage.s3.storageClass` | `STANDARD` | No | S3 storage class |
| `distribution.storage.s3.keyId` | `""` | No | AWS access key ID |
| `distribution.storage.s3.accessKey` | `""` | No | AWS secret access key |
| `distribution.storage.s3.sessionToken` | `""` | No | AWS session token |

### Database Configuration <small>[(example)](#database-examples)</small>

<div class="database-config-table">
<style>
.database-config-table table th:nth-child(1),
.database-config-table table th:nth-child(2),
.database-config-table table th:nth-child(3),
.database-config-table table td:nth-child(1),
.database-config-table table td:nth-child(2),
.database-config-table table td:nth-child(3) {
    white-space: nowrap !important;
    min-width: max-content !important;
}
</style>

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `database.type` | `sqlite3` | `sqlite3`, `postgres` | Database type |
| `database.connectionString` | `file:./db/registry.sqlite?_pragma=foreign_keys(1)` | - | Database connection string |

</div>

### Security Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `serviceAccount.annotations` | `""` | Service account annotations |
| `podSecurityContext.runAsUser` | `65532` | User ID to run pods |
| `podSecurityContext.runAsGroup` | `65532` | Group ID to run pods |
| `podSecurityContext.fsGroup` | `65532` | Filesystem group ID |
| `containerSecurityContext.runAsUser` | `65532` | User ID for containers |
| `containerSecurityContext.runAsGroup` | `65532` | Group ID for containers |

</div>

## Configuration Examples

### Basic Development Setup

```yaml
replicaCount: 1
ociStorage: "filesystem"
haDatabase: false
resources:
  requests:
    memory: "128Mi"
    cpu: "250m"
  limits:
    memory: "1Gi"
    cpu: "750m"
```

### Database Examples

**SQLite (Default):**

```yaml
database:
  type: sqlite3
  connectionString: "file:./db/registry.sqlite?_pragma=foreign_keys(1)"
```

**PostgreSQL for Production:**

```yaml
database:
  type: postgres
  connectionString: "postgres://user:password@host:5432/dbname?sslmode=require"
```

### Filesystem Storage Configuration

```yaml
# Basic filesystem storage with logging
distribution:
  version: "0.1"
  storage:
    filesystem:
      rootdirectory: "./data/registry"
  http:
    secret: "my-cool-secret"

logging:
  level: "INFO"
```

### S3 Storage Configuration

```yaml
# S3 storage with comprehensive settings
distribution:
  version: "0.1"
  storage:
    s3:
      region: "us-east-1"
      bucket: "uds-registry"
      accesskey: "${AWS_ACCESS_KEY}"
      secretkey: "${AWS_SECRET_KEY}"
      # Optional: Custom S3 endpoint for S3-compatible storage
      # regionendpoint: "https://custom.s3.endpoint"
      # forcepathstyle: true
      # encrypt: true
      # rootdirectory: "/registry"
      # storageclass: "STANDARD"
      # secure: true
    cache:
      blobdescriptor: "inmemory"
```

### Authentication with OpenID Connect

```yaml
# OIDC authentication configuration
auth:
  sso:
    issuer: "https://sso.uds.dev/realms/uds"
    clientId: "uds-registry"
    clientSecret: "your-client-secret"
    callbackUrl: "https://registry.example.com/uds/auth/callback"
    # Optional: Custom scopes and claims
    # scopes:
    #   - "openid"
    #   - "profile"
    #   - "email"
    # claims:
    #   username: "preferred_username"
    #   email: "email"
    #   name: "name"
    #   groups: "groups"
```

### Authentication and Session Configuration

```yaml
# Authentication, token management, and session settings
auth:
  webSession:
    duration: "8h"
    cookieDomain: "example.com"
  publicOrgs:
    # Organizations with UI access (no OCI access)
    metadataAccess:
      - "public"
    # Organizations with UI access (auth required for OCI)
    readAccess:
      - "defenseunicorns"
  access:
    admins:
      - "admin@example.com"
  personalTokens:
    defaultExpiry: "168h"  # 7 days
    maxExpiry: "4320h"     # 180 days
  serviceTokens:
    defaultExpiry: "168h"  # 7 days
    maxExpiry: "4320h"     # 180 days
```

### Scanner Configuration

```yaml
# Vulnerability scanner settings
scanner:
  enabled: true
  updateInterval: "6h"
  scanInterval: "1h"  # More frequent for dev/test (default: 24h)
```

### Feature Flags Configuration

```yaml
# Enable/disable registry features
features:
  servePrivate: true
  registryAnalytics: false
  strictPackageValidation: true
```

### Production Setup with S3 and HA

```yaml
replicaCount: 3
ociStorage: "s3"
haDatabase: true
resources:
  requests:
    memory: "512Mi"
    cpu: "500m"
  limits:
    memory: "2Gi"
    cpu: "1000m"
distribution:
  http:
    secret: "your-secure-random-string"
  storage:
    s3:
      region: "us-east-1"
      bucket: "my-registry-bucket"
      accessKey: "your-access-key"
      secretKey: "your-secret-key"
database:
  type: "postgres"
  connectionString: "postgres://user:password@db-host:5432/registry"
```

### Complete Configuration Example

```yaml
# Comprehensive configuration combining multiple aspects
distribution:
  version: "0.1"
  storage:
    s3:
      region: "us-east-1"
      bucket: "production-registry"
      accesskey: "${AWS_ACCESS_KEY}"
      secretkey: "${AWS_SECRET_KEY}"
      encrypt: true
      storageclass: "STANDARD"
    cache:
      blobdescriptor: "inmemory"
  http:
    secret: "production-secret-key"

auth:
  sso:
    issuer: "https://sso.company.com/realms/production"
    clientId: "uds-registry-prod"
    clientSecret: "${OIDC_CLIENT_SECRET}"
    callbackUrl: "https://registry.company.com/uds/auth/callback"
  webSession:
    duration: "8h"
    cookieDomain: "company.com"
  publicOrgs:
    metadataAccess:
      - "public"
    readAccess:
      - "shared"
  access:
    admins:
      - "registry-admin@company.com"
  personalTokens:
    defaultExpiry: "720h"  # 30 days
    maxExpiry: "4320h"     # 180 days

scanner:
  enabled: true
  updateInterval: "12h"
  scanInterval: "24h"

features:
  servePrivate: true
  registryAnalytics: true

logging:
  level: "INFO"

database:
  type: "postgres"
  connectionString: "postgres://registry:${DB_PASSWORD}@db.company.com:5432/registry?sslmode=require"
```
