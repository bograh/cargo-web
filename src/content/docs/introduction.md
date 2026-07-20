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

- **Apps deploy from GitHub repos** (Dockerfile or Nixpacks auto-detected) or
  plain registry images
- **Every app gets `https://<app>.<apps-domain>`** with automatic SSL; custom
  domains supported
- **Live build/deploy logs**, encrypted environment variables, one-click
  rollback
- **Organizations with roles** (owner/admin/member/viewer) and shareable
  invite links
- **Push-to-deploy webhooks** via a GitHub App
- **Managed databases** — Postgres 16/17 and Redis 7 provisioned per
  organization

## Architecture at a glance

Exactly three platform containers (plus one per deployed app):

| Container | Role |
|---|---|
| `controlplane` | Single Go binary: API, embedded React UI, job queue, deploy engine. The only stateful piece besides the DB. |
| `db` | Postgres 16 — all platform state, job queue, and migrations (run automatically at startup). |
| `traefik` | Reverse proxy; the only container publishing host ports (80/443). Issues certs via Let's Encrypt. |

## Who it's for

Teams running their own infrastructure who want the hosted-PaaS experience
without giving up their machines: code and data stay on your server, pricing
doesn't scale per seat, and the whole platform is three containers you can
inspect, back up, and upgrade with `docker compose pull`.

## Next steps

- [Installation](/docs/installation/) — prerequisites and the one-command installer
- [Quickstart](/docs/quickstart/) — from first login to a live app
- [Architecture](/docs/architecture/) — the platform in detail
