---
title: Managed Databases
description: Per-org Postgres and Redis, one-click attach, snapshots.
order: 8
section: Platform
---

Each organization can provision managed database instances directly from the
UI — no separate tooling, no connection strings to assemble by hand.

## Engines

| Engine | Versions |
|---|---|
| Postgres | 16, 17 |
| Redis | 7 |

## Attaching to an app

Attach an instance to an app to grant it **per-app, isolated credentials**.
Attaching injects the connection variable into the app's environment at
deploy time:

| Engine | Injected variable |
|---|---|
| Postgres | `DATABASE_URL` |
| Redis | `REDIS_URL` |

One attachment per engine per app (an app can have one Postgres and one
Redis instance attached).

## Storage, snapshots, and logs

- **Data** lives in volumes under `<dataDir>/databases/<id>`
- **Manual snapshots** can be triggered from the UI and are written to
  `<dataDir>/db-backups/<id>/`, downloadable from the UI:
  - Postgres: `pg_dumpall --clean`
  - Redis: `BGSAVE` + `LASTSAVE`-verified copy of `dump.rdb`
- **Provisioning logs** land in `<dataDir>/db-logs/`

<div class="callout callout--warning">
  <span class="callout__title">Exposing a host port</span>
  <p>Instances can optionally expose a host port for external clients (e.g.
  a local <code>psql</code> or <code>redis-cli</code>). Only enable this if
  you understand the instance will be reachable from outside the docker
  network.</p>
</div>
