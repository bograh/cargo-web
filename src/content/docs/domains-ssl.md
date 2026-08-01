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
— apps register and deregister routes as they deploy.

<figure class="diagram">
<svg viewBox="0 0 720 240" role="img" aria-label="Request path: a browser hits Traefik on port 443, which terminates TLS and routes by hostname to either an app container on cargo-proxy or the controlplane on port 8080. Traefik obtains certificates from Let's Encrypt over ACME using HTTP-01 or DNS-01.">
  <defs>
    <marker id="d-arrow-routing" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path class="d-arrow" d="M0,0 L10,5 L0,10 z"/></marker>
  </defs>
  <rect class="d-node--ext" x="250" y="8" width="200" height="48" rx="8"/>
  <text class="d-title" x="350" y="32" text-anchor="middle">Let's Encrypt</text>
  <text class="d-sub" x="350" y="48" text-anchor="middle">ACME · HTTP-01 / DNS-01</text>
  <rect class="d-node" x="16" y="104" width="170" height="56" rx="8"/>
  <text class="d-title" x="101" y="130" text-anchor="middle">browser</text>
  <text class="d-sub" x="101" y="148" text-anchor="middle">https://app.example.com</text>
  <rect class="d-node--accent" x="250" y="92" width="200" height="76" rx="8"/>
  <text class="d-title" x="350" y="122" text-anchor="middle">traefik</text>
  <text class="d-sub" x="350" y="142" text-anchor="middle">:80 / :443 · TLS termination</text>
  <text class="d-sub" x="350" y="158" text-anchor="middle">docker provider · labels</text>
  <path class="d-edge" d="M186,130 H246" marker-end="url(#d-arrow-routing)"/>
  <text class="d-edge-label" x="216" y="122" text-anchor="middle">443</text>
  <path class="d-edge d-edge--dashed" d="M350,92 V60" marker-start="url(#d-arrow-routing)" marker-end="url(#d-arrow-routing)"/>
  <text class="d-edge-label" x="342" y="78" text-anchor="end">cert issuance + renewal</text>
  <rect class="d-node" x="520" y="40" width="184" height="64" rx="8"/>
  <text class="d-title" x="612" y="68" text-anchor="middle">app container</text>
  <text class="d-sub" x="612" y="88" text-anchor="middle">app port on cargo-proxy</text>
  <rect class="d-node" x="520" y="156" width="184" height="64" rx="8"/>
  <text class="d-title" x="612" y="184" text-anchor="middle">controlplane</text>
  <text class="d-sub" x="612" y="204" text-anchor="middle">platform UI + API</text>
  <path class="d-edge" d="M450,120 L516,82" marker-end="url(#d-arrow-routing)"/>
  <text class="d-edge-label" x="485" y="74" text-anchor="middle">app routes</text>
  <path class="d-edge" d="M450,140 L516,178" marker-end="url(#d-arrow-routing)"/>
  <text class="d-edge-label" x="485" y="200" text-anchor="middle">platform route</text>
</svg>
<figcaption>Routes come from container labels on <code>cargo-proxy</code>: each app answers on
<code>&lt;slug&gt;.&lt;apps-suffix&gt;</code> plus any custom domains you attach, and the platform UI
is routed through the same labels. Certificates are stored in the
<code>cargo-acme</code> volume (<code>acme.json</code>).</figcaption>
</figure>

See
[Architecture](/docs/architecture/) for the full network layout.
