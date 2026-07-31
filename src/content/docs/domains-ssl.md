---
title: Domains & SSL
description: Auto subdomains, custom domains, and Let's Encrypt modes.
order: 6
section: Core Concepts
---

Every app receives an auto-generated subdomain `<slug>.<apps-suffix>` at
creation, with a certificate issued automatically. You can attach your own
domains at any time.

## Custom domains

Attach or remove custom domains from the app's settings; changes apply on
the **next reconcile**. Once a custom domain's DNS points at your server,
its certificate is issued via HTTP-01.

Domain status is shown in the UI based on DNS + HTTPS checks that run every
10 minutes:

<p>
  <span class="badge badge--live">active</span>
  <span class="badge badge--pending">pending</span>
  <span class="badge badge--misconfigured">misconfigured</span>
</p>

## SSL modes

The mode is chosen at install time, and decides which compose overlay runs:

| Mode | Compose files | How it works | When to use |
|---|---|---|---|
| **Local** | base only | No ACME. Traefik serves its self-signed certificate on 443; the platform is also on plain HTTP port 80 | No domain — localhost or a bare server IP |
| **HTTP-01** | `+ docker-compose.tls.yml` | Each auto subdomain and custom domain gets its own Let's Encrypt certificate on first request | A domain, no DNS API. Subject to Let's Encrypt rate limits with many apps |
| **Wildcard DNS-01** (recommended) | `+ docker-compose.dns01.yml` | One certificate covers `*.<apps-suffix>` | Many apps; requires a DNS provider API token |

Custom domains always use HTTP-01 once their DNS points at the server,
regardless of mode.

<div class="callout callout--note">
  <span class="callout__title">Local installs</span>
  <p>On a local install your browser will warn about the self-signed
  certificate for <code>*.apps.localhost</code>. That's expected — switch to a
  domain install when you want real certificates.</p>
</div>

### Enabling HTTP-01

```bash
docker compose -f docker-compose.yml -f docker-compose.tls.yml up -d
```

with `CARGO_ACME_EMAIL` set in `.env`.

### Enabling wildcard DNS-01

Run with the DNS-01 overlay and set your DNS provider:

```bash
docker compose -f docker-compose.yml -f docker-compose.dns01.yml up -d
```

| Variable | Purpose |
|---|---|
| `CARGO_DNS_PROVIDER` | A [Traefik DNS provider name](https://doc.traefik.io/traefik/https/acme/#providers), e.g. `cloudflare` |
| Provider credentials | e.g. `CF_DNS_API_TOKEN` for Cloudflare — added to `.env` |

The install script asks for a DNS provider and takes care of the overlay
file for you; a provider credential variable still needs to be added to
`.env` manually.

## How routing works

Traefik is the only container publishing host ports (80/443) and is
configured entirely via container labels on the shared `cargo-proxy` network
— apps register and deregister routes as they deploy. See
[Architecture](/docs/architecture/) for the full network layout.
