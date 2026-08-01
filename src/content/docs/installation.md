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

- An Ubuntu/Debian Linux host with `sudo` access (the installer sets up Docker
  Engine and the compose plugin)
- Ports **80** and **443** open
- For a **production install**, DNS records pointing at the host:
  - `<platform-domain>` → server IP (where the Cargo UI lives, e.g. `cargo.example.com`)
  - `*.<apps-domain>` → server IP (wildcard for app subdomains, e.g. `*.apps.example.com`)

No domain is required. Leave the platform domain empty and the installer sets
up a **local install** on localhost / the server's IP — see below.

## Quick install

```bash
curl -fsSL https://usecargo.vercel.app/install.sh | sh
```

The bootstrap installs any missing prerequisites, clones Cargo to `/opt/cargo`,
then runs the deploy installer. Set `CARGO_INSTALL_DIR` to choose a different
location. If you already have a Cargo checkout, run `./deploy/install.sh` from
its root instead.

The installer runs four phases, in order:

1. **Dependency checks** — verifies `docker` is installed, the compose plugin
   is present, and the daemon is reachable.
2. **Prompts** — asks for your platform domain. Give one and it also asks for
   the apps-domain suffix, Let's Encrypt email, and an optional DNS provider
   for wildcard certificates (empty = per-domain HTTP-01). Leave it empty for
   a local install and the rest is inferred.
3. **Secrets** — generates `CARGO_MASTER_KEY` (64 hex chars) and
   `CARGO_DB_PASSWORD` into a mode-0600 `.env` file, then prints the DNS
   records you should verify.
4. **Launch** — creates the shared `cargo-proxy` network if it doesn't exist,
   then runs `docker compose up -d` with the right overlay file for your mode.

<div class="callout callout--danger">
  <span class="callout__title">Back up your master key</span>
  <p>Back up <code>CARGO_MASTER_KEY</code> from <code>.env</code> somewhere safe.
  Environment variables and credentials are encrypted with it and are
  <strong>unrecoverable without it</strong>.</p>
</div>

Once the stack is up, open `https://<platform-domain>` and register — **the
first account becomes the instance admin.**

## Install modes

Which compose overlay runs is decided by what you answered:

| Mode | You entered | Stack | Certificates |
|---|---|---|---|
| **Local** | Nothing, `localhost`, or an IP | `docker-compose.yml` | None — plain HTTP on port 80, self-signed HTTPS on 443 |
| **HTTP-01** | A domain, no DNS provider | `+ docker-compose.tls.yml` | One Let's Encrypt cert per domain, on first request |
| **Wildcard DNS-01** | A domain and a DNS provider | `+ docker-compose.dns01.yml` | One cert covering `*.<apps-suffix>` |

### Local install

Leave the platform domain empty and the installer detects the server's
primary IPv4 (falling back to `localhost`), defaults the apps suffix to
`apps.localhost`, and skips Let's Encrypt entirely. No DNS records, no email,
no certificates.

Open `http://localhost` or `http://<server-ip>` and register. Apps are served
at `https://<name>.apps.localhost` with Traefik's self-signed certificate —
your browser will warn, which is expected.

This is the fastest way to try Cargo, and a legitimate way to run it behind
an existing reverse proxy or on a private network. Move to a domain install
when you want real certificates.

## Non-interactive installs

Set the prompt answers in the environment instead of answering interactively.
With none of them set you get a local install.

| Variable | Required | Purpose |
|---|---|---|
| `CARGO_PLATFORM_DOMAIN` | For a domain install | Where the Cargo UI lives, e.g. `cargo.example.com` |
| `CARGO_APPS_SUFFIX` | For a domain install | Apps get `<name>.<suffix>`, e.g. `apps.example.com` |
| `CARGO_ACME_EMAIL` | For a domain install | Let's Encrypt account email |
| `CARGO_DNS_PROVIDER` | No | Traefik DNS provider name (e.g. `cloudflare`) for wildcard certs |

When `CARGO_DNS_PROVIDER` is set, add the provider's credential environment
variables to `.env` as well (e.g. `CF_DNS_API_TOKEN` for Cloudflare) — see
[Domains & SSL](/docs/domains-ssl/). Every other setting has a sane default;
the full list is in [Configuration](/docs/configuration/).

## Installer flags

| Flag | Effect |
|---|---|
| `--force` | Overwrite an existing `.env` (this changes secrets!) |
| `--no-up` | Write `.env` and stop — start later with `docker compose up -d` |

## Manual alternative

Copy `deploy/.env.example` to `.env` and fill it in (every key is documented
there and in [Configuration](/docs/configuration/)), then:

```bash
chmod 600 .env
docker network create cargo-proxy   # shared app/proxy network, once per host
docker compose up -d                # add your TLS overlay's -f flag for production
```
