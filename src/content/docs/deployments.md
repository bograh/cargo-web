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
- Under blue/green, **a failed deploy never affects it either** — the new
  version is discarded and the old one keeps serving
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
Rollback targets within that window always have their image available. An image
is never removed while something still runs it — that covers a rollback (whose
image belongs to an older deployment row) and a blue/green hand-off (where two
colors run different images at once). The
[disk guardrail](/docs/operations/) reclaims dangling images if space gets
tight anyway.

## Zero-downtime deploys

By default Cargo deploys **blue/green**: the new version is started *beside*
the running one and only takes over once it is healthy. The old version keeps
answering every request until then.

Each app alternates between two colors. A deploy always targets the idle one,
so the version that is currently serving is never touched until the new one has
proven itself.

<figure class="diagram">
<svg viewBox="0 0 720 250" role="img" aria-label="Blue/green hand-off: blue is serving traffic through Traefik. A deploy starts green alongside it. Traefik's healthcheck keeps green out of rotation until it answers, then both colors serve. Once green is healthy Cargo removes blue, leaving green serving alone. If green never becomes healthy it is removed instead and blue keeps serving.">
  <defs>
    <marker id="d-arrow-bg" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <text class="d-sub" x="8" y="20">1 — steady state</text>
  <rect class="d-node--ext" x="8" y="30" width="90" height="38" rx="8"/>
  <text class="d-sub" x="53" y="53" text-anchor="middle">Traefik</text>
  <rect class="d-node--live" x="150" y="30" width="96" height="38" rx="8"/>
  <text class="d-title" x="198" y="53" text-anchor="middle">blue</text>
  <path class="d-edge" d="M98,49 H146" marker-end="url(#d-arrow-bg)"/>

  <text class="d-sub" x="8" y="104">2 — green starts, gated out of rotation</text>
  <rect class="d-node--ext" x="8" y="114" width="90" height="38" rx="8"/>
  <text class="d-sub" x="53" y="137" text-anchor="middle">Traefik</text>
  <rect class="d-node--live" x="150" y="114" width="96" height="38" rx="8"/>
  <text class="d-title" x="198" y="137" text-anchor="middle">blue</text>
  <rect class="d-node--accent" x="290" y="114" width="96" height="38" rx="8"/>
  <text class="d-title" x="338" y="137" text-anchor="middle">green</text>
  <path class="d-edge" d="M98,133 H146" marker-end="url(#d-arrow-bg)"/>
  <path class="d-edge d-edge--dashed" d="M246,133 H286" marker-end="url(#d-arrow-bg)"/>
  <text class="d-edge-label" x="404" y="137">healthcheck failing — no traffic</text>

  <text class="d-sub" x="8" y="188">3 — green healthy, blue reaped</text>
  <rect class="d-node--ext" x="8" y="198" width="90" height="38" rx="8"/>
  <text class="d-sub" x="53" y="221" text-anchor="middle">Traefik</text>
  <rect class="d-node--live" x="150" y="198" width="96" height="38" rx="8"/>
  <text class="d-title" x="198" y="221" text-anchor="middle">green</text>
  <path class="d-edge" d="M98,217 H146" marker-end="url(#d-arrow-bg)"/>
  <text class="d-edge-label" x="262" y="221">blue removed</text>
</svg>
<figcaption>Both colors declare the same Traefik router and service, so Traefik pools them
and the switch needs no proxy reconfiguration. Only one color survives a successful deploy.</figcaption>
</figure>

**If the new version never becomes healthy**, Cargo removes it and leaves the
old one serving. The deployment ends `failed` — there is nothing to roll back,
because the running app was never replaced.

The very first blue/green deploy of an app that predates this feature is a
one-time exception: the old container is retired before the first color starts,
so that deploy has the same brief gap as `recreate`. Every deploy after it is a
true hand-off.

### Choosing a strategy

Set it per app under **Settings → Deploy strategy**, or instance-wide with
`CARGO_DEPLOY_STRATEGY` (see [Configuration](/docs/configuration/)).

| Strategy | Behaviour |
| --- | --- |
| `bluegreen` *(default)* | New version starts alongside the old one; traffic switches only after it's healthy |
| `recreate` | Container is replaced in place; brief downtime per deploy |

<div class="callout callout--note">
  <span class="callout__title">Set a healthcheck path</span>
  <p>During the hand-off both colors are in Traefik's backend pool, and it is
  Traefik's healthcheck that keeps a still-booting container out of rotation.
  Without a healthcheck path there is nothing to probe, so a request can briefly
  reach the new version before it is ready. Blue/green still works — but set a
  path to get the full guarantee.</p>
</div>

<div class="callout callout--warning">
  <span class="callout__title">When to pick recreate</span>
  <p>Blue/green runs two instances of your app at the same time for a few
  seconds. Choose <code>recreate</code> if that isn't safe — for example an app
  that runs schema migrations on boot, holds an exclusive lock, or is a
  singleton worker. It also briefly doubles the app's memory and CPU footprint,
  which counts against its <a href="/docs/operations/">resource limits</a>.</p>
</div>

## Rollback

From **app → Deployments**, pick any previous `live` or `superseded`
deployment and hit **Rollback**. Rollback redeploys that deployment's
**retained image without rebuilding**, so service is restored within seconds
(target: ≤ 1 minute).

A rollback is an ordinary deployment, so it uses the app's strategy too: under
blue/green it hands back over with no downtime.

A failed deploy alerts the org's owners and admins — see
[Operations & Hardening](/docs/operations/).
