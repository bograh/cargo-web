---
title: Installation
description: Prerequisites and the one-command Cargo installer.
order: 2
section: Getting Started
---

Cargo installs on a single Linux server with one script. The installer checks
dependencies, prompts for your domains, generates secrets, and starts the
three-container stack.

## Prerequisites

- A Linux host with **Docker Engine** and the **compose plugin**
- DNS records pointing at the host:
  - `<platform-domain>` → server IP (where the Cargo UI lives, e.g. `cargo.example.com`)
  - `*.<apps-domain>` → server IP (wildcard for app subdomains, e.g. `*.apps.example.com`)
- Ports **80** and **443** open

## Quick install

```bash
cd deploy
./install.sh
```

The installer runs four phases, in order:

1. **Dependency checks** — verifies `docker` is installed, the compose plugin
   is present, and the daemon is reachable.
2. **Prompts** — asks for your platform domain, apps-domain suffix, and
   Let's Encrypt email, plus an optional DNS provider for wildcard
   certificates (empty = per-domain HTTP-01).
3. **Secrets** — generates `CARGO_MASTER_KEY` (64 hex chars) and
   `CARGO_DB_PASSWORD` into a mode-0600 `.env` file, then prints the DNS
   records you should verify.
4. **Launch** — runs `docker compose up -d` (with the DNS-01 overlay file if
   you chose wildcard mode).

<div class="callout callout--danger">
  <span class="callout__title">Back up your master key</span>
  <p>Back up <code>CARGO_MASTER_KEY</code> from <code>.env</code> somewhere safe.
  Environment variables and credentials are encrypted with it and are
  <strong>unrecoverable without it</strong>.</p>
</div>

Once the stack is up, open `https://<platform-domain>` and register — **the
first account becomes the instance admin.**

## Non-interactive installs

Set the prompt answers in the environment instead of answering interactively:

| Variable | Required | Purpose |
|---|---|---|
| `CARGO_PLATFORM_DOMAIN` | Yes | Where the Cargo UI lives, e.g. `cargo.example.com` |
| `CARGO_APPS_SUFFIX` | Yes | Apps get `<name>.<suffix>`, e.g. `apps.example.com` |
| `CARGO_ACME_EMAIL` | Yes | Let's Encrypt account email |
| `CARGO_DNS_PROVIDER` | No | Traefik DNS provider name (e.g. `cloudflare`) for wildcard certs |

When `CARGO_DNS_PROVIDER` is set, add the provider's credential environment
variables to `.env` as well (e.g. `CF_DNS_API_TOKEN` for Cloudflare) — see
[Domains & SSL](/docs/domains-ssl/).

## Installer flags

| Flag | Effect |
|---|---|
| `--force` | Overwrite an existing `.env` (this changes secrets!) |
| `--no-up` | Write `.env` and stop — start later with `docker compose up -d` |

## Manual alternative

You can create `.env` yourself (all keys are documented in
`deploy/docker-compose.yml`), `chmod 600 .env`, then run
`docker compose up -d`.
