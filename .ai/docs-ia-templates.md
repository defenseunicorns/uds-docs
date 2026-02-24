# Documentation Templates & GitHub Issues

## Overview

This document provides templates for common documentation page types in UDS Core docs.

---

## Template 1: How-To Guide Template

### Template File: `templates/how-to-guide-template.md`

```markdown
---
title: [Task Name]: [Verb] [Object]
description: [One sentence describing what this guide accomplishes]
---

# [Task Name]: [Verb] [Object]

## What You'll Accomplish

[1-2 sentences clearly stating the outcome. What will the user be able to do after completing this guide?]

## Prerequisites

- UDS Core version [X.X.X] or later
- [Access/permission requirement]
- [Tool requirement] (e.g., `kubectl`, `uds` CLI)
- [Knowledge prerequisite] (e.g., "Familiarity with Kubernetes concepts")

## Before You Begin

[Optional section for important context, warnings, or preparatory steps]

> ⚠️ **Warning**: [Any critical warnings about destructive operations or risks]

> ℹ️ **Note**: [Any version-specific information or important caveats]

## Steps

### 1. [First Major Step]

[Explanation of what this step does and why]

# Command with explanation
kubectl apply -f example.yaml

**Expected output:**

[What the user should see]

### 2. [Second Major Step]

[Continue with additional steps...]

[Use sub-steps if needed:]

#### 2.1 [Sub-step if needed]

[Sub-step content]

## Verification

Confirm the configuration is working correctly:

### Check [Thing 1]

kubectl get [resource]

**Expected result:** [What indicates success]

### Verify [Thing 2]

[How to verify next aspect]

**Success criteria:**
- ✓ [Criterion 1]
- ✓ [Criterion 2]
- ✓ [Criterion 3]

## Troubleshooting

### Problem: [Common Issue 1]

**Symptoms:**
- [What user sees]
- [Error messages]

**Solution:**
[Step-by-step fix]

### Problem: [Common Issue 2]

**Symptoms:**
[What user sees]

**Solution:**
[How to resolve]

## Next Steps

Now that you've completed this task, you might want to:

- [Related task 1] - See [How-To Guide: XXX]
- [Related task 2] - See [How-To Guide: YYY]
- Learn more about [concept] in [Concepts: ZZZ]

## Related Documentation

- **Concepts**: [Link to related concept page]
- **Reference**: [Link to configuration reference]
- **Operations**: [Link to related troubleshooting runbook]
```


## Template 2: Troubleshooting Runbook Template

### Template File: `templates/troubleshooting-runbook-template.md`

```markdown
---
title: "Troubleshooting: [Symptom/Problem]"
description: Diagnose and resolve [symptom]
---

# Troubleshooting: [Symptom/Problem]

## Symptoms

Users experiencing this issue will see:

- [Observable symptom 1]
- [Observable symptom 2]
- [Error message examples]

**Example error:**
[Exact error message if applicable]

## Common Causes

This problem is typically caused by one of the following:

1. **[Cause A]**: [Brief explanation]
2. **[Cause B]**: [Brief explanation]
3. **[Cause C]**: [Brief explanation]

## Diagnostic Steps

Follow these steps to identify the root cause:

### 1. Check [First Thing to Check]

kubectl get [resource] -n [namespace]

**What to look for:**
- [Indicator of problem]
- [Expected vs. actual state]

### 2. Verify [Second Thing to Check]

kubectl logs [pod] -n [namespace]

**Look for:**
- [Error patterns]
- [Warning messages]

### 3. Examine [Third Thing]

[Continue diagnostic steps...]

## Solutions

### For Cause A: [Cause Description]

If diagnostics indicate [specific finding]:

1. [Fix step 1]
   [Command]

2. [Fix step 2]
   [Instructions]

3. Verify the fix:
   [Verification command]


**Expected result:** [What indicates success]

### For Cause B: [Cause Description]

[Solution steps...]

### For Cause C: [Cause Description]

[Solution steps...]

## Verification

After applying a solution, verify the issue is resolved:

```bash
# Check [resource] status
kubectl get [resource]

# Verify [functionality]
[verification steps]

**Success indicators:**
- ✓ [Indicator 1]
- ✓ [Indicator 2]

## Prevention

To prevent this issue in the future:

