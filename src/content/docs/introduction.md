---
title: Introduction
description: What Cargo is, what it does, and how it's put together.
order: 1
section: Getting Started
---

Cargo is a **self-hosted Platform-as-a-Service** in the spirit of Dokploy and
Coolify: a Vercel/Railway-like deployment experience on infrastructure you
own. Install it on a single server with one command, then anyone on the team
can ship an app from a GitHub repo or a container registry to a running HTTPS
URL in a few clicks — no SSH, no YAML, no proxy config.

## What you get

- **Apps deploy from GitHub repos** — your Dockerfile, a generated
  multi-stage Dockerfile for Node/Go/Java, or Nixpacks — or plain registry
  images
- **Every app gets `https://<app>.<apps-domain>`** with automatic SSL; custom
  domains supported
- **Live build/deploy logs**, streaming container logs, encrypted environment
  variables, one-click rollback
- **Live metrics per app** — CPU, memory, request rate, error rate, p50/p95
  latency
- **Organizations with roles** (owner/admin/member/viewer), email invites, and
  shareable invite links
- **Push-to-deploy webhooks** via a GitHub App you can create in one click
- **Managed databases** — Postgres, MySQL, MongoDB, and Redis provisioned per
  organization
- **Production safeguards** — scheduled control-plane backups, disk guardrail,
  deploy/disk/backup alerts, per-app resource caps, and an audit log

No domain yet? Cargo installs on localhost or a bare server IP and works the
same, minus Let's Encrypt certificates.

## Architecture at a glance

Exactly three platform containers (plus one per deployed app):

<figure class="diagram">
<svg viewBox="0 0 720 230" role="img" aria-label="At a glance: internet traffic reaches Traefik on ports 80 and 443, which routes to the controlplane and to one container per app. The controlplane talks to the Postgres db on the private cargo-system network; deployed apps have no route to it.">
  <defs>
    <marker id="d-arrow-glance" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <rect class="d-node--ext" x="16" y="86" width="120" height="52" rx="8"/>
  <text class="d-title" x="76" y="117" text-anchor="middle">Internet</text>
  <rect class="d-node--accent" x="176" y="86" width="140" height="52" rx="8"/>
  <text class="d-title" x="246" y="108" text-anchor="middle">traefik</text>
  <text class="d-sub" x="246" y="126" text-anchor="middle">80 / 443</text>
  <rect class="d-node" x="356" y="24" width="170" height="56" rx="8"/>
  <text class="d-title" x="441" y="50" text-anchor="middle">controlplane</text>
  <text class="d-sub" x="441" y="68" text-anchor="middle">API · UI · deploys</text>
  <rect class="d-node" x="356" y="146" width="170" height="56" rx="8"/>
  <text class="d-title" x="441" y="172" text-anchor="middle">your apps</text>
  <text class="d-sub" x="441" y="190" text-anchor="middle">one container each</text>
  <rect class="d-node" x="566" y="24" width="138" height="56" rx="8"/>
  <text class="d-title" x="635" y="50" text-anchor="middle">db</text>
  <text class="d-sub" x="635" y="68" text-anchor="middle">Postgres 16</text>
  <text class="d-tag" x="704" y="100" text-anchor="end">CARGO-SYSTEM</text>
  <path class="d-edge" d="M136,112 H176" marker-end="url(#d-arrow-glance)"/>
  <path class="d-edge" d="M316,105 L356,62" marker-end="url(#d-arrow-glance)"/>
  <path class="d-edge" d="M316,119 L356,164" marker-end="url(#d-arrow-glance)"/>
  <path class="d-edge" d="M526,52 H566" marker-end="url(#d-arrow-glance)"/>
  <path class="d-edge--deny" d="M536,150 L614,84"/>
  <circle class="d-deny-badge" cx="575" cy="117" r="9"/>
  <path class="d-deny-x" d="M570,112 L580,122"/>
  <path class="d-deny-x" d="M580,112 L570,122"/>
  <text class="d-edge-label d-edge-label--deny" x="596" y="142" text-anchor="middle">no route</text>
</svg>
<figcaption>Traefik is the only container publishing host ports. The platform database sits
on a private network deployed apps cannot reach — see
<a href="/docs/architecture/">Architecture</a> for the full layout.</figcaption>
</figure>

| Container | Role |
|---|---|
| `controlplane` | Single Go binary: API, embedded React UI, job queue, deploy engine. The only stateful piece besides the DB. |
| `db` | Postgres 16 — all platform state, job queue, and migrations (run automatically at startup). Sits on a private network no deployed app can reach. |
| `traefik` | Reverse proxy; the only container publishing host ports (80/443). Issues certs via Let's Encrypt. |

## Who it's for

Teams running their own infrastructure who want the hosted-PaaS experience
without giving up their machines: code and data stay on your server, pricing
doesn't scale per seat, and the whole platform is three containers you can
inspect, back up, and upgrade with `docker compose pull`.

## Next steps

- [Installation](/docs/installation/) — prerequisites and the one-command installer
- [Quickstart](/docs/quickstart/) — from first login to a live app
- [Operations & Hardening](/docs/operations/) — backups, alerts, and the audit log
- [Architecture](/docs/architecture/) — the platform in detail
