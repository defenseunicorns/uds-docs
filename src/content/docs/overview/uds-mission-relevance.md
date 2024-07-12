---
title: Mission & Technical Relevance
type: docs
sidebar:
  order: 2
---

Unicorn Delivery Service (UDS) is a hardware-agnostic software landscape built on top of the secure runtime platform provided by UDS Core. The UDS software landscape enables application development teams to focus their efforts on feature development and delivering
value while reducing the time spent grappling with the intricacies of individual runtime environments. Simultaneously,
it allows platform teams to allocate more resources to system operation and less to the concerns associated with
application nuances.

With UDS, mission teams can:

- Orchestrate applications into any supported environment with a secure runtime platform.
- Streamline application deployment, management, accredidation, and scalability across developer and production environments.
- Facilitate obtaining an Authority to Operate (ATO) with documentation evidence to support that controls are met.
- Leverage open-source tools.

## UDS Mission Bundles and Packages

UDS consists of three main components, each serving a distinct purpose and working together to enable the deployment of mission capabilities and applications effectively.

**UDS Packages:** UDS Packages refer to the specific requirements of a Mission Hero. These packages must be bundled and delivered in a consistent and repeatable manner to effectively achieve mission outcomes. UDS Packages are integrated into UDS through a process that involves the coordination of various open-source projects.

**UDS Applications:** Reusable collections of external tools that enable and extend the functionality of UDS Bundles. They include object storage, databases, and other tools that assist Mission Heroes in delivering software and achieving mission objectives. Mission Applications are synonymous with external supporting applications, tested and proven reliable, packaged as Zarf Packages, and then readily prepared for deployment within the UDS environment.

**Mission Capabilities:** Represent the unique requirements and tools essential for our Mission Heroes to achieve their mission objectives. These capabilities include a wide range of functionalities, tools, and resources specifically tailored to meet the needs of our Mission Heroes.

**UDS Bundle:** A collection of UDS Packages that combine mission-critical tools into a secure runtime environment supported by UDS. UDS Bundles provide the foundational layer for deploying additional mission applications and must be deployed before any other UDS Package.

### Current UDS Mission Capabilities

| **Mission Capability**        | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ----------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Software Factory**          | Software Factory is designed to enhance software development in enterprise DevSecOps pipelines in cloud, on-premises, or edge systems. It offers a comprehensive package of preconfigured, open-source tools to host secure CI/CD pipelines in any environment. Software Factory automates the software delivery process, ensures security across the entire CI/CD pipeline, and provides Mission Heroes with immediate assurances of software safety. With Software Factory, Mission Heroes gain data independence, support and maintenance options, and secure CI/CD pipelines that adhere to industry and DoD best practices.                               |
| **LeapfrogAI**                | LeapfrogAI extends the capabilities of the UDS platform by delivering mission-specific AI capabilities. The integration of LeapfrogAI within UDS offers a comprehensive, end-to-end solution for mission-critical operations. LeapfrogAI includes suitable predefined AI models, databases, frontends, and configurations that best align with the user's mission objectives and deploys them within the secure and declarative baseline of UDS. This integration enables more efficient, data-driven decision-making and offers support for a wide range of mission-critical functions.                                                                       |
| **Your App Your Environment** | Your App Your Environment streamlines application deployment for Mission Heroes, enabling seamless selection, deployment, and management of mission-critical software on a Kubernetes cluster. Leveraging UDS and open-source projects, it efficiently addresses challenges like egress-limited or air-gapped environment software delivery. Integrated with Defense Unicorns' DevSecOps Reference Guide compliant architecture, it ensures compliance and security, meeting 70% of technical security controls out of the box. Teams maintain ownership and independence over their applications, with the flexibility to deploy across various environments. |

## Powered by Open Source Tools

At a high level, UDS bundles infrastructure, platform, and mission applications in a way that makes them portable to
different mission systems and environments. It is an end-to-end solution that establishes and leverages a secure and declarative baseline
to streamline software delivery. UDS tightly integrates and leverages Defense Unicorns' open source projects: Zarf, Pepr, Lula, and LeapfrogAI. The UDS CLI serves as the interaction point connecting these components, facilitating seamless deployment and security of infrastructure within the UDS platform.

