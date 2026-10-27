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
| **Worker hosts** | Register, verify, and remove remote machines apps can run on ([Deployments](/docs/deployments/#worker-hosts)) |
| **Users / Organizations** | List everyone and every org on the instance |

The instance admin is **not implicitly a member of any org** — org content
stays scoped to org members.

## GitHub App

Deploying from repositories needs a GitHub App. The fastest route is
**Create GitHub App automatically**: Cargo posts a prefilled manifest to
GitHub, GitHub shows you a confirmation page, and the credentials (app ID,
private key, webhook secret, and the App's OAuth client ID and secret) come
back and are stored encrypted — nothing to copy by hand. A state cookie
guards the return trip.

If you already have an App, or your organization requires creating it by
hand, paste the credentials into the same card instead. Either way, install
the App on the GitHub account or organization whose repos you want to deploy.

### Installation ownership

Org admins connect GitHub from their org's settings. Cargo hands them an
install link carrying a **single-use setup token** bound to that user and
org, valid for **15 minutes**; GitHub's redirect back must present it. Each
GitHub installation can belong to **one organization only** — connecting an
installation another org already uses fails with `installation_taken`.

Apps created automatically also have **"Request user authorization (OAuth)
during installation"** turned on. When the App's OAuth client is known, the
redirect carries a code that Cargo exchanges for the installing user's token,
and the connection is accepted only if the installation is one that user can
actually manage on GitHub. Otherwise it is refused with
`installation_not_accessible` (or `github_authorization_required` if the code
is missing).

<callout type="warning">
  **Apps created before this check: ownership unverified**

  A GitHub App set up without an OAuth client still works, but Cargo can only
  confirm *which Cargo user* started the install — not that they control the
  GitHub installation. The card shows **ownership unverified** until you fix
  it: in the App's settings on GitHub, enable *Request user authorization
  (OAuth) during installation*, set the callback URL to
  `https://<platform-domain>/api/v1/github/setup`, then enter the App's
  **OAuth client ID and secret** in the card. The secret is write-only (blank
  keeps the stored one); clearing the client ID turns the check off again.
</callout>

## SMTP

Configure a relay (host, port, username, password, from-address) to enable
[email invites](/docs/organizations/) and email alerts. The form is prefilled
with the stored settings except the password, which is write-only: leave it
blank to keep the stored one. Use **Send test email** to verify the relay before relying on it
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

SSO follows the same [sign-up policy](#who-can-sign-up) as passwords. Someone
whose verified email matches an existing account signs straight in; a new
identity only gets an account when registration is **Anyone** (or it's the
very first account on the instance). Otherwise the login page shows
*"Registration is closed. Ask an admin for an invite to create an account."*
An invitee registers through their invite link first, then signs in with SSO
using the same email.

## Alerts, disk, and backups

These are covered in [Operations & Hardening](/docs/operations/): a
Slack/Discord webhook for deploy, disk, and backup events; a free-space gauge
with automatic reclamation; and daily control-plane backups with an on-demand
button.

## Audit log

Every successful state-changing request is recorded with the actor, action,
target, and timestamp. Admins see the whole instance; org owners and admins
see their own org's slice — including changes made under an app, deployment,
or database, which are attributed to the org that owns it. Deleting an
organization is recorded at instance level, with the deleted org's ID in the
entry's detail. Retention defaults to 180 days.

## Who can sign up

An account on a Cargo instance can deploy containers on the host, so
registration is **invite-only by default**: the first account becomes the
instance admin, and everyone after needs an invite link from an organization
admin.

Change the setting under **Admin → Instance settings → Who can sign up**:

| Setting | Behaviour |
|---|---|
| **Invited people only** (default) | Only users with a valid invite link can register |
| **Anyone** | Open registration (anyone can create an account) |
| **Nobody** | No new registrations; the existing user base is fixed |

<callout type="danger">
  **Upgrading from an earlier version?** Instances upgrading to the
  security-hardened release become invite-only on restart. Set it back to
  **Anyone** under Admin → Instance settings if you relied on open sign-up.
</callout>

## Upgrades

Database migrations run automatically at startup, so upgrading is a matter of
re-running the installer (it detects the existing install and runs
`--update`, keeping `.env`) or pulling the image and restarting. Running user
apps are not touched. See [Upgrading](/docs/upgrading/).

## Account security

Notes on how accounts are protected, for administrators evaluating the
platform:

- **Passwords** are hashed with argon2id (PHC strings), verified in constant
  time
- **Sessions** are cookie-based (HttpOnly, SameSite=Lax, Secure in
  production): a **15-minute** access token and a **30-day** refresh token.
  The UI refreshes quietly, so a user stays signed in — across reloads too —
  until the refresh token expires or is revoked; when it does, they're sent
  back to the login page and returned to where they were after signing in
- **Refresh-token rotation with reuse detection** — rotation is claimed
  atomically, and reusing a rotated token revokes every session in the family.
  A reuse within **10 seconds** of the rotation is treated as a concurrent
  refresh from the same browser (several tabs or requests at once), not theft
- **Logout** revokes the session family even when the access token has
  already expired
- **First-account bootstrap** is serialized, so two simultaneous first
  registrations can't both become instance admin
- **Rate limiting** — 10/min per IP on register/login/refresh, plus a general
  API limit of 20 req/s per user or IP
- **Origin checks and security headers** on every request — see
  [Operations & Hardening](/docs/operations/)
- Authentication sits behind an `AuthProvider` interface, which is how OIDC
  plugs in alongside passwords

## Git-clone SSRF screening

Repository URLs are validated against server-side request forgery. Only
`https://`, `ssh://`, and `git@host:path` transports are accepted. Hosts
that resolve to loopback, RFC1918, link-local, or cloud-metadata addresses
are refused. If your git server is on a private network, set
`CARGO_ALLOW_PRIVATE_GIT_HOSTS=true` — this widens *where* clones may go,
never *which transports*.

## Key rotation

If `CARGO_MASTER_KEY` is suspected compromised, `cargod rotate-key`
re-seals every stored secret (env vars, registry credentials, database
passwords, SMTP/GitHub/OIDC/webhook settings) under a new key in one
transaction, holding locks on the tables it rewrites. Stop the control plane
first — rotation gives up after 10 seconds if a running server holds those
tables. Use `cargod gen-key` to produce the new key first. See
[Operations & Hardening](/docs/operations/) for the full runbook.
