---
title: Deployments
description: Triggers, the status machine, live logs, and one-click rollback.
order: 5
section: Core Concepts
---

A deployment is one attempt to build (or reuse) an image and run it behind
your app's URL.

## Triggers

- **GitHub webhook** — pushes to the tracked branch (HMAC-validated), when
  auto-deploy is enabled
- **Manual** — the Deploy button in the UI
- **Rollback** — redeploys a previous deployment

## Status machine

Every deployment moves through:

<p>
  <span class="badge">queued</span> →
  <span class="badge badge--building">building</span> →
  <span class="badge badge--deploying">deploying</span> →
  <span class="badge badge--live">live</span> →
  <span class="badge">superseded</span>
  &nbsp;·&nbsp;
  <span class="badge badge--failed">failed</span>
  &nbsp;·&nbsp;
  <span class="badge">cancelled</span>
</p>

**Exactly one deployment per app is `live`** — the one currently serving
traffic. When a new deployment goes live, the previous one is demoted to
`superseded`. Superseded deployments keep their image and remain valid
rollback targets.

## Logs

Build and deploy logs **stream live over SSE** and are **persisted per
deployment**, so you can inspect a failed deploy after the fact. The **five
most recent deployments per app** are retained; older rows, log files, and
images are reclaimed.

For the running app's own output, see the app's Logs tab —
[Metrics & Logs](/docs/metrics-logs/).

## Safety properties

- **Builds are concurrency-capped** (default 2 at a time)
- **Deploys are serialized per app** — no two deploys of the same app race
- **A failed build never affects the currently running app**
- Deploy jobs get a **30-minute timeout**, comfortably covering a cold build
  plus the health gate, and a failure is persisted even if the job's context
  was cancelled
- On startup, any deployment stuck in a non-terminal state for over 15
  minutes — the residue of a crash or restart mid-deploy — is failed with a
  clear reason; more recent ones are resumed by the job queue
- Transient job failures are retried with backoff; failed deploys preserve
  logs and never corrupt platform state

## Image retention

After each deploy — and again daily — Cargo prunes anything outside the
newest five deployments per app, so build images don't accumulate on disk.
Rollback targets within that window always have their image available. The
[disk guardrail](/docs/operations/) reclaims dangling images if space gets
tight anyway.

## Rollback

From **app → Deployments**, pick any previous `live` or `superseded`
deployment and hit **Rollback**. Rollback redeploys that deployment's
**retained image without rebuilding**, so service is restored within seconds
(target: ≤ 1 minute).

<div class="callout callout--warning">
  <span class="callout__title">Known limitation — brief downtime</span>
  <p>The apply step recreates the container, so each deploy has a brief
  downtime window, and a failed healthcheck leaves the app down until you
  roll back. Zero-downtime (blue/green) deployments are planned for a later
  phase. A failed deploy alerts the org's owners and admins — see
  <a href="/docs/operations/">Operations &amp; Hardening</a>.</p>
</div>
