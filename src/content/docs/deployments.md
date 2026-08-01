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

<figure class="diagram">
<svg viewBox="0 0 720 270" role="img" aria-label="Deployment status machine: a GitHub webhook or a manual deploy enqueues a deployment, which moves from queued to building to deploying to live. Building or deploying can end in failed. When the next deployment goes live the previous one becomes superseded, and rolling one back enqueues a new deployment from its retained image.">
  <defs>
    <marker id="d-arrow-lifecycle" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <rect class="d-node--ext" x="16" y="30" width="150" height="40" rx="8"/>
  <text class="d-sub" x="91" y="54" text-anchor="middle">GitHub webhook</text>
  <rect class="d-node--ext" x="16" y="86" width="150" height="40" rx="8"/>
  <text class="d-sub" x="91" y="110" text-anchor="middle">Manual deploy</text>
  <path class="d-edge" d="M166,50 L186,64" marker-end="url(#d-arrow-lifecycle)"/>
  <path class="d-edge" d="M166,106 L186,80" marker-end="url(#d-arrow-lifecycle)"/>
  <rect class="d-node" x="190" y="48" width="104" height="46" rx="8"/>
  <text class="d-title" x="242" y="77" text-anchor="middle">queued</text>
  <rect class="d-node--accent" x="330" y="48" width="104" height="46" rx="8"/>
  <text class="d-title" x="382" y="77" text-anchor="middle">building</text>
  <rect class="d-node--accent" x="470" y="48" width="104" height="46" rx="8"/>
  <text class="d-title" x="522" y="77" text-anchor="middle">deploying</text>
  <rect class="d-node--live" x="610" y="48" width="104" height="46" rx="8"/>
  <text class="d-title" x="662" y="77" text-anchor="middle">live</text>
  <path class="d-edge" d="M294,71 H326" marker-end="url(#d-arrow-lifecycle)"/>
  <path class="d-edge" d="M434,71 H466" marker-end="url(#d-arrow-lifecycle)"/>
  <path class="d-edge" d="M574,71 H606" marker-end="url(#d-arrow-lifecycle)"/>
  <rect class="d-node--fail" x="330" y="170" width="104" height="46" rx="8"/>
  <text class="d-title" x="382" y="199" text-anchor="middle">failed</text>
  <rect class="d-node" x="610" y="170" width="104" height="46" rx="8"/>
  <text class="d-title" x="662" y="199" text-anchor="middle">superseded</text>
  <path class="d-edge" d="M382,94 V166" marker-end="url(#d-arrow-lifecycle)"/>
  <path class="d-edge" d="M522,94 V193 H438" marker-end="url(#d-arrow-lifecycle)"/>
  <path class="d-edge" d="M662,94 V166" marker-end="url(#d-arrow-lifecycle)"/>
  <text class="d-edge-label" x="654" y="136" text-anchor="end">next deploy</text>
  <path class="d-edge d-edge--dashed" d="M662,216 V240 H242 V98" marker-end="url(#d-arrow-lifecycle)"/>
  <text class="d-edge-label" x="452" y="256" text-anchor="middle">rollback — redeploys the retained image</text>
</svg>
<figcaption>Failure states keep their logs. A deployment stopped before it goes live ends as
<code>cancelled</code> (not shown), and one stuck in a non-terminal state for over 15
minutes is failed at startup with a clear reason.</figcaption>
</figure>

<p>
  <span class="badge">queued</span>
  <span class="badge badge--building">building</span>
  <span class="badge badge--deploying">deploying</span>
  <span class="badge badge--live">live</span>
  <span class="badge">superseded</span>
  <span class="badge badge--failed">failed</span>
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
