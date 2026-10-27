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
  Engine and the compose plugin), on **amd64 or arm64**
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

Running the same command again on a server that already has Cargo is an
**upgrade**, not a reinstall: the bootstrap pulls the latest checkout, sees
the existing `deploy/.env`, and runs the installer with `--update` — your
secrets and settings are kept. See [Upgrading](/docs/upgrading/).

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

<callout type="danger">
  **Back up your master key**

  Back up `CARGO_MASTER_KEY` from `.env` somewhere safe.
  Environment variables and credentials are encrypted with it and are
  **unrecoverable without it**.
</callout>

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

Open `http://localhost` or `http://<server-ip>` and register. (If you write
`.env` by hand and leave `CARGO_PLATFORM_DOMAIN` empty, the UI is served on
`localhost` — an empty value never produces a dead route.) Apps are served
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
| `CARGO_APPS_SUFFIX` | For a domain install | Apps get `<name>.<suffix>`, e.g. `apps.example.com`. Applied on first boot; change it later under **Admin → Instance settings** |
| `CARGO_ACME_EMAIL` | For a domain install | Let's Encrypt account email |
| `CARGO_DNS_PROVIDER` | No | Traefik DNS provider name (e.g. `cloudflare`) for wildcard certs |

When `CARGO_DNS_PROVIDER` is set, add the provider's credential environment
variables to `.env` as well (e.g. `CF_DNS_API_TOKEN` for Cloudflare) — see
[Domains & SSL](/docs/domains-ssl/). Every other setting has a sane default;
the full list is in [Configuration](/docs/configuration/).

## Resource ceilings

Per-app memory/CPU/PID limits are advisory defaults. Instance admins can cap
how far a tenant raises their own limits:

| Variable | Purpose |
|---|---|
| `CARGO_MAX_MEM_LIMIT` | Absolute ceiling for per-app `mem_limit` |
| `CARGO_MAX_CPU_LIMIT` | Absolute ceiling for per-app `cpus` |
| `CARGO_MAX_PIDS_LIMIT` | Absolute ceiling for per-app `pids_limit` |

Without these, a tenant could set `mem_limit` to an arbitrarily large value.
On a shared instance, set them to protect the host.

## Git-clone host screening

Cargo validates repository URLs against server-side request forgery. Only
`https://`, `ssh://`, and `git@host:path` transports are accepted; hosts
that resolve to loopback, RFC1918, link-local, or cloud-metadata addresses
are refused.

If your git server is self-hosted on a private network:

```bash
CARGO_ALLOW_PRIVATE_GIT_HOSTS=true
```

This widens *where* clones may go, never *which transports*.

## Installer flags

| Flag | Effect |
|---|---|
| `--update` | Upgrade an existing install: keep `.env` exactly as it is, pick the compose files that match it, and run `docker compose up -d --build`. Fails if there is no `.env` yet |
| `--force` | Re-run the setup prompts on an existing install and rewrite `.env` — **keeping** `CARGO_MASTER_KEY` and `CARGO_DB_PASSWORD` |
| `--no-up` | Write `.env` (or, with `--update`, just print the command) and stop |

Without a flag, the installer refuses to touch an existing `.env` and tells
you to use `--update` or `--force`. Neither flag ever generates new secrets
for an existing install: a new master key would make every stored secret
unreadable, and Postgres ignores a new password on a data volume it has
already initialised.

## Manual alternative

Copy `deploy/.env.example` to `.env` and fill it in (every key is documented
there and in [Configuration](/docs/configuration/)), then:

```bash
chmod 600 .env
docker network create cargo-proxy   # shared app/proxy network, once per host
docker compose up -d                # add your TLS overlay's -f flag for production
```

The TLS and DNS-01 overlays refuse to start with an empty
`CARGO_PLATFORM_DOMAIN` (`docker compose config` fails with
`CARGO_PLATFORM_DOMAIN is required for TLS`), since there would be nothing
to issue a certificate for.
