---
title: Architecture
description: Three containers, one binary, no external dependencies.
order: 12
section: Reference
---

Cargo is deliberately small: **exactly three platform containers**, plus one
container per deployed app. No Redis, no external dependencies — Postgres
holds both platform state and the job queue.

## The three containers

| Container | Role |
|---|---|
| `controlplane` | Single Go binary: chi HTTP API, embedded React SPA (served via `go:embed`), River job queue on Postgres, deploy engine. Mounts the Docker socket to build and run apps. The only stateful piece besides the DB. |
| `db` | Postgres 16 — all platform state and the job queue. goose migrations are embedded in the binary and run automatically at startup; queries are generated with sqlc. |
| `traefik` | Traefik v3 reverse proxy. The only container publishing host ports (80/443). Configured entirely via container labels on the `cargo-proxy` network; issues Let's Encrypt certificates. |

The platform UI itself is routed through Traefik like any app (dogfooded) —
the controlplane carries the same labels Cargo generates for user apps.

## Stack

| Layer | Technology |
|---|---|
| Backend | Go — chi, River, goose, sqlc |
| Frontend | React, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query — embedded in the Go binary |
| State | Postgres 16 (control state + job queue) |
| Proxy | Traefik v3, label-configured |
| Runtime dependency | Docker Engine with the compose plugin on the host |
| Third-party services | GitHub (App + webhooks), Let's Encrypt, optional DNS provider API, optional SMTP |

## State and volumes

| Volume | Contents |
|---|---|
| `cargo-db` | Postgres data |
| `cargo-data` | The controlplane's `<dataDir>` — `databases/` (managed DB volumes), `db-backups/` (snapshots), `db-logs/` (provisioning logs) |
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