### Zarf

Zarf is the generic bundler and installer for UDS. It plays a critical role in the UDS platform by simplifying the packaging and delivery of applications. Zarf delivers platform infrastructure and applications in a declarative state via a collection of Zarf Packages while reducing the need for mission personnel in constrained or classified environments to be Kubernetes or platform experts.

Zarf enables the deployment of Big Bang and other DevSecOps tools, platforms, or infrastructure across security boundaries and classification levels. Zarf also simplifies the installation, updating, and maintenance of DevSecOps capabilities such as Kubernetes clusters, logging, and Software Bill of Materials (SBOM) compliance out of the box. Most importantly, Zarf keeps applications and systems running even when disconnected. For more information, see the [Zarf documentation](https://docs.zarf.dev/docs/zarf-overview) or [Zarf GitHub page](https://github.com/defenseunicorns/zarf#readme).

### Pepr

Pepr automates the integration of applications with runtime capabilities within an environment. This is the core project that will enable the agnostic runtime of applications into any UDS environment as Pepr will adjust the application configuration to be compatible with the target environment. Pepr seamlessly integrates UDS Bundles and Zarf Components, forming a growing library of bundles and components. It streamlines the integration process, enabling application teams to leverage a wide range of pre-built bundles and packages without the need for extensive manual configuration. For additional information, please see the [Pepr GitHub page](https://github.com/defenseunicorns/pepr#readme).

### Lula

Lula is the compliance bridge that leverages the NIST OSCAL framework to automate and simplify compliance in a Kubernetes environment. Lula will demonstrate control inheritance and validation for each UDS Package within the UDS environment. Lula documents and validates controls satisfied by applications, expediting the accreditation process and generating real-time reports for authorizing officials, reducing the burden on the site reliability engeneering team and other individuals involved in manually providing control mapping and responses. For additional information, please see the [Lula GitHub page](https://github.com/defenseunicorns/lula#readme).

## UDS CLI

The UDS CLI serves as the primary interface for users to interact with various components within the UDS platform. The UDS CLI streamlines the deployment process of mission applications and secure infrastructure. The UDS CLI simplifies the tasks involved in running mission applications while maintaining regulatory compliance in a unified and efficient manner.

UDS CLI simplifies deployment by bundling multiple Zarf Packages into a single deployable artifact. This process ensures that UDS Bundles, which encompass infrastructure, platform, and mission applications, can be efficiently deployed within any Mission Hero's system environment. Additionally, the UDS CLI extends its capabilities to Pepr, where multiple Pepr applications are bundled and deployed as a single Pepr Module to support UDS Bundles during runtime.

The UDS CLI is the interaction point for the entire UDS platform and combines and deploys various UDS products. This unified interface allows users to interact with UDS as a comprehensive platform, simplifying the management of mission-critical applications and components.

## Environments Supported by UDS

UDS Bundles are designed to be deployed across various environments, providing flexibility and adaptability for your mission needs. UDS is adaptable to the requirements of different software applications and missions, ensuring successful deployment in diverse environments. Below are the environments where bundles can be deployed:

| **Environment**   | **Description**                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Cloud**         | UDS Bundles support both classified and unclassified cloud environments, including AWS, Azure, Google Cloud, and others. Deploy mission capabilities confidently to public, private, or hybrid cloud environments with UDS.                                                                                                                                                                                                                                               |
| **On-Premises**   | UDS Bundles are equipped to handle on-premises deployment for missions requiring it. Deploy capabilities securely within your infrastructure, providing a secure and controlled environment for software applications. Mission Heroes can bundle and deploy software to servers located within the organization's premises using UDS.                                                                                                                                     |
| **Tactical Edge** | UDS extends its capabilities to edge environments, enabling the deployment of software to devices with limited resources and connectivity. For scenarios where edge computing is crucial, UDS facilitates the deployment and operation of mission capabilities at the edge of the network, ensuring efficient and responsive operations. Tactical edge deployments are suitable for scenarios where low latency and real-time processing are critical to mission success. |
