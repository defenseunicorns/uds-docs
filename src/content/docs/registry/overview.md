---
title: Registry Overview
sidebar:
  order: 1
---
UDS Registry is an OCI-compliant registry specifically designed for the Department of Defense (DoD) to manage and deploy UDS packages to any mission environment. This centralized, security-focused system helps you discover, distribute, and deploy your team's mission applications onto our DoD-compliant platform UDS Core while preserving critical security metadata throughout the software delivery lifecycle.

UDS Registry delivers three key benefits:
- Reduces time to deployment through streamlined package management
- Consolidates CVE & Software Bill of Materials (SBOM) data for comprehensive security & compliance visibility
- Simplifies procurement by providing clear access and dissemination of authorized packages
    
<td width="40%" style="vertical-align: middle; text-align: center;">
      <img
        src="/source/assets/registry.ui.catalog.png"
        alt="UDS Runtime UI - Applicatino Catalog Page"
        style="max-width: 100%; border-radius: 8px;"
      />
</td>

## Key Feautures

### Centralized Package Management
<table>
  <tr>
    <td width="40%" style="vertical-align: middle; text-align: center;">
      <img
        src="/assets/package.tags.png"
        alt="Application/Package page - available version tags"
        style="max-width: 100%; border-radius: 8px;"
      />
    </td>
    <td width="60%" style="vertical-align: top;">
      <ul>
        <li>**Single Source of Truth** - Access all available UDS packages from one secure location.</li>
        <li>**Version Control** - Track and manage multiple package versions with complete history.</li>
        <li>**Multiple Image Flavors** - Support for different image flavors (Upstream, Iron Bank, Unicorn)y.</li>
        <li>**Cross-Architecture Support** - Full compatibility with both ARM64 and AMD64 architectures.</li>
        <li>**Comprehensive Metadata** - Preserve security information, dependencies, and deployment requirements.</li>
        <li>**Intuitive Search & Discovery** - Find relevant packages quickly with powerful filtering and search capabilities.</li>
      </ul>
    </td>
  </tr>
</table>

## Security-First Architecture
<table>
  <tr>
    <td width="40%" style="vertical-align: middle; text-align: center;">
      <imgpackage 
        src="/assets/package.vulnerabilities.png"
        alt="Application/Package page - vulnerabilities"
        style="max-width: 100%; border-radius: 8px;"
      />
    </td>
    <td width="60%" style="vertical-align: top;">
      <ul>
        <li>**CVE Tracking** - Monitor security vulnerabilities across all packages.</li>
        <li>**Metadata Preservation** - Maintain critical security information throughout deployment.</li>
        <li>**Compliance Validation** - Verify packages against DoD security standards.</li>
        <li>**Vulnerability Management** - Identify and address security risks proactively.</li>
      </ul>
    </td>
  </tr>
</table>

## Flexible Distribution
<table>
  <tr>
    <td width="40%" style="vertical-align: middle; text-align: center;">
      <img
        src="/assets/registry.distribution.png"
        alt="Application/Package page - available version tags"
        style="max-width: 100%; border-radius: 8px;"
      />
    </td>
    <td width="60%" style="vertical-align: top;">
      <ul>
        <li>**Mission Environment Control** - Install only the packages needed for specific scenarios.</li>
        <li>**Customizable Deployments** - Tailor software configurations to mission requirements.</li>
        <li>**Contract-Based Access** - Control package distribution based on user permissions/Organization level entitlementsy.</li>
        <li>**Bundle Creation** - Group packages for specific mission scenarios or deployments.</li>
      </ul>
    </td>
  </tr>
</table>

## On-Prem Deployment
<table>
  <tr>
    <td width="40%" style="vertical-align: middle; text-align: center;">
      <img
        src="/assets/on.prem.png"
        alt="Application/Package page - available version tags"
        style="max-width: 100%; border-radius: 8px;"
      />
    </td>
    <td width="60%" style="vertical-align: top;">
      <ul>
        <li>**Single Source of Truth** - Access all available UDS packages from one secure location.</li>
        <li>**Version Control** - Track and manage multiple package versions with complete history.</li>
        <li>**Edge Environment Support** - Optimize for tactical edge operations.</li>
        <li>**Reproducible Configurations** - Save and reuse deployment configurations.</li>
      </ul>
    </td>
  </tr>
</table>

## Technical Details
The UDS Registry builds on standard OCI (Open Container Initiative) protocols, ensuring compatibility with existing container workflows while adding DoD-specific security enhancements.

### Architecture
- **Repository System** - Organizes packages by organization, mission, or type
- **Metadata Engine** - Preserves and manages security information
- **Access Control Layer** - Manages authentication and authorization
- **Distribution System** - Handles package bundling and delivery
- **API Driven Design** - Makes sure that integration and automation with CI/CD pipelines is seamless

### UDS Package Support
- **Multiple Image Flavors** - Create, manage, and deploy packages with different image sources:
    - Upstream (community source)
    - Iron Bank (hardened DoD-approved images)
    - Unicorn (Defense Unicorns optimized images)

### Cross-Architecture Compatibility 
- Deploy to diverse environments with support for:
    - ARM64 architecture for edge and energy-efficient environments
    - AMD64 architecture for traditional server environments

## Getting Started
We offer two ways to begin using the UDS Registry:

### Explore Our Public Registry (Coming Soon)
- View the Public Unicorn Registry - [Link coming soon]
- Browse available packages and explore registry features without authentication
- See how the UDS Registry can enhance your deployment workflows

### Deploy Your Own Registry
- Contact Our Team - Reach out to discuss adding UDS Registry to your environment without UDS Premium liscense.
- Get personalized guidance on implementation options
- Discover how a dedicated registry can address your specific mission needs

Contact our solutions team at hello@defenseunicorns.com to schedule a consultation.

## Related Documentation
Why UDS
Mission and Technical Relevance
UDS Packages
UDS Security Overview
Published Package Flavors

## Support
For assistance with the UDS Registry, contact the UDS support team at hello@defenseunicorns.com or through the internal support channels.