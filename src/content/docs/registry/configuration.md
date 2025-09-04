---
title: UDS Registry Configuration Guide

sidebar:
  order: 3
---

This document provides a comprehensive overview of all configuration options available in the UDS Registry Helm chart.

> [!TIP]
> UDS Registry uses sensible defaults, most deployments will need to only require a minimal set of configuration.

## Table of Contents

- [Configuration Parameters](#configuration-parameters)
- [Important Notes](#important-notes)
- [Configuration Examples](#configuration-examples)

## Configuration Parameters

| Category | Parameter | Default | Options/Required | Description |
|----------|-----------|---------|------------------|-------------|
| **Basic** | `replicaCount` | `1` | - | Number of registry replicas to deploy [[example]](#basic-development-setup) |
| **Image** | `image.repository` | `ghcr.io/defenseunicorns/uds-registry` | - | Container image repository |
| **Image** | `image.tag` | `0.20.1` | - | Container image tag |
| **Image** | `image.pullPolicy` | `IfNotPresent` | - | Image pull policy |
| **Package** | `package.gateway` | `tenant` | - | Gateway configuration for the package |
| **Package** | `package.host` | `registry` | - | Hostname for the registry service |
| **Package** | `package.domain` | `###ZARF_VAR_DOMAIN###` | - | Domain name (uses Zarf variable) |
| **Package** | `package.useRootDomain` | `false` | - | Use root domain instead of subdomain |
| **Package** | `package.serviceMeshMode` | `ambient` | - | Service mesh mode configuration |
| **Resources** | `resources.requests.memory` | `128Mi` | - | Memory request [[1]](#resource-management) [[example]](#basic-development-setup) |
| **Resources** | `resources.requests.cpu` | `250m` | - | CPU request [[1]](#resource-management) [[example]](#basic-development-setup) |
| **Resources** | `resources.limits.memory` | `1Gi` | - | Memory limit [[1]](#resource-management) [[example]](#basic-development-setup) |
| **Resources** | `resources.limits.cpu` | `750m` | - | CPU limit [[1]](#resource-management) [[example]](#basic-development-setup) |
| **Storage** | `ociStorage` | `filesystem` | `filesystem`, `s3` | Storage backend for OCI artifacts [[2]](#storage-options) [[example]](#basic-development-setup) |
| **Storage** | `haDatabase` | `false` | - | Enable HA database (requires S3 storage) [[3]](#high-availability-database) [[example]](#basic-development-setup) |
| **Registry** | `registry.logging.level` | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` | Log level [[example]](#filesystem-storage-configuration) |
| **Auth** | `registry.auth.access.admins` | `["admin"]` | - | List of initial admin usernames [[example]](#session-and-public-access-configuration) |
| **Auth** | `registry.auth.publicOrgs.metadataAccess` | `["public"]` | - | Organizations with UI access (no OCI access) [[example]](#session-and-public-access-configuration) |
| **Auth** | `registry.auth.publicOrgs.readAccess` | `["library"]` | - | Organizations with UI access (auth required for OCI) [[example]](#session-and-public-access-configuration) |
| **Auth** | `registry.auth.webSession.duration` | `8h` | - | User session duration [[example]](#session-and-public-access-configuration) |
| **Auth** | `registry.auth.personalTokens.defaultExpiry` | `720h` | - | Default token expiry (30 days) [[example]](#token-management-configuration) |
| **Auth** | `registry.auth.personalTokens.maxExpiry` | `4320h` | - | Maximum token expiry (180 days) [[example]](#token-management-configuration) |
| **Auth** | `registry.auth.serviceTokens.defaultExpiry` | `1440h` | - | Default token expiry (60 days) [[example]](#token-management-configuration) |
| **Auth** | `registry.auth.serviceTokens.maxExpiry` | `8760h` | - | Maximum token expiry (365 days) [[example]](#token-management-configuration) |
| **Scanner** | `registry.scanner.enabled` | `true` | - | Enable vulnerability scanning [[example]](#scanner-configuration) |
| **Scanner** | `registry.scanner.updateInterval` | `12h` | - | Scanner database update interval [[example]](#scanner-configuration) |
| **Scanner** | `registry.scanner.scanInterval` | `24h` | - | Image scanning interval [[example]](#scanner-configuration) |
| **Features** | `registry.features.garbageCollection` | `false` | - | Enable garbage collection endpoint [[5]](#feature-flags-warning) [[example]](#feature-flags-configuration) |
| **Features** | `registry.features.registryAnalytics` | `false` | - | Enable registry analytics [[example]](#feature-flags-configuration) |
| **Features** | `registry.features.servePrivate` | `true` | - | Serve private repositories [[example]](#feature-flags-configuration) |
| **DB Persistence** | `persistence.database.pv.storageClassName` | `""` | - | Storage class (empty = default) |
| **DB Persistence** | `persistence.database.pv.accessModes` | `["ReadWriteOnce"]` | - | Access modes |
| **DB Persistence** | `persistence.database.pv.size` | `256Mi` | - | Storage size |
| **DB Persistence** | `persistence.database.pv.annotations` | `{}` | - | Persistent volume annotations |
| **DB Persistence** | `persistence.database.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | - | Persistent volume finalizers |
| **DB Persistence** | `persistence.database.pv.existingClaim` | `""` | - | Use existing PVC |
| **DB Persistence** | `persistence.database.pv.extraPvcLabels` | `{}` | - | Extra PVC labels |
| **Registry Persistence** | `persistence.registry.pv.storageClassName` | `""` | - | Storage class (empty = default) |
| **Registry Persistence** | `persistence.registry.pv.accessModes` | `["ReadWriteOnce"]` | - | Access modes |
| **Registry Persistence** | `persistence.registry.pv.size` | `10Gi` | - | Storage size |
| **Registry Persistence** | `persistence.registry.pv.annotations` | `{}` | - | Persistent volume annotations |
| **Registry Persistence** | `persistence.registry.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | - | Persistent volume finalizers |
| **Registry Persistence** | `persistence.registry.pv.existingClaim` | `""` | - | Use existing PVC |
| **Registry Persistence** | `persistence.registry.pv.extraPvcLabels` | `{}` | - | Extra PVC labels |
| **Distribution** | `distribution.http.secret` | `""` | - | HTTP secret for upload resumption [[4]](#distribution-http-secret) [[example]](#filesystem-storage-configuration) |
| **Distribution** | `distribution.storage.filesystem.rootDirectory` | `/app/data/registry` | - | Root directory for registry data [[example]](#filesystem-storage-configuration) |
| **S3** | `distribution.storage.s3.region` | `us-west-1` | Yes | AWS region [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.regionEndpoint` | `""` | No | Custom S3 endpoint [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.bucket` | `uds-registry` | Yes | S3 bucket name [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.rootDirectory` | `registry` | No | Root directory in bucket [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.secure` | `false` | No | Use HTTPS [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.accessKey` | `""` | No | S3 access key [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.secretKey` | `""` | No | S3 secret key [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.v4Auth` | `true` | No | Use AWS Signature V4 [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.forcePathStyle` | `true` | No | Force path-style addressing [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.logLevel` | `off` | `off`, `debug`, `info`, `warn`, `error` | S3 client log level [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.encrypt` | `false` | No | Enable server-side encryption [[example]](#s3-storage-configuration) |
| **S3** | `distribution.storage.s3.keyId` | `""` | No | KMS key ID for encryption [[example]](#s3-storage-configuration) |
| **Database** | `database.type` | `sqlite3` | `sqlite3`, `postgres` | Database type [[example]](#database-examples) |
| **Database** | `database.connectionString` | `file:./db/registry.sqlite?_pragma=foreign_keys(1)` | - | Database connection string [[example]](#database-examples) |
| **Security** | `serviceAccount.annotations` | `""` | - | Service account annotations |
| **Security** | `podSecurityContext.runAsUser` | `65532` | - | User ID to run pods |
| **Security** | `podSecurityContext.runAsGroup` | `65532` | - | Group ID to run pods |
| **Security** | `podSecurityContext.fsGroup` | `65532` | - | Filesystem group ID |
| **Security** | `containerSecurityContext.runAsUser` | `65532` | - | User ID for containers |
| **Security** | `containerSecurityContext.runAsGroup` | `65532` | - | Group ID for containers |

## Important Notes

### Resource Management
> **Note:** Default resource values are suitable for uds-core only. Increase for production workloads.

### Storage Options
> **Note:** Two storage backends are available:
> - **filesystem** - Uses persistent volumes for storage
> - **s3** - Uses S3-compatible object storage

### High Availability Database
> **Important:** When `haDatabase` is enabled:
> - `ociStorage` must be set to `s3`
> - Database PVC creation is disabled
> - External database must be configured via `database.connectionString`

### Distribution HTTP Secret
> **Important:** Set a secure random string for production deployments to ensure consistency across replicas.

### Feature Flags Warning
> **Warning:** Garbage collection creates an unprotected `/uds/gc` endpoint that hard deletes unused data.

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

### Token Management Configuration

```yaml
# Token expiry and management settings
auth:
  personalTokens:
    defaultExpiry: "168h"  # 7 days
    maxExpiry: "4320h"     # 180 days
  serviceTokens:
    defaultExpiry: "168h"  # 7 days
    maxExpiry: "4320h"     # 180 days
```

### Session and Public Access Configuration

```yaml
# Web session and public organization access
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
  garbageCollection: false
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
  garbageCollection: false
  registryAnalytics: true

logging:
  level: "INFO"

database:
  type: "postgres"
  connectionString: "postgres://registry:${DB_PASSWORD}@db.company.com:5432/registry?sslmode=require"
```
