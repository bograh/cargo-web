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

<div class="callout callout--note">
  <span class="callout__title">Before you upgrade</span>
  <p>Make sure your <code>CARGO_MASTER_KEY</code> backup is safe and current.
  Encrypted secrets (env vars, registry credentials) are unrecoverable
  without it — see <a href="/docs/installation/">Installation</a>. Cargo takes
  a daily control-plane backup on its own; you can force a fresh one from
  <strong>Admin → Backups</strong> before a major upgrade.</p>
</div>
