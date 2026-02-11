---
title: Backup & restore operations
sidebar:
  order: 3
---

## Backup & restore operations

This page should describe how backup and restore fit into operating UDS Core over time.

Include here:

- What should be backed up (cluster state, platform data, mission data) and at what cadence.
- RPO/RTO considerations and how they map to Velero jobs and storage.
- Expectations for testing restores and doing periodic drills.

Detailed configuration of Velero and any environment-specific plugins should live in **How-to Guides → Backup & restore**.
This page should focus on the operational policies and runbooks.

### Source material from previous docs

- `src/content/docs-old/reference/configuration/Backup And Restore/velero-cloud.md` *(mixed; examples may move to How-to)*
- `src/content/docs-old/reference/configuration/Backup And Restore/vsphere-rke2-csi.md` *(environment-specific; operational guidance may move here)*
