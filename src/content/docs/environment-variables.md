---
title: Environment Variables
description: Per-app secrets, encrypted at rest and write-only in the UI.
order: 7
section: Core Concepts
---

Each app has its own key/value environment variables, injected into the
container at deploy time.

## Properties

- **Encrypted at rest** — values are sealed with AES-256-GCM using the
  instance's `CARGO_MASTER_KEY`
- **Write-only** — after saving, values can be replaced but never read back
  through the UI
- **Applied on deploy** — changing env vars triggers a reconcile on the next
  deploy; redeploy the app to pick up changes

<div class="callout callout--danger">
  <span class="callout__title">The master key is unrecoverable</span>
  <p>Env vars (and stored registry credentials) are encrypted with
  <code>CARGO_MASTER_KEY</code>. If you lose it, the values are
  <strong>unrecoverable</strong>. Back it up — see
  <a href="/docs/installation/">Installation</a>. If the key leaks rather than
  gets lost, you can
  <a href="/docs/operations/">rotate it</a> without losing anything.</p>
</div>

## Attached databases

Attaching a managed database injects its connection variable automatically,
with per-app isolated credentials:

| Engine | Injected variable |
|---|---|
| Postgres | `DATABASE_URL` |
| MySQL | `MYSQL_URL` |
| MongoDB | `MONGODB_URL` |
| Redis | `REDIS_URL` |

The keys are distinct per engine, so one app can attach one of each without
collisions. Attaching fails if the app already defines that key itself. See
[Managed databases](/docs/databases/).
