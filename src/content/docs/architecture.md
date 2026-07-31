---
title: Architecture
description: Three containers, one binary, no external dependencies.
order: 15
section: Reference
---

Cargo is deliberately small: **exactly three platform containers**, plus one
container per deployed app. No Redis, no external dependencies — Postgres
holds both platform state and the job queue.

## The three containers

| Container | Role |
|---|---|
| `controlplane` | Single Go binary: chi HTTP API, embedded React SPA (served via `go:embed`), River job queue on Postgres, deploy engine. Mounts the Docker socket to build and run apps. The only stateful piece besides the DB. |
| `db` | Postgres 16 — all platform state and the job queue. goose migrations are embedded in the binary and run automatically at startup; queries are generated with sqlc. Reachable only by the controlplane. |
| `traefik` | Traefik v3 reverse proxy. The only container publishing host ports (80/443). Configured entirely via container labels on the `cargo-proxy` network; issues Let's Encrypt certificates. |

The platform UI itself is routed through Traefik like any app (dogfooded) —
the controlplane carries the same labels Cargo generates for user apps.

## Networks

Three Docker networks keep a deployed app from ever reaching the
control-plane database:

| Network | Scope | Members |
|---|---|---|
| `cargo-proxy` | External, shared, created once per host | Traefik, controlplane, and every tenant app — the traffic network |
| `cargo-system` | Compose-managed, `internal` | Only controlplane ↔ platform DB. `internal: true` also denies the DB any outbound route |
| `cargo-data` | External | Managed-database instances; an app joins only when it has an attachment |

The `db` service joins **only** `cargo-system`, so it has no address on the
network tenant apps live on. You can verify this on a running stack: the
controlplane reaches `db:5432`, a container attached to `cargo-proxy` cannot.

Tenant containers additionally run with memory/CPU/PID caps,
`no-new-privileges`, and rotated logs — see
[Operations & Hardening](/docs/operations/).

## Stack

| Layer | Technology |
|---|---|
| Backend | Go — chi, River, goose, sqlc |
| Frontend | React 19, Vite, TypeScript, Tailwind 4, TanStack Query, and a hand-built "freight" component set — embedded in the Go binary |
| State | Postgres 16 (control state + job queue) |
| Proxy | Traefik v3, label-configured |
| Runtime dependency | Docker Engine with the compose plugin on the host |
| Third-party services | GitHub (App + webhooks), Let's Encrypt, optional DNS provider API, optional SMTP, optional OIDC provider |

## Endpoints and listeners

| Listener | Exposure | Purpose |
|---|---|---|
| Traefik `:80` / `:443` | Public | The only host ports published |
| Traefik `:8082` | Internal | Prometheus metrics scraped for per-app traffic charts |
| Controlplane `:8080` | Internal (routed via Traefik) | API + embedded SPA |
| Controlplane `:9090` | Internal only | Prometheus self-metrics (`CARGO_METRICS_ADDR`) |
| `GET /healthz` | Public | Liveness |
| `GET /readyz` | Public | Readiness — 200 only when Postgres and Docker are both reachable |

## Background work

The job queue (River, on Postgres) runs deploys plus a set of periodic jobs:
metrics collection every 15s, domain and disk checks every 10 minutes, and
daily prune, housekeeping, and control-plane backup jobs. The full schedule is
in [Operations & Hardening](/docs/operations/).

## State and volumes

| Volume | Contents |
|---|---|
| `cargo-db` | Postgres data |
| `cargo-data` | The controlplane's `<dataDir>` — `databases/` (managed DB volumes), `db-backups/` (snapshots), `db-logs/` (provisioning logs), `platform-backups/` (control-plane dumps + certificate copies) |
| `cargo-acme` | Traefik's certificate store (`acme.json`) |

The production image is `ghcr.io/bograh/cargo:latest` — a multi-stage build
(web build → Go build → alpine with the docker CLI and compose plugin).

## Development

```bash
cd deploy
docker compose -f docker-compose.dev.yml up --build
```

Serves the platform on http://localhost:8080 without Traefik/SSL.

- Backend tests: `go test ./...` (integration tests run against real
  Postgres via testcontainers)
- Frontend tests: `npm test` in `web/`
- End-to-end smoke test (install → register → deploy → live):
  `scripts/smoke.sh`
