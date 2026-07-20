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

Domain status is shown in the UI based on periodic DNS + HTTPS checks:

<p>
  <span class="badge badge--live">active</span>
  <span class="badge badge--pending">pending</span>
  <span class="badge badge--misconfigured">misconfigured</span>
</p>

## SSL modes

SSL is automatic via Let's Encrypt. The mode is chosen at install time:

| Mode | How it works | When to use |
|---|---|---|
| **HTTP-01** (default) | Each auto subdomain and custom domain gets its own certificate on first request | No DNS API needed. Subject to Let's Encrypt rate limits with many apps |
| **Wildcard DNS-01** (recommended) | One certificate covers `*.<apps-suffix>` | Many apps; requires a DNS provider API token |

Custom domains always use HTTP-01 once their DNS points at the server,
regardless of mode.

### Enabling wildcard DNS-01

Run with the overlay compose file and set your DNS provider:

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
configured entirely via container labels — apps register and deregister
routes as they deploy. See [Architecture](/docs/architecture/) for details.
