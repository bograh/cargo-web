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
  <span class="badge badge--live">live</span>
  &nbsp;·&nbsp;
  <span class="badge badge--failed">failed</span>
  &nbsp;·&nbsp;
  <span class="badge">cancelled</span>
</p>

## Live logs

Build and deploy logs **stream live over SSE** and are **persisted per
deployment** (the last N deployments are retained), so you can inspect a
failed deploy after the fact.

## Safety properties

- **Builds are concurrency-capped** (default 2 at a time)
- **Deploys are serialized per app** — no two deploys of the same app race
- **A failed build never affects the currently running app**
- Transient job failures are retried with backoff; failed deploys preserve
  logs and never corrupt platform state

## Rollback

From **app → Deployments**, pick any previous deployment and hit
**Rollback**. Rollback redeploys that deployment's **retained image without
rebuilding**, so service is restored within seconds (target: ≤ 1 minute).

<div class="callout callout--warning">
  <span class="callout__title">Known limitation — brief downtime</span>
  <p>The apply step recreates the container, so each deploy has a brief
  downtime window, and a failed healthcheck leaves the app down until you
  roll back. Zero-downtime (blue/green) deployments are planned for a later
  phase.</p>
</div>
