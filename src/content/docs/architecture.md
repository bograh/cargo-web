---
title: Architecture
description: Three containers, one binary, no external dependencies.
order: 15
section: Reference
---

Cargo is deliberately small: **exactly three platform containers**, plus one
container per deployed app. No Redis, no external dependencies — Postgres
holds both platform state and the job queue.

<figure class="diagram">
<svg viewBox="0 0 720 430" role="img" aria-label="Cargo host topology: public traffic enters Traefik on ports 80 and 443 on the cargo-proxy network, which routes to the controlplane and to one container per app. The controlplane reaches the Postgres db over the internal cargo-system network and drives Docker over the mounted socket; app containers reach managed databases on cargo-data only when attached.">
  <defs>
    <marker id="d-arrow-topology" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <rect class="d-node--ext" x="36" y="8" width="148" height="34" rx="6"/>
  <text class="d-title" x="110" y="31" text-anchor="middle">Internet</text>
  <path class="d-edge" d="M110,42 V150" marker-end="url(#d-arrow-topology)"/>
  <text class="d-edge-label" x="120" y="78">public 80 / 443</text>
  <rect class="d-lane" x="16" y="86" width="688" height="190" rx="12"/>
  <text class="d-tag" x="32" y="266">CARGO-PROXY · EXTERNAL, SHARED</text>
  <rect class="d-node--accent" x="36" y="156" width="148" height="72" rx="8"/>
  <text class="d-title" x="110" y="186" text-anchor="middle">traefik</text>
  <text class="d-sub" x="110" y="206" text-anchor="middle">v3 · ports 80/443</text>
  <rect class="d-node" x="286" y="156" width="148" height="72" rx="8"/>
  <text class="d-title" x="360" y="186" text-anchor="middle">controlplane</text>
  <text class="d-sub" x="360" y="206" text-anchor="middle">Go binary · UI · queue</text>
  <rect class="d-node" x="536" y="156" width="148" height="72" rx="8"/>
  <text class="d-title" x="610" y="186" text-anchor="middle">app containers</text>
  <text class="d-sub" x="610" y="206" text-anchor="middle">one per app</text>
  <path class="d-edge" d="M184,192 H282" marker-end="url(#d-arrow-topology)"/>
  <path class="d-edge" d="M110,156 C110,112 610,112 610,156" marker-end="url(#d-arrow-topology)"/>
  <text class="d-edge-label" x="360" y="108" text-anchor="middle">app routes (container labels)</text>
  <path class="d-edge d-edge--dashed" d="M434,192 H532" marker-end="url(#d-arrow-topology)"/>
  <text class="d-edge-label" x="483" y="182" text-anchor="middle">docker socket</text>
  <rect class="d-lane" x="16" y="306" width="330" height="112" rx="12"/>
  <text class="d-tag" x="32" y="408">CARGO-SYSTEM · INTERNAL</text>
  <rect class="d-node" x="40" y="326" width="200" height="68" rx="8"/>
  <text class="d-title" x="140" y="354" text-anchor="middle">db</text>
  <text class="d-sub" x="140" y="374" text-anchor="middle">Postgres 16 · state + queue</text>
  <path class="d-edge" d="M330,228 V292 H140 V326" marker-end="url(#d-arrow-topology)"/>
  <text class="d-edge-label" x="238" y="286" text-anchor="middle">db:5432</text>
  <rect class="d-lane" x="376" y="306" width="328" height="112" rx="12"/>
  <text class="d-tag" x="392" y="408">CARGO-DATA · EXTERNAL</text>
  <rect class="d-node" x="420" y="326" width="240" height="68" rx="8"/>
  <text class="d-title" x="540" y="354" text-anchor="middle">managed databases</text>
  <text class="d-sub" x="540" y="374" text-anchor="middle">Postgres · MySQL · Mongo · Redis</text>
  <path class="d-edge" d="M610,228 V292 H540 V326" marker-end="url(#d-arrow-topology)"/>
  <text class="d-edge-label" x="575" y="286" text-anchor="middle">on attachment</text>
</svg>
<figcaption>Traefik is the only container publishing host ports. The <code>db</code>
service joins <strong>only</strong> <code>cargo-system</code>, so it has no address on the
network tenant apps live on; the controlplane is the only member of both.
An app joins <code>cargo-data</code> only when it has a database attachment.</figcaption>
</figure>

## The three containers

