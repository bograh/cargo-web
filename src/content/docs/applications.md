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

**Builder auto-detection**, in order — the first match wins:

| Repo contents | Builder used |
|---|---|
| A `Dockerfile` | Docker build from your Dockerfile |
| `package.json` (and no `bun.lockb`) | Generated multi-stage Node image |
| `go.mod` | Generated multi-stage Go image |
| `pom.xml`, `build.gradle`, or `build.gradle.kts` | Generated multi-stage Java image |
| Anything else | Nixpacks (auto-detected language buildpacks) |

### Generated Dockerfiles

For Node, Go, and Java projects without a Dockerfile, Cargo writes a lean
**multi-stage Dockerfile** into the build context instead of reaching for
Nixpacks — dependencies and compilation happen in a build stage, and only the
artifact ships in the runtime image. The generated file is printed at the top
of the build log, so you can see exactly what was built and copy it into your
repo if you want to take it over.

The generators are deliberately conservative: they read your
`packageManager` / lockfile, `go.mod`, or Java version to pin the toolchain,
and when a project's shape is ambiguous they decline and let Nixpacks handle
it. You can also force a builder (`auto`, `dockerfile`, or `nixpacks`) in the
app's settings.

Dockerfile builds additionally support:

- **Custom context path** — build from a subdirectory of the repo
- **Custom Dockerfile path** — e.g. `docker/Dockerfile.prod`
- **Build args** — passed through to `docker build`

### Registry image

Deploy a plain image reference — e.g. `ghcr.io/org/app:tag` — with no git
integration at all. Private registries are supported with **stored, encrypted
pull credentials**.

### Compose file

Point Cargo at a repository that already contains a **Docker Compose file** and
it runs that file as-is, layering its own networking, Traefik labels, TLS, and
resource limits over it. Multi-service apps — a web service with a worker, a
queue, a cache — deploy without being rewritten.

You supply the compose file's path in the repo (default `docker-compose.yml`)
and the name of the **web service**: the one Cargo routes the app's domain to
and health-gates. Every other service in your file runs untouched.

Cargo never rewrites your YAML. It generates a small overlay and applies both
files together, so compose's own merge rules combine them — which is also why
the overlay can add a network without displacing the ones your services already
use, and why your relative paths and build contexts resolve against your own
repository.

<div class="callout callout--warning">
  <span class="callout__title">What Cargo won't run</span>
  <p>An overlay can add to a service but never take anything away, so a compose
  file is validated before anything starts and rejected — with the offending
  service and directive named in the deploy log — if it uses
  <code>privileged</code>, <code>cap_add</code>, <code>devices</code>,
  <code>network_mode: host</code> (or <code>container:</code>),
  <code>pid</code>/<code>ipc</code>/<code>userns_mode: host</code>, a bind mount
  of a host path (notably the Docker socket), or a path that escapes the
  repository. These would step straight past the isolation every other app on
  the host depends on.</p>
  <p><code>ports:</code> is refused too, for a different reason: apps are
  reached through Traefik, and a published port would collide with every other
  app on the server. Remove the block and set the app's exposed port instead.</p>
</div>

Two further differences from the other sources:

- **Deploys are in place.** [Blue/green](/docs/deployments/) would stand up a
  second copy of *every* service in your file, databases included, each with its
  own volumes — that is a second stack, not a hand-off. A compose app therefore
  always uses the `recreate` strategy.
- **No image rollback.** There is no single retained image to re-apply;
  redeploy the branch instead.

Named volumes, `build:` contexts, and `depends_on` all work normally. Cargo's
environment variables are injected into the web service alongside any
`env_file` you already declare.

## Settings

| Setting | Purpose |
|---|---|
| **Slug** | Unique, DNS-safe name; determines the auto subdomain |
| **Exposed port** | The container port Traefik routes traffic to |
| **Healthcheck path** | Optional. Blank = live once the container stays up; set a path to also require an HTTP check |
| **Auto-deploy** | When on, pushes to the tracked branch deploy automatically |
| **Notify on successful deploy** | Opt in to success alerts; failures always notify |
| **Resource limits** | Memory, CPU, and max-process caps for this app's container |
| **Deploy strategy** | Zero-downtime blue/green or in-place recreate ([Deployments](/docs/deployments/)) |
| **Compose file / Web service** | Compose sources only: the file's path in the repo and the service that serves HTTP |

### Healthchecks are opt-in

A deploy gates on the container **staying up** for a short settling period.
If you also set a healthcheck path, the deploy additionally polls
`http://<container>:<port><path>` and only goes live once it answers. Leave
it blank for workers, queue consumers, and anything else that doesn't serve
HTTP — with a path set, a non-HTTP app would never pass.

When a healthcheck does time out, the failure message names the actual cause:
nothing listening on the port, persistent 5xx responses, or no response at
all.

### Resource limits

Each app container runs under memory, CPU, and PID caps. Leave the fields
blank to inherit the instance defaults (`512m`, `1` CPU, `512` processes —
see [Configuration](/docs/configuration/)), or set per-app values. Changes
apply on the next deploy. Containers also run with `no-new-privileges` and
rotated logs.

## Lifecycle

| Action | Effect |
|---|---|
| **Deploy** | Build (or reuse) an image and run it — see [Deployments](/docs/deployments/) |
| **Stop** | Stops the app's container; the app, its config, and its deployment history stay put |
| **Start** | Brings a stopped app back up |
| **Rollback** | Redeploys a previous deployment's retained image |
| **Delete** | Removes the app, its container, and its routes |

Stop/start records the app's **desired state**, so a stopped app stays
stopped across platform restarts. A stopped app has no container to sample or
attach to, so its metrics and runtime logs go quiet until it starts again.

## What happens on deploy

Builds are concurrency-capped (default **2** at a time) and deploys are
**serialized per app**. A failed build never affects the currently running
app. See [Deployments](/docs/deployments/) for the full status machine and
[Environment variables](/docs/environment-variables/) for secrets handling.
