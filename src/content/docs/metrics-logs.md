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
