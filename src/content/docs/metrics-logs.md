---
title: Metrics & Logs
description: Live resource and traffic charts, runtime container logs, deployment logs.
order: 8
section: Core Concepts
---

Every app has three views of what it's doing right now: **Metrics** (resource
and traffic charts), **Logs** (the running container's output), and the
per-deployment build logs on each deployment.

## Metrics

The **Metrics** tab shows six live tiles, each with a sparkline:

| Tile | Source |
|---|---|
| CPU % | `docker stats` on the app's container |
| Memory | `docker stats` (with the container's memory limit) |
| Requests/s | Traefik's Prometheus counters for the app's router |
| Error rate | Traefik 5xx responses as a share of requests |
| Latency p50 / p95 | Traefik request-duration histogram |

A collector job samples every running app **every 15 seconds**, writes the
sample to Postgres, and publishes it to subscribers. The tab loads the last
24 hours of history, then follows the live stream over SSE — the connection
state is shown next to the page title (`streaming` / `disconnected`).

Traffic figures come from Traefik's Prometheus endpoint on an internal-only
listener (`:8082`), so they reflect what actually reached the proxy, not what
the app thinks it served.

<div class="callout callout--note">
  <span class="callout__title">Retention</span>
  <p>Samples are kept for <strong>48 hours</strong> and purged by the daily
  housekeeping job. The history endpoint accepts a
  <code>window</code> of <code>6h</code>, <code>24h</code> (default), or
  <code>48h</code>.</p>
</div>

## Instance-wide monitoring

App metrics answer "is this app healthy". The **Admin** page answers "is the
*server* healthy", with two views instance admins see across every
organization.

**Server** shows four live tiles on the same 15-second tick and 48-hour
retention as app metrics:

| Tile | Source |
|---|---|
| Host CPU % | `/proc/stat`, as a delta between ticks |
| Host memory | `/proc/meminfo` — used is derived from `MemAvailable`, so reclaimable page cache doesn't read as "full" |
| Disk used | `statfs` on the data directory |
| Containers | `docker ps` — every container on the host, not just apps |

**All applications** lists the newest sample for every app on the instance —
CPU, memory, requests/s, error rate, and p95 — with a link through to each
app. An error rate above 5% is badged so it stands out. This is the one view
that deliberately crosses organization boundaries, so it is instance-admin
only.

<div class="callout callout--note">
  <span class="callout__title">These really are host figures</span>
  <p>The controlplane runs in a container, but Docker does not namespace
  <code>/proc/stat</code> or <code>/proc/meminfo</code> — so the CPU and memory
  readings describe the whole machine, not the controlplane's own container.
  The container count includes the platform's own three containers and any
  managed databases, which is why it is usually higher than the number of
  running apps.</p>
</div>

Each source degrades independently: if the Docker socket is unavailable the
container count reports zero, but the CPU, memory, and disk series keep
recording. Losing the whole sample exactly when something is wrong with the
host would be the worst possible time for the charts to go blank.

Metrics appear roughly 15 seconds after an app starts running. A stopped app
has no container to sample, so its charts flatten out.

## Runtime logs

The **Logs** tab streams the running container's stdout/stderr over SSE,
starting from the last 200 lines. This is your application's own output —
distinct from the build output of a deployment. Any org member (viewer and
up) can read it.

If the app has never deployed successfully, or is stopped, there's no
container to attach to and the tab reports that no running container exists
yet.

## Deployment logs

Build and deploy logs are captured **per deployment** and streamed live while
the deploy runs (see [Deployments](/docs/deployments/)). They're kept for the
**five most recent deployments per app** — older logs and their images are
reclaimed by the prune job.

## Platform-level metrics

Separately from per-app metrics, the control plane exposes its own Prometheus
endpoint (deploy counts and durations, job-queue depth, DB-pool gauges) on an
internal listener. See [Operations & Hardening](/docs/operations/).
