---
title: Upgrading
description: Re-run the installer or pull and restart — migrations run at startup.
order: 13
section: Reference
---

The simplest upgrade is to run the install command again:

```bash
curl -fsSL https://usecargo.vercel.app/install.sh | sh
```

On a server that already has Cargo, the bootstrap updates the checkout in
`/opt/cargo` (or `CARGO_INSTALL_DIR`) and runs `deploy/install.sh --update`.
That keeps `.env` untouched — master key, database password, domains — picks
the compose overlay matching it, and runs `docker compose up -d --build`. From
an existing checkout you can do the same by hand:

```bash
git pull && ./deploy/install.sh --update
```

If you'd rather manage compose yourself, pulling the published image works
too:

```bash
docker compose pull && docker compose up -d
```

On a production install, add the same overlay flag you installed with — e.g.
`-f docker-compose.yml -f docker-compose.tls.yml` — so Traefik keeps its ACME
configuration.

<callout type="danger">
  **Never reinstall over an existing install**

  Don't delete `.env` and run a fresh install to "upgrade". A new
  `CARGO_MASTER_KEY` makes every stored secret unreadable, and the existing
  Postgres volume keeps its old password. `--update` and `--force` both keep
  the existing secrets for exactly this reason.
</callout>

- **Migrations run automatically at startup** — no manual migration step
- **Running user apps are not touched** — only the platform containers
  restart
- Target downtime for the platform UI is ≤ 2 minutes; your apps keep
  serving
- Shutdown is bounded to 30 seconds, and any deploy interrupted by the
  restart is either resumed by the job queue or failed cleanly with a reason
  — see [Deployments](/docs/deployments/)

<callout type="note">
  **Before you upgrade**

  Make sure your `CARGO_MASTER_KEY` backup is safe and current.
  Encrypted secrets (env vars, registry credentials) are unrecoverable
  without it — see [Installation](/docs/installation/). Cargo takes
  a daily control-plane backup on its own; you can force a fresh one from
  **Admin → Backups** before a major upgrade.
</callout>

<callout type="warning">
  **Invite-only default**

  Instances upgrading to the security-hardened release become
  **invite-only on restart**. If you relied on open sign-up, go to
  **Admin → Instance settings → Who can sign up** and set it back to
  **Anyone**.
</callout>

## Notes for this release

- **Migrations 00023–00025** add single-use GitHub setup links (and make an
  installation belong to one organization only — if two orgs were bound to the
  same installation, the earliest binding is kept), let worker hosts be deleted
  once their apps have moved, and track apps waiting to be removed from a host
  they moved off.
- **GitHub ownership checks** are opt-in for existing GitHub Apps: add the
  App's OAuth client ID and secret under **Admin → GitHub App** — see
  [Administration](/docs/administration/#github-app).
- **`CARGO_APPS_SUFFIX`** is now read by the control plane. It only seeds the
  apps-domain setting when none is stored, so upgrading never changes a suffix
  you set in the admin UI.
- **Image apps pull on every deploy**, so a deploy now needs the registry to
  be reachable.
