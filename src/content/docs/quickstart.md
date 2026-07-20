---
title: Quickstart
description: From first login to a live HTTPS app in minutes.
order: 3
section: Getting Started
---

This guide walks from a fresh install to a running app. The targets Cargo is
built against: install to platform reachable in **≤ 10 minutes**, first login
to a live app in **≤ 5 minutes** (plus build time).

## 1. Register

Open `https://<platform-domain>` and create an account. **The first
registered account becomes the instance admin** — no CLI user-seeding needed.

## 2. Create an organization

Organizations own apps, domains, databases, and members. Create one from the
UI; you become its **owner**. You can belong to multiple orgs and switch
between them later.

## 3. (Optional) Connect GitHub

To deploy from repositories, configure the GitHub App credentials from the
**admin area** (instance settings), then authorize/install the app on your
GitHub account or org. Skip this if you only plan to deploy registry images.

## 4. Create your first app

**From GitHub:** New App → GitHub source → pick a repo and branch. The
builder is auto-detected: your Dockerfile if the repo has one, Nixpacks
otherwise.

**From a registry:** New App → image source → enter a reference like
`ghcr.io/org/app:tag`. Private registries are supported with stored,
encrypted pull credentials.

Set the **exposed port** (and a healthcheck path if your app isn't `/`),
plus any environment variables — values are encrypted at rest and write-only
after saving.

## 5. Deploy

Hit **Deploy** and watch the build and deploy logs stream live. When the
deployment goes healthy, your app is live at:

```
https://<slug>.<apps-suffix>
```

## 6. Ship the next change

Push to the tracked branch — if auto-deploy is enabled, the GitHub webhook
(HMAC-validated) triggers a new deployment with live logs, and traffic
switches once it's healthy.

If a deploy goes bad: **app → Deployments → pick a previous successful
deployment → Rollback.** Rollback redeploys the retained image without
rebuilding, so you're live again within seconds.

## Where to next

- [Applications](/docs/applications/) — sources, builders, and settings
- [Deployments](/docs/deployments/) — the status machine and rollback
- [Domains & SSL](/docs/domains-ssl/) — custom domains and wildcard certs
- [Managed databases](/docs/databases/) — add Postgres or Redis
