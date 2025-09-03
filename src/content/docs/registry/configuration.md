---
title: Configuration
sidebar:
  order: 3
---
# UDS Registry Configuration Guide

This document provides a comprehensive overview of all configuration options available in the UDS Registry Helm chart.

## Table of Contents

- [Basic Configuration](#basic-configuration)
- [Package Configuration](#package-configuration)
- [Resource Management](#resource-management)
- [Storage Configuration](#storage-configuration)
- [Registry Configuration](#registry-configuration)
- [Persistence Configuration](#persistence-configuration)
- [Distribution Configuration](#distribution-configuration)
- [Database Configuration](#database-configuration)
- [Security Configuration](#security-configuration)

## Basic Configuration

### Deployment Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `replicaCount` | `1` | Number of registry replicas to deploy |

### Container Image

| Parameter | Default | Description |
|-----------|---------|-------------|
| `image.repository` | `ghcr.io/defenseunicorns/uds-registry` | Container image repository |
| `image.tag` | `0.20.1` | Container image tag |
| `image.pullPolicy` | `IfNotPresent` | Image pull policy |

## Package Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `package.gateway` | `tenant` | Gateway configuration for the package |
| `package.host` | `registry` | Hostname for the registry service |
| `package.domain` | `###ZARF_VAR_DOMAIN###` | Domain name (uses Zarf variable) |
| `package.useRootDomain` | `false` | Use root domain instead of subdomain |
| `package.serviceMeshMode` | `ambient` | Service mesh mode configuration |

**Example:**
```yaml
package:
  host: my-registry
  domain: example.com
  useRootDomain: true  # Results in: my-registry.example.com
```

## Resource Management

Configure CPU and memory resources for the registry pods:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `resources.requests.memory` | `128Mi` | Memory request |
| `resources.requests.cpu` | `250m` | CPU request |
| `resources.limits.memory` | `1Gi` | Memory limit |
| `resources.limits.cpu` | `750m` | CPU limit |

**Note:** Default values are suitable for uds-core only. Increase for production workloads.

## Storage Configuration

### OCI Storage Backend

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `ociStorage` | `filesystem` | `filesystem`, `s3` | Storage backend for OCI artifacts |

- **filesystem**: Uses persistent volumes for storage
- **s3**: Uses S3-compatible object storage

### High Availability Database

| Parameter | Default | Description |
|-----------|---------|-------------|
| `haDatabase` | `false` | Enable HA database (requires S3 storage) |

**Important:** When `haDatabase` is enabled:
- `ociStorage` must be set to `s3`
- Database PVC creation is disabled
- External database must be configured via `database.connectionString`

## Registry Configuration

### Logging

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `registry.logging.level` | `INFO` | `DEBUG`, `INFO`, `WARN`, `ERROR` | Log level |

### Authentication & Access Control

#### Admin Users

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.access.admins` | `["admin"]` | List of initial admin usernames |

#### Public Access

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.publicOrgs.metadataAccess` | `["public"]` | Orgs with UI access (no OCI access) |
| `registry.auth.publicOrgs.readAccess` | `["library"]` | Orgs with UI access (auth required for OCI) |

#### Session Management

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.webSession.duration` | `8h` | User session duration |

#### Personal Tokens

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.personalTokens.defaultExpiry` | `720h` | Default token expiry (30 days) |
| `registry.auth.personalTokens.maxExpiry` | `4320h` | Maximum token expiry (180 days) |

#### Service Tokens

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.auth.serviceTokens.defaultExpiry` | `1440h` | Default token expiry (60 days) |
| `registry.auth.serviceTokens.maxExpiry` | `8760h` | Maximum token expiry (365 days) |

### Scanner Configuration

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.scanner.enabled` | `true` | Enable vulnerability scanning |
| `registry.scanner.updateInterval` | `12h` | Scanner database update interval |
| `registry.scanner.scanInterval` | `24h` | Image scanning interval |

### Feature Flags

| Parameter | Default | Description |
|-----------|---------|-------------|
| `registry.features.garbageCollection` | `false` | Enable garbage collection endpoint |
| `registry.features.registryAnalytics` | `false` | Enable registry analytics |
| `registry.features.servePrivate` | `true` | Serve private repositories |

**Warning:** Garbage collection creates an unprotected `/uds/gc` endpoint that hard deletes unused data.

## Persistence Configuration

### Database Storage (Non-HA Mode)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `persistence.database.pv.storageClassName` | `""` | Storage class (empty = default) |
| `persistence.database.pv.accessModes` | `["ReadWriteOnce"]` | Access modes |
| `persistence.database.pv.size` | `256Mi` | Storage size |
| `persistence.database.pv.annotations` | `{}` | PV annotations |
| `persistence.database.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | PV finalizers |
| `persistence.database.pv.existingClaim` | `""` | Use existing PVC |
| `persistence.database.pv.extraPvcLabels` | `{}` | Extra PVC labels |

### Registry Storage (Filesystem Mode)

| Parameter | Default | Description |
|-----------|---------|-------------|
| `persistence.registry.pv.storageClassName` | `""` | Storage class (empty = default) |
| `persistence.registry.pv.accessModes` | `["ReadWriteOnce"]` | Access modes |
| `persistence.registry.pv.size` | `10Gi` | Storage size |
| `persistence.registry.pv.annotations` | `{}` | PV annotations |
| `persistence.registry.pv.finalizers` | `["kubernetes.io/pvc-protection"]` | PV finalizers |
| `persistence.registry.pv.existingClaim` | `""` | Use existing PVC |
| `persistence.registry.pv.extraPvcLabels` | `{}` | Extra PVC labels |

## Distribution Configuration

### HTTP Settings

| Parameter | Default | Description |
|-----------|---------|-------------|
| `distribution.http.secret` | `""` | HTTP secret for upload resumption |

**Important:** Set a secure random string for production deployments to ensure consistency across replicas.

### Storage Backends

#### Filesystem Backend

| Parameter | Default | Description |
|-----------|---------|-------------|
| `distribution.storage.filesystem.rootDirectory` | `/app/data/registry` | Root directory for registry data |

#### S3 Backend

| Parameter | Default | Required | Description |
|-----------|---------|----------|-------------|
| `distribution.storage.s3.region` | `us-west-1` | ✅ | AWS region |
| `distribution.storage.s3.regionEndpoint` | `""` | ❌ | Custom S3 endpoint |
| `distribution.storage.s3.bucket` | `uds-registry` | ✅ | S3 bucket name |
| `distribution.storage.s3.rootDirectory` | `registry` | ❌ | Root directory in bucket |
| `distribution.storage.s3.secure` | `false` | ❌ | Use HTTPS |
| `distribution.storage.s3.accessKey` | `""` | ❌ | S3 access key |
| `distribution.storage.s3.secretKey` | `""` | ❌ | S3 secret key |
| `distribution.storage.s3.v4Auth` | `true` | ❌ | Use AWS Signature V4 |
| `distribution.storage.s3.forcePathStyle` | `true` | ❌ | Force path-style addressing |
| `distribution.storage.s3.logLevel` | `off` | ❌ | S3 client log level |
| `distribution.storage.s3.encrypt` | `false` | ❌ | Enable server-side encryption |
| `distribution.storage.s3.keyId` | `""` | ❌ | KMS key ID for encryption |

**S3 Log Levels:** `off`, `debug`, `info`, `warn`, `error`

## Database Configuration

| Parameter | Default | Options | Description |
|-----------|---------|---------|-------------|
| `database.type` | `sqlite3` | `sqlite3`, `postgres` | Database type |
| `database.connectionString` | `file:./db/registry.sqlite?_pragma=foreign_keys(1)` | - | Database connection string |

**Examples:**

**SQLite:**
```yaml
database:
  type: sqlite3
  connectionString: "file:./db/registry.sqlite?_pragma=foreign_keys(1)"
```

**PostgreSQL:**
```yaml
database:
  type: postgres
  connectionString: "postgres://user:password@host:5432/dbname?sslmode=require"
```

## Security Configuration

### Service Account

| Parameter | Default | Description |
|-----------|---------|-------------|
| `serviceAccount.annotations` | `""` | Service account annotations |

### Pod Security Context

| Parameter | Default | Description |
|-----------|---------|-------------|
| `podSecurityContext.runAsUser` | `65532` | User ID to run pods |
| `podSecurityContext.runAsGroup` | `65532` | Group ID to run pods |
| `podSecurityContext.fsGroup` | `65532` | Filesystem group ID |

### Container Security Context

| Parameter | Default | Description |
|-----------|---------|-------------|
| `containerSecurityContext.runAsUser` | `65532` | User ID for containers |
| `containerSecurityContext.runAsGroup` | `65532` | Group ID for containers |

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

### Custom Authentication Setup

```yaml
registry:
  auth:
    access:
      admins:
        - "admin"
        - "registry-admin"
    publicOrgs:
      metadataAccess:
        - "public"
        - "community"
      readAccess:
        - "library"
        - "shared"
    personalTokens:
      defaultExpiry: "168h"  # 7 days
      maxExpiry: "2160h"     # 90 days
```
