---
title: Organizations & Teams
description: Roles, invite links, and multi-org membership.
order: 9
section: Platform
---

Organizations are Cargo's tenancy boundary: they own apps, domains,
databases, and members. Any user can create an organization and becomes its
**owner**. Users can belong to multiple orgs and switch between them in the
UI.

## Roles

| Role | Permissions |
|---|---|
| **Owner** | Everything, including deleting the org |
| **Admin** | Manage members, apps, and domains |
| **Member** | Create and deploy apps |
| **Viewer** | Read-only view of apps, deployments, and domains |

Two safety rules around ownership:

- Only the **owner** can delete an organization
- The **last owner** can't be demoted or removed

## Invite links

Invite teammates with **shareable links** — no SMTP required:

- Each invite has a chosen **role** and **expiry**, and is **revocable**
- The token is **shown once** at creation and stored hashed
- Accepting a valid invite adds membership with the invite's role;
  re-accepting is a no-op
- Revoked, expired, or bogus tokens are rejected
- Only owner/admin can create, list, and revoke invites

## Isolation

All org resources are invisible and inaccessible to non-members, enforced by
query scoping rather than just the UI: non-members get **404** (the resource
may as well not exist), never 403.

The instance admin can list all orgs and users but is **not implicitly a
member** of any org — see [Instance administration](/docs/administration/).