- [Preventive measure 1]
- [Preventive measure 2]
- [Configuration recommendation]

## Additional Help

If this runbook doesn't resolve your issue:

1. Check [related troubleshooting guide]
2. Review [relevant How-To Guide]
3. See [related Concept page] for background
4. Report issue with diagnostic output to [support channel]

## Related Documentation

- **How-To**: [Link to configuration guide]
- **Concepts**: [Link to conceptual explanation]
- **Reference**: [Link to configuration reference]
```


## Template 3: Version-Specific Upgrade Guide Template

### Template File: `templates/version-upgrade-guide-template.md`

```markdown
---
title: Upgrading to UDS Core [VERSION]
description: Version-specific upgrade guidance for [VERSION]
---

# Upgrading to UDS Core [VERSION]

> 📅 **Release Date**: [Release Date]
> 
> 📋 **Upgrade Difficulty**: [Low / Medium / High]

## Overview

UDS Core [VERSION] introduces:

- [Key feature/change 1]
- [Key feature/change 2]
- [Breaking change if any]

**Recommended for:**
- [Use case 1]
- [Use case 2]

## What's New

### New Features

**[Feature Name]**
[Brief description and why it matters]

**[Feature Name]**
[Brief description]

### Improvements

- [Improvement 1]
- [Improvement 2]

### Bug Fixes

- [Notable fix 1]
- [Notable fix 2]

## Breaking Changes

> ⚠️ **Critical**: Review these breaking changes before upgrading

### [Breaking Change 1]

**Impact:** [Who/what is affected]

**What changed:**
[Explanation of the change]

**Migration required:**
[What users need to do]

**Example:**
# Old configuration
[old config]

# New configuration
[new config]

### [Breaking Change 2]

[Follow same structure...]

## Compatibility

### Kubernetes Versions
- **Supported**: [version range]
- **Tested**: [specific versions tested]
- **Deprecated**: [any deprecations]

### UDS CLI Version
- **Minimum required**: [version]
- **Recommended**: [version]

### Deprecated Features

The following features are deprecated and will be removed in [FUTURE_VERSION]:

- [Feature 1]: [Migration path]
- [Feature 2]: [Migration path]

## Before You Upgrade

### Prerequisites

- [ ] Current version is [MINIMUM_VERSION] or later
- [ ] Backup cluster state (see [Backup Procedures])
- [ ] Review breaking changes above
- [ ] Test upgrade in dev/staging environment
- [ ] Review [Release Notes] for full details

### Pre-Upgrade Checklist

- [ ] Verify current UDS Core version: `uds version`
- [ ] Check cluster health: [health check commands]
- [ ] Backup critical data and configuration
- [ ] Document current configuration for rollback
- [ ] Notify team of planned upgrade window

### Known Issues

**Issue: [Description]**
- **Workaround**: [How to avoid/mitigate]

## Upgrade Procedure

### Step 1: Update UDS CLI

# Download new CLI version
[download command]

# Verify installation
uds version

**Expected output:**
[version output]

### Step 2: [Prepare Configuration]

[Any configuration changes needed]

### Step 3: Deploy Updated Core

# Pull new Core bundle
uds pull [bundle-path]

# Deploy
uds deploy uds-core-[flavor]-[VERSION].tar.zst --confirm

**Deployment time:** Approximately [X minutes] depending on cluster size.

**During deployment:**
- Monitor pod rollout: `watch kubectl get pods -A`
- Check for errors: `uds logs`

### Step 4: Verify Upgrade

# Verify Core version
kubectl get deployment -n uds-core [deployment] -o jsonpath='{.spec.template.spec.containers[0].image}'

# Check all pods running
kubectl get pods -A | grep -v Running

### Step 5: [Post-Upgrade Configuration]

[Any additional configuration required after upgrade]

## Post-Upgrade Validation

### Functional Testing

Test the following to ensure upgrade succeeded:

#### Test 1: [Core Feature]

[test command]

**Expected:** [result]

#### Test 2: [Core Feature]
[test steps]

### Smoke Test Checklist

- [ ] All UDS Core pods are running
- [ ] Application ingress is accessible
- [ ] SSO authentication works
- [ ] Logs are being collected
- [ ] Metrics are being scraped
- [ ] [Feature-specific test]

