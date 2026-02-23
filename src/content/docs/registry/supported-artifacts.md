---
title: Supported Artifact Types

sidebar:
  order: 4
---

### Supported Artifacts

Here is a list of the supported artifact types:

- [Zarf Packages](https://docs.zarf.dev/ref/packages/) (Including [UDS Packages](/structure/packages/))
- Docker Images
- OCI Images
- Helm Charts
- OpenTofu Modules
- OpenTofu Providers
- OCI Artifacts[^1]

**Recommended: [Zarf Packages](https://docs.zarf.dev/) (Including [UDS Packages](/structure/packages/)).** While UDS Registry can store multiple OCI artifact types, Zarf packages are the preferred, first-class unit of delivery. A Zarf package bundles the application's container images, Helm charts, and manifests into a single deployable artifact, making it the most reliable way to move software across disconnected and mission environments.

UDS Packages build on Zarf (a Zarf package plus UDS-specific integration) and are the recommended format for delivering applications into UDS Core, preserving the metadata and structure needed for secure, repeatable deployments.

### Supported Features

UDS Registry supports publishing artifacts with standard OCI tooling. For every supported artifact type you can:

- **Push** from the CLI using OCI-compliant tools
- **Pull** with any OCI client
- **Inspect** the artifact in the UDS Registry UI (including tags, digests, and other metadata)

Some artifact types also support additional supply chain features, including SBOM and vulnerability scanning. Refer to the table below for details:

<style>
  /* Markdown footnotes */
  .sl-markdown-content section[data-footnotes] {
      margin-top: 5rem;
      padding-top: 1rem;
      border-top: 1px solid var(--sl-color-hairline);
      font-size: 0.92rem;
      color: var(--sl-color-gray-3);
  }

  .sl-markdown-content section[data-footnotes]::before {
      content: 'Footnotes';
      display: block;
      margin-bottom: 0rem;
      font-size: 0.78rem;
      font-weight: 600;
      letter-spacing: 0.04em;
      text-transform: uppercase;
      color: var(--sl-color-gray-2);
  }

  .sl-markdown-content section[data-footnotes] div {
      height: 0;
      margin-top: 1rem;
  }

  .sl-markdown-content section[data-footnotes] ol {
      margin-top: 0rem;
      padding-left: 1.1rem;
  }


  .sl-markdown-content a[data-footnote-ref] {
      font-size: 0.75em;
      vertical-align: super;
      line-height: 0;
  }

  .sl-markdown-content a[data-footnote-backref] {
      margin-left: 0.35rem;
      text-decoration: none;
      opacity: 0.75;a
  }

  .sat-table {
    --sat-header-bg: rgba(255,255,255,.03);
    --sat-row-odd-bg: rgba(255,255,255,.02);
    --sat-row-hover-bg: rgba(255,255,255,.05);
    --sat-yes-bg: rgba(34,197,94,.12);
    --sat-yes-text: rgb(134,239,172);
    --sat-yes-border: rgba(34,197,94,.25);
    --sat-soon-bg: rgba(245,158,11,.12);
    --sat-soon-text: rgb(253,230,138);
    --sat-soon-border: rgba(245,158,11,.25);
    width: 100%;
    max-width: max-content;
    border-collapse: separate;
    border-spacing: 0;
    border: 1px solid var(--sl-color-gray-5, rgba(255,255,255,.12));
    overflow: hidden;
    background: var(--sl-color-black, transparent);
  }
  :root[data-theme='light'] .sat-table {
    --sat-header-bg: rgba(17,24,39,.06);
    --sat-row-odd-bg: rgba(17,24,39,.03);
    --sat-row-hover-bg: rgba(17,24,39,.06);
    --sat-yes-bg: rgba(34,197,94,.16);
    --sat-yes-text: #14532d;
    --sat-yes-border: rgba(34,197,94,.35);
    --sat-soon-bg: rgba(245,158,11,.2);
    --sat-soon-text: #92400e;
    --sat-soon-border: rgba(245,158,11,.38);
  }
  .sat-table caption {
    text-align: left;
    padding: 0.75rem 1rem;
    font-weight: 600;
  }
  .sat-table thead th {
    text-align: left;
    font-weight: 600;
    padding: 0.85rem 1rem;
    border-bottom: 1px solid var(--sl-color-gray-5, rgba(255,255,255,.12));
    background: var(--sat-header-bg);
    white-space: nowrap;
  }
  .sat-table tbody td {
    padding: 0.8rem 1rem;
    border-bottom: 1px solid var(--sl-color-gray-6, rgba(255,255,255,.08));
    vertical-align: middle;
  }
  .sat-table tbody tr:nth-child(odd) { background: var(--sat-row-odd-bg); }
  .sat-table tbody tr:hover { background: var(--sat-row-hover-bg); }
  .sat-table tbody tr:last-child td { border-bottom: 0; }

  /* Make the first column stand out a bit */
  .sat-type { font-weight: 600; }

  /* Status pill */
  .sat-pill {
    display: inline-flex;
    align-items: center;
    gap: 0.45rem;
    padding: 0.2rem 0.55rem;
    border-radius: 999px;
    font-size: 0.82rem;
    line-height: 1.2;
    border: 1px solid transparent;
    white-space: nowrap;
  }
  .sat-dot {
    width: 0.55rem;
    height: 0.55rem;
    border-radius: 999px;
    display: inline-block;
  }

  /* Variants */
  .sat-yes {
    background: var(--sat-yes-bg);
    color: var(--sat-yes-text);
    border-color: var(--sat-yes-border);
  }
  .sat-yes .sat-dot { background: rgb(34,197,94); }

  .sat-soon {
    background: var(--sat-soon-bg);
    color: var(--sat-soon-text);
    border-color: var(--sat-soon-border);
  }
  .sat-soon .sat-dot { background: rgb(245,158,11); }

  /* Highlight fully supported row */
  .sat-highlight {
    background: rgba(99,102,241,.10) !important;
    outline: 1px solid rgba(99,102,241,.25);
    outline-offset: -1px;
  }
    /* Responsive: turn into cards on small screens */
  @media (max-width: 720px) {
    .sat-table thead { display: none; }
    .sat-table, .sat-table tbody, .sat-table tr, .sat-table td {
      width: 100%;
    }
    .sat-table tbody td {
      border-bottom: 0;
      display: flex;
      justify-content: space-between;
      gap: 1rem;
      margin-top: 0px;
    }
    .sat-table td::before {
      content: attr(data-label);
      font-weight: 600;
      color: var(--sl-color-gray-2, rgba(255,255,255,.75));
    }
    .sat-type { margin-bottom: 0.25rem; }
    .sat-table tbody td:nth-child(3) { border-bottom: 1px solid var(--sl-color-gray-6, rgba(255,255,255,.08))}
    .sat-type {
      margin-bottom: 0;
    }
  }
</style>

<table class="sat-table">
  <caption class="sr-only">Supported Artifact Types</caption>
  <thead>
    <tr>
      <th>Artifact Type</th>
      <th>SBOM scan</th>
      <th>Vulnerability scan</th>
    </tr>
  </thead>
  <tbody>
    <tr class="sat-highlight">
      <td class="sat-type" data-label="Artifact Type">Zarf Packages</td>
      <td data-label="SBOM scan"><span class="sat-pill sat-yes"><span class="sat-dot"></span>Supported</span></td>
      <td data-label="Vulnerability scan"><span class="sat-pill sat-yes"><span class="sat-dot"></span>Supported</span></td>
    </tr>
    <tr>
      <td class="sat-type" data-label="Artifact Type">Docker Images</td>
      <td data-label="SBOM scan"><span class="sat-pill sat-soon"><span class="sat-dot"></span>Coming soon</span></td>
      <td data-label="Vulnerability scan"><span class="sat-pill sat-soon"><span class="sat-dot"></span>Coming soon</span></td>
    </tr>
    <tr>
      <td class="sat-type" data-label="Artifact Type">OCI Images</td>
      <td data-label="SBOM scan"><span class="sat-pill sat-soon"><span class="sat-dot"></span>Coming soon</span></td>
      <td data-label="Vulnerability scan"><span class="sat-pill sat-soon"><span class="sat-dot"></span>Coming soon</span></td>
    </tr>
  </tbody>
</table>

[^1]: Any artifact packaged according to the [Open Container Initiative (OCI) Image specification](https://github.com/opencontainers/image-spec) can be published to and pulled from UDS Registry using OCI-compliant tooling. Refer to [Guidelines for Artifact Usage](https://github.com/opencontainers/image-spec/blob/v1.1.1/manifest.md#guidelines-for-artifact-usage) to learn more.
