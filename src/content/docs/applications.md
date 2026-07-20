---
title: Applications
description: App sources, builder auto-detection, and settings.
order: 4
section: Core Concepts
---

An application is the unit Cargo builds, deploys, and serves. Every app has a
unique slug, an exposed port, a healthcheck path, and an auto-deploy toggle —
and gets `https://<slug>.<apps-suffix>` with automatic SSL the moment it's
created.

## Sources

### GitHub repository

Connect your org's GitHub account (via the GitHub App configured in instance
settings), then pick a **repository and branch**. Every push to the tracked
branch can auto-deploy, and you can always deploy manually.

**Builder auto-detection:**

| Repo contents | Builder used |
|---|---|
| Has a `Dockerfile` | Docker build from your Dockerfile |
| No `Dockerfile` | Nixpacks (auto-detected language buildpacks) |

Dockerfile builds additionally support:

- **Custom context path** — build from a subdirectory of the repo
- **Custom Dockerfile path** — e.g. `docker/Dockerfile.prod`
- **Build args** — passed through to `docker build`

### Registry image

Deploy a plain image reference — e.g. `ghcr.io/org/app:tag` — with no git
integration at all. Private registries are supported with **stored, encrypted
pull credentials**.

## Settings

| Setting | Purpose |
|---|---|
| **Slug** | Unique, DNS-safe name; determines the auto subdomain |
| **Exposed port** | The container port Traefik routes traffic to |
| **Healthcheck path** | Checked during deploys to decide if the app is healthy |
| **Auto-deploy** | When on, pushes to the tracked branch deploy automatically |

## What happens on deploy

Builds are concurrency-capped (default **2** at a time) and deploys are
**serialized per app**. A failed build never affects the currently running
app. See [Deployments](/docs/deployments/) for the full status machine and
[Environment variables](/docs/environment-variables/) for secrets handling.