## Rollback Procedure

If issues occur, roll back to previous version:

### Step 1: Stop Current Deployment


uds remove uds-core --confirm


### Step 2: Restore Previous Version


uds deploy uds-core-[flavor]-[PREVIOUS_VERSION].tar.zst --confirm


### Step 3: Restore Configuration

[Restore any configuration backed up before upgrade]

### Step 4: Verify Rollback

[Verification steps]

## Troubleshooting

### Issue: [Common Upgrade Problem]

**Symptoms:**
[What users see]

**Solution:**
[How to fix]

### Issue: [Another Common Problem]

[Details...]

## Getting Help

If you encounter issues not covered here:

1. Check [Troubleshooting: Upgrade Issues]
2. Review [GitHub Releases] for known issues
3. [Support channel information]

## Related Documentation

- **Release Notes**: [Link to detailed release notes]
- **Breaking Changes**: [Full breaking changes documentation]
- **General Upgrade Guidance**: [Link to Operations > Upgrading UDS Core]
```


## Template 4: CRD Reference Page Template

### Template File: `templates/crd-reference-template.md`

```markdown
---
title: [CR Name] Custom Resource
description: Complete reference for [CR Name] CRD
---

# [CR Name] Custom Resource

## Overview

**API Version:** `uds.dev/v1alpha1`
**Kind:** `[Kind]`

[2-3 sentence description of what this CR does and when to use it]

## Use Cases

- [Use case 1]
- [Use case 2]
- [Use case 3]

## Schema Reference

### Spec Fields

| Field | Type | Required | Default | Description |
|-------|------|----------|---------|-------------|
| `metadata.name` | string | Yes | - | [Description] |
| `metadata.namespace` | string | Yes | - | [Description] |
| `spec.field1` | string | Yes | - | [Description] |
| `spec.field2` | object | No | `{}` | [Description] |
| `spec.field2.subfield` | string | No | `""` | [Description] |

### Status Fields

| Field | Type | Description |
|-------|------|-------------|
| `status.phase` | string | Current phase: [possible values] |
| `status.observedGeneration` | int | [Description] |
| `status.conditions` | []object | [Description] |

## Field Details

### `spec.field1`

[Detailed explanation of this field]

**Accepted values:**
- `value1` - [When to use]
- `value2` - [When to use]

**Example:**
spec:
  field1: value1


### `spec.field2`

[Detailed explanation...]

## Complete Examples

### Example 1: [Common Use Case]

apiVersion: uds.dev/v1alpha1
kind: [Kind]
metadata:
  name: example-basic
  namespace: default
spec:
  field1: value
  field2:
    subfield: value


**What this does:**
[Explanation of this configuration]

### Example 2: [Advanced Use Case]


[Complete advanced example]


**What this does:**
[Explanation]

## Validation Rules

The UDS Operator validates:

- `field1` must be [constraint]
- `field2` is mutually exclusive with [other field]
- [Other validation rules]

**Common validation errors:**

**Error:** `[error message]`
**Cause:** [Why this happens]
**Fix:** [How to resolve]

## Lifecycle

### Creation

When created, the Operator:
1. [Action 1]
2. [Action 2]
3. [Result]

### Updates

When updated, the Operator:
- [Update behavior]
- [What triggers reconciliation]

### Deletion

When deleted:
- [Cleanup behavior]
- [What resources are removed]

## Related Resources

This CR interacts with:

- **Kubernetes Resources**: [List of K8s resources created/modified]
- **Other UDS CRs**: [Related UDS CRs]

## Best Practices

- ✅ **Do**: [Recommendation 1]
- ✅ **Do**: [Recommendation 2]
- ❌ **Don't**: [Anti-pattern 1]
- ❌ **Don't**: [Anti-pattern 2]

## How-To Guides

For task-oriented guides using this CR:

- [How-To: Task using this CR]
- [How-To: Another task]

## Troubleshooting

### CR Not Reconciling

**Symptoms:**
- [What users see]

**Diagnosis:**

kubectl describe [kind] [name] -n [namespace]


**Common causes:**
- [Cause and fix]

## Related Documentation

- **Concepts**: [Concept page explaining this CR]
- **How-To**: [Task guides using this CR]
- **API**: [Generated API documentation if exists]
```


