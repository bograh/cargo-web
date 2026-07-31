---
title: Managed Databases
description: Per-org Postgres, MySQL, MongoDB, and Redis with one-click attach and snapshots.
order: 9
section: Platform
---

Each organization can provision managed database instances directly from the
UI — no separate tooling, no connection strings to assemble by hand.

## Engines

Pick an engine from the logo cards in the create dialog, then a version:

| Engine | Versions | Injected variable |
|---|---|---|
| PostgreSQL | 16, 17 | `DATABASE_URL` |
| MySQL | 8.4, 8.0 | `MYSQL_URL` |
| MongoDB | 7, 6 | `MONGODB_URL` |
| Redis | 7 | `REDIS_URL` |

Provisioning pulls the engine image and waits for the instance to accept
authenticated connections before marking it ready — the first MySQL or
MongoDB instance takes a while, since those images are hundreds of megabytes.

## Attaching to an app

Attach an instance to an app to grant it **per-app, isolated credentials** —
its own database/user, not the admin account. Attaching injects the engine's
connection variable into the app's environment at deploy time.

One attachment per engine per app, so an app can hold one of each
simultaneously. Detaching drops the per-app credentials again.

Redis instances offer a **shared** mode (one password) or **ACL** mode
(per-app ACL users), chosen at creation.

## Storage, snapshots, and logs

- **Data** lives in volumes under `<dataDir>/databases/<id>`
- **Manual snapshots** can be triggered from the UI and are written to
  `<dataDir>/db-backups/<id>/`, downloadable from the UI:

  | Engine | Method | File |
  |---|---|---|
  | Postgres | `pg_dumpall --clean` | `.sql` |
  | MySQL | `mysqldump --all-databases` | `.sql` |
  | MongoDB | `mongodump` archive | `.archive` |
  | Redis | `BGSAVE` + `LASTSAVE`-verified copy of `dump.rdb` | `.rdb` |

- **Provisioning logs** land in `<dataDir>/db-logs/` and are viewable per
  instance in the UI

Snapshots contain admin credentials or password hashes, so taking and
downloading them requires the **admin** role in the org.

<div class="callout callout--note">
  <span class="callout__title">These are your data backups, not the platform's</span>
  <p>Managed-database snapshots are separate from Cargo's own scheduled
  control-plane backups, which cover users, orgs, apps, and encrypted
  secrets — see <a href="/docs/operations/">Operations &amp; Hardening</a>.</p>
</div>

<div class="callout callout--warning">
  <span class="callout__title">Exposing a host port</span>
  <p>Instances can optionally expose a host port for external clients (e.g.
  a local <code>psql</code> or <code>redis-cli</code>). Only enable this if
  you understand the instance will be reachable from outside the docker
  network.</p>
</div>
