---
title: Upgrading
description: Pull, restart, done — migrations run at startup.
order: 13
section: Reference
---

Upgrading Cargo is a two-command operation:

```bash
docker compose pull && docker compose up -d
```

On a production install, add the same overlay flag you installed with — e.g.
`-f docker-compose.yml -f docker-compose.tls.yml` — so Traefik keeps its ACME
configuration.

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
