---
title: Operations & Hardening
description: Backups, disk guardrail, alerts, audit log, isolation, and health probes.
order: 12
section: Platform
---

Cargo runs several background safeguards so a single-server install can be
left alone without drifting into trouble. Everything here is on by default;
thresholds are tuned with environment variables in `deploy/.env` — see
[Configuration](/docs/configuration/).

## Backups & disaster recovery

Cargo backs up its **own** control-plane state — users, orgs, apps, and the
encrypted env vars, GitHub/OIDC/SMTP secrets. This is distinct from managed
[database snapshots](/docs/databases/), which back up your data.

A daily job writes a set into `<dataDir>/platform-backups/`:

| File | Contents |
|---|---|
| `<timestamp>.dump` | `pg_dump -Fc` of the control database |
| `<timestamp>.certs/` | A copy of Traefik's ACME certificates |
| `<timestamp>.keyfp` | SHA-256 fingerprint of the master key (never the key) |

The last `CARGO_PLATFORM_BACKUP_KEEP` sets (default **14**) are retained. Run
one on demand from **Admin → Backups → Run backup now**.

<div class="callout callout--danger">
  <span class="callout__title">A backup without the master key is only half a backup</span>
  <p>The dump contains AES-GCM-sealed secrets. Without
  <code>CARGO_MASTER_KEY</code> you cannot recover env vars, registry
  credentials, or integration secrets. Cargo never writes the key into a
  backup — store it in a password manager the moment
  <code>install.sh</code> prints it. The <code>.keyfp</code> file lets you
  confirm which key a backup set belongs to.</p>
</div>

### Restore

On a fresh host, bring up the database, restore into it, put the certificates
back, and restart with the **same** master key:

```bash
cd deploy && docker compose up -d db

docker exec -i "$(docker compose ps -q db)" \
  pg_restore -U cargo -d cargo --clean --if-exists < <timestamp>.dump

docker run --rm -v cargo_cargo-acme:/acme -v "$PWD/<timestamp>.certs":/backup \
  alpine sh -c 'cp /backup/acme*.json /acme/ && chmod 600 /acme/acme*.json'

# Restore CARGO_MASTER_KEY and CARGO_DB_PASSWORD in .env, then:
docker compose up -d   # add your TLS overlay's -f flag for production
```

## Disk guardrail

A check runs every 10 minutes against the data directory. Below
`CARGO_DISK_MIN_FREE_PCT` free space (default **10%**) it warns and fires one
alert; below a hard floor of **5%** it also prunes dangling images to reclaim
space. Current free space is shown as a gauge under **Admin → Disk**.

## Alerts

Set a Slack/Discord-compatible incoming webhook under **Admin → Alerts
webhook** (stored encrypted, write-only — the UI only ever reports whether
one is configured). When [SMTP](/docs/administration/) is configured, the
same events are also emailed.

| Event | Recipients |
|---|---|
| Deploy failed | Org owners and admins |
| Deploy succeeded | Org owners and admins — **opt-in per app** |
| Disk low | Instance admins |
| Backup failed | Instance admins |

Turn on success notifications per app with **Notify on successful deploy** in
the app's settings; failures always notify. Alert delivery is best-effort — a
failing webhook or SMTP relay is logged and never fails the deploy, backup,
or disk check that triggered it.

## Audit log

Every successful state-changing request (POST/PUT/PATCH/DELETE) is recorded
append-only: who, what, when, and the target. Reads and failed requests are
not recorded.

- **Admin → Audit log** shows the whole instance
- Org owners and admins see their own org's entries

Entries are retained `CARGO_AUDIT_RETENTION_DAYS` days (default **180**) and
trimmed by the housekeeping job. Audit writes are best-effort and never block
the action being audited.

## Tenant isolation & container limits

The platform database is unreachable from deployed apps: it sits on a private
`cargo-system` network with no address on the app/proxy network. See
[Architecture](/docs/architecture/) for the full network layout.

Each app container additionally runs with:

- **Memory, CPU, and PID caps** — instance defaults (`512m`, `1` CPU, `512`
  PIDs), overridable per app under **Settings → Resource limits**
- **`no-new-privileges`** — no privilege escalation inside the container
- **Rotated logs** — container logs are size-capped so one chatty app can't
  fill the disk

## API hardening

- **Security headers** on every response: `X-Content-Type-Options`,
  `X-Frame-Options: DENY`, `Referrer-Policy: no-referrer`, and a same-origin
  Content-Security-Policy. HSTS is emitted in production only, never on
  plain-HTTP local installs.
- **Origin checks** on cookie-authed mutations, complementing the
  `SameSite=Lax` session cookie.
- **Request body cap** of 1 MiB (the GitHub webhook has its own
  HMAC-validated 5 MiB cap).
- **Rate limits** — `CARGO_API_RATELIMIT_RPS` (default 20/s per user or IP,
  burst 2×) across the API, plus a tighter 10/min per IP on auth endpoints.

## Health & readiness

| Endpoint | Meaning |
|---|---|
| `GET /healthz` | Liveness — the process is up |
| `GET /readyz` | Readiness — **200** only when Postgres *and* Docker are reachable, else **503** naming the failed dependency |

The controlplane container's healthcheck curls `/readyz`. Shutdown is bounded
to 30 seconds so a restart can't hang.

A Prometheus endpoint on an internal-only listener
(`CARGO_METRICS_ADDR`, default `:9090`) exposes `cargo_deploys_total`,
`cargo_deploy_duration_seconds`, `cargo_river_jobs` by state, and DB-pool
gauges.

## Scheduled background jobs

| Job | Interval | What it does |
|---|---|---|
| Metrics collection | 15s | Samples running apps ([Metrics & Logs](/docs/metrics-logs/)) |
| Domain check | 10 min | Refreshes DNS/HTTPS status of custom domains |
| Disk check | 10 min | Free-space guardrail |
| Prune | 24h (and after each deploy) | Keeps the newest 5 deployments per app; removes older rows, logs, and images |
| Housekeeping | 24h | Purges expired sessions and invites, metrics >48h, audit entries past retention |
| Platform backup | 24h | Control-plane dump + certificates |

On startup an **orphaned-deploy reaper** fails any deployment left in
`queued`/`building`/`deploying` for more than 15 minutes — the residue of a
crash or restart mid-deploy. More recent ones are left for the job queue to
resume.
