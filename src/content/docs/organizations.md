---
title: Organizations & Teams
description: Roles, email and link invites, and multi-org membership.
order: 10
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

Rules around roles and ownership:

- **Nobody grants a role above their own** — by role change or by invite
- **Only owners touch owners**: promoting someone to owner, changing an
  owner's role, removing an owner, or inviting an owner all require the
  owner role. An admin can't make themselves owner.
- The **last owner** can't be demoted or removed, even when two owners act at
  the same moment
- Only an **owner** can delete an organization

### Deleting an organization

Deleting an org stops and removes every app's containers — on the control
plane or whichever [worker host](/docs/deployments/#worker-hosts) runs them —
before the org and its records are gone, so nothing keeps serving its
domains. Two cases are refused:

- The org still has **managed databases** — `409 has_databases`. Delete them
  first; their data isn't removed implicitly.
- A worker host running one of its apps can't be reached — `502
  host_unavailable`, naming the app. Nothing is deleted, so you can retry.

## Invites

Invite teammates two ways, from **Members → Invite people**:

- **By email** — paste one or more addresses, pick a role, and Cargo emails
  each of them a branded invitation naming the org and who invited them.
  Requires [SMTP](/docs/administration/) to be configured on the instance.
- **By link** — create a shareable link instead, and pass it along however
  you like. No SMTP required.

Either way:

- Each invite has a chosen **role** and **expiry**, and is **revocable**
- The token is **shown once** at creation and stored hashed
- Email-addressed invites are **single-use and bound to the recipient's
  address** — they cannot be forwarded or reused
- Accepting a valid invite adds membership with the invite's role;
  re-accepting is a no-op
- Revoked, expired, or bogus tokens are rejected
- Only owner/admin can create, list, and revoke invites, and only an owner
  can invite someone as owner

### Accepting an invite

An invite link opens a **public preview page** — no sign-in needed to see
which organization you've been invited to and with what role. From there:

- **Already signed in?** The invite is accepted immediately and you land in
  the org.
- **New to this Cargo instance?** Register right on the page (the address is
  prefilled for email invites) and membership is granted as soon as the
  account exists — no separate sign-up detour.

Expired or revoked tokens show a plain "invalid or expired" message rather
than leaking anything about the org.

## Audit log

Org owners and admins can review every state-changing action taken in their
organization — who did what, to which resource, and when. That includes
actions on its apps, deployments, and databases (deploys, env changes,
attaches, deletes), which are attributed to the org that owns them. Entries are
append-only and retained for 180 days by default. See
[Operations & Hardening](/docs/operations/).

## Isolation

All org resources are invisible and inaccessible to non-members, enforced by
query scoping rather than just the UI: non-members get **404** (the resource
may as well not exist), never 403.

The instance admin can list all orgs and users but is **not implicitly a
member** of any org — see [Instance administration](/docs/administration/).