| Container | Role |
|---|---|
| `controlplane` | Single Go binary: chi HTTP API, embedded React SPA (served via `go:embed`), River job queue on Postgres, deploy engine. Mounts the Docker socket to build and run apps. The only stateful piece besides the DB. |
| `db` | Postgres 16 — all platform state and the job queue. goose migrations are embedded in the binary and run automatically at startup; queries are generated with sqlc. Reachable only by the controlplane. |
| `traefik` | Traefik v3 reverse proxy. The only container publishing host ports (80/443). Configured entirely via container labels on the `cargo-proxy` network; issues Let's Encrypt certificates. |

The platform UI itself is routed through Traefik like any app (dogfooded) —
the controlplane carries the same labels Cargo generates for user apps.

<figure class="diagram">
<svg viewBox="0 0 720 350" role="img" aria-label="Inside the controlplane binary: a chi HTTP API on port 8080, the embedded React SPA, and Prometheus self-metrics on port 9090 sit above the River job queue, which runs the deploy engine and periodic jobs. The queue and state live in Postgres via sqlc and goose; the deploy engine builds and runs containers through the mounted Docker socket.">
  <defs>
    <marker id="d-arrow-internals" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <text class="d-tag" x="16" y="24">CONTROLPLANE · SINGLE GO BINARY</text>
  <rect class="d-node--ext" x="16" y="34" width="688" height="206" rx="12"/>
  <rect class="d-node" x="40" y="70" width="200" height="64" rx="8"/>
  <text class="d-title" x="140" y="98" text-anchor="middle">chi HTTP API</text>
  <text class="d-sub" x="140" y="118" text-anchor="middle">:8080 · REST + SSE</text>
  <rect class="d-node" x="260" y="70" width="200" height="64" rx="8"/>
  <text class="d-title" x="360" y="98" text-anchor="middle">embedded SPA</text>
  <text class="d-sub" x="360" y="118" text-anchor="middle">React 19 via go:embed</text>
  <rect class="d-node" x="480" y="70" width="184" height="64" rx="8"/>
  <text class="d-title" x="572" y="98" text-anchor="middle">self-metrics</text>
  <text class="d-sub" x="572" y="118" text-anchor="middle">:9090 · Prometheus</text>
  <rect class="d-node--accent" x="40" y="158" width="200" height="64" rx="8"/>
  <text class="d-title" x="140" y="186" text-anchor="middle">River job queue</text>
  <text class="d-sub" x="140" y="206" text-anchor="middle">on Postgres</text>
  <rect class="d-node" x="260" y="158" width="200" height="64" rx="8"/>
  <text class="d-title" x="360" y="186" text-anchor="middle">deploy engine</text>
  <text class="d-sub" x="360" y="206" text-anchor="middle">build · run · route</text>
  <rect class="d-node" x="480" y="158" width="184" height="64" rx="8"/>
  <text class="d-title" x="572" y="186" text-anchor="middle">periodic jobs</text>
  <text class="d-sub" x="572" y="206" text-anchor="middle">metrics · checks · prune</text>
  <path class="d-edge" d="M140,134 V158" marker-end="url(#d-arrow-internals)"/>
  <path class="d-edge" d="M240,190 H260" marker-end="url(#d-arrow-internals)"/>
  <path class="d-edge" d="M460,190 H480" marker-end="url(#d-arrow-internals)"/>
  <rect class="d-node--ext" x="60" y="286" width="220" height="56" rx="8"/>
  <text class="d-title" x="170" y="312" text-anchor="middle">db · Postgres 16</text>
  <text class="d-sub" x="170" y="330" text-anchor="middle">state · job queue</text>
  <rect class="d-node--ext" x="440" y="286" width="220" height="56" rx="8"/>
  <text class="d-title" x="550" y="312" text-anchor="middle">Docker Engine</text>
  <text class="d-sub" x="550" y="330" text-anchor="middle">mounted socket</text>
  <path class="d-edge" d="M140,222 V286" marker-end="url(#d-arrow-internals)"/>
  <text class="d-edge-label" x="150" y="262">sqlc · goose</text>
  <path class="d-edge d-edge--dashed" d="M360,222 V258 H550 V286" marker-end="url(#d-arrow-internals)"/>
  <text class="d-edge-label" x="455" y="252" text-anchor="middle">build · run containers</text>
</svg>
<figcaption>One binary serves the API and the embedded UI, runs the River queue on the
same Postgres it keeps state in, and drives Docker through the mounted socket. goose
migrations are embedded and run at startup; queries are generated with sqlc.</figcaption>
</figure>

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
