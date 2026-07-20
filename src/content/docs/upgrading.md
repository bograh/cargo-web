---
title: Upgrading
description: Pull, restart, done — migrations run at startup.
order: 11
section: Reference
---

Upgrading Cargo is a two-command operation:

```bash
docker compose pull && docker compose up -d
```

- **Migrations run automatically at startup** — no manual migration step
- **Running user apps are not touched** — only the platform containers
  restart
- Target downtime for the platform UI is ≤ 2 minutes; your apps keep
  serving

<div class="callout callout--note">
  <span class="callout__title">Before you upgrade</span>
  <p>Make sure your <code>CARGO_MASTER_KEY</code> backup is safe and current.
  Encrypted secrets (env vars, registry credentials) are unrecoverable
  without it — see <a href="/docs/installation/">Installation</a>.</p>
</div>
