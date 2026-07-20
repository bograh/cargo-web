---
title: Instance Administration
description: The instance admin, settings UI, and account security.
order: 10
section: Platform
---

The **first registered account** on a Cargo instance becomes the instance
admin — bootstrap requires no CLI user-seeding.

## What the instance admin can do

- **Instance settings UI** — manage the apps-domain suffix, SMTP, and GitHub
  App credentials without reinstalling
- **List all organizations and users** across the instance

The instance admin is **not implicitly a member of any org** — org content
stays scoped to org members.

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
- **Rate limiting** on auth endpoints (register/login/refresh: 10/min per IP)
- Authentication sits behind an `AuthProvider` interface, so an OIDC
  provider can be added without refactoring callers
