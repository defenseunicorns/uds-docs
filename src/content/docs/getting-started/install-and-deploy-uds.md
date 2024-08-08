---
title: Install and Deploy UDS (15m)

sidebar:
  order: 2
---


## Installing UDS

The [UDS CLI](https://github.com/defenseunicorns/uds-cli) is the primary interface for users to interact with various 
components within the UDS landscape. We will use it to deploy the UDS k3d-core-demo bundle.

Run this command into your Terminal to install uds-cli:

```
brew tap defenseunicorns/tap && brew install uds
```

You can verify the installation has succeeded by simply running the `uds` command. You should see something similar to the following:

Now, we are set up and ready to deploy UDS.  To see what the most current release is, check the 
[uds-core](https://github.com/defenseunicorns/uds-core) or [releases](https://github.com/defenseunicorns/uds-core/releases)
pages.

The current release for now is `0.24.1`, but this will quickly change. Run the `uds deploy k3d-core-demo:X.X.X` command 
in the terminal, replacing the "x" with the current release. For example, if the current release is `0.24.1`:

`uds deploy k3d-core-demo:0.24.1`

It will take about 10-15 min to deploy.  If you wish to see it in action, use the included k9s tool with this command.

:::note
Deploying the k3d-core-demo will need an internet connection, as it is acquiring the image from GitHub for this 
demonstration.
:::

