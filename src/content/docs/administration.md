---
title: Instance Administration
description: The instance admin, settings UI, integrations, and account security.
order: 11
section: Platform
---

The **first registered account** on a Cargo instance becomes the instance
admin — bootstrap requires no CLI user-seeding.

## What the instance admin can do

From the admin area, without reinstalling or touching `.env`:

| Section | Purpose |
|---|---|
| **Server** | Live host CPU, memory, disk, and container count ([Metrics & Logs](/docs/metrics-logs/)) |
| **All applications** | Newest metrics for every app on the instance, across organizations |
| **Instance settings** | Apps-domain suffix and SMTP relay |
| **GitHub App** | Create or configure the GitHub App used for repo access and push-to-deploy |
| **SSO (OIDC)** | Point the instance at an identity provider |
| **Alerts webhook** | Slack/Discord-compatible endpoint for platform alerts |
| **Disk** | Free-space gauge for the data directory |
| **Backups** | List control-plane backups and run one on demand |
| **Audit log** | Every state-changing action across the instance |
| **Users / Organizations** | List everyone and every org on the instance |

The instance admin is **not implicitly a member of any org** — org content
stays scoped to org members.

## GitHub App

Deploying from repositories needs a GitHub App. The fastest route is
**Create GitHub App automatically**: Cargo posts a prefilled manifest to
GitHub, GitHub shows you a confirmation page, and the credentials (app ID,
private key, webhook secret) come back and are stored encrypted — nothing to
copy by hand. A state cookie guards the return trip.

If you already have an App, or your organization requires creating it by
hand, paste the credentials into the same card instead. Either way, install
the App on the GitHub account or organization whose repos you want to deploy.

## SMTP

Configure a relay (host, port, username, password, from-address) to enable
[email invites](/docs/organizations/) and email alerts. The password is
write-only. Use **Send test email** to verify the relay before relying on it
— failures surface the concrete SMTP error (connection, auth, TLS, or a
rejected recipient) rather than a generic message.

SMTP is optional: invite links and the alerts webhook both work without it.

## SSO (OIDC)

Cargo can delegate authentication to any OIDC provider. Register a
confidential client at your identity provider with the redirect URI shown in
the admin card — `https://<platform-domain>/api/v1/auth/oidc/callback` — then
enter the issuer URL, client ID, and client secret. The secret is stored
encrypted and never shown again.

Once configured, the login page offers the provider alongside password
sign-in. Clear the configuration to turn SSO off again.

## Alerts, disk, and backups

These are covered in [Operations & Hardening](/docs/operations/): a
Slack/Discord webhook for deploy, disk, and backup events; a free-space gauge
with automatic reclamation; and daily control-plane backups with an on-demand
button.

## Audit log

Every successful state-changing request is recorded with the actor, action,
target, and timestamp. Admins see the whole instance; org owners and admins
see their own org's slice. Retention defaults to 180 days.

## Upgrades

Database migrations run automatically at startup, so upgrading the platform
is an image pull:

```bash
docker compose pull && docker compose up -d
```

Running user apps are not touched. See [Upgrading](/docs/upgrading/).

## Account security

Notes on how accounts are protected, for administrators evaluating the
platform:

- **Passwords** are hashed with argon2id (PHC strings), verified in constant
  time
- **Sessions** are cookie-based (HttpOnly, SameSite=Lax, Secure in
  production) with access + refresh tokens
- **Refresh-token rotation with reuse detection** — reusing a rotated token
  revokes every session in the family
- **Rate limiting** — 10/min per IP on register/login/refresh, plus a general
  API limit of 20 req/s per user or IP
- **Origin checks and security headers** on every request — see
  [Operations & Hardening](/docs/operations/)
- Authentication sits behind an `AuthProvider` interface, which is how OIDC
  plugs in alongside passwords
