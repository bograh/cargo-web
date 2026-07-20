# cargo-web

The website for [Cargo](https://github.com/bograh/cargo) — a self-hosted
Platform-as-a-Service (Vercel/Railway-like deployments on infrastructure you
own). Static [Astro](https://astro.build) site with the landing page and the
full Cargo documentation.

## What's inside

```text
src/
├── components/         # Site nav/footer + landing sections (hero, features, terminal demo, …)
├── content/docs/       # Documentation — 12 Markdown pages (content collection)
├── layouts/            # Layout.astro (site shell) + DocsLayout.astro (sidebar, prose, pager)
├── pages/              # index.astro (landing), docs/[...slug].astro, 404.astro
├── styles/global.css   # Design tokens & utilities (dark industrial freight theme)
└── content.config.ts   # Docs collection schema (title, description, order, section)
```

Docs pages are plain Markdown with frontmatter:

```yaml
---
title: Installation
description: Prerequisites and the one-command Cargo installer.
order: 2
section: Getting Started   # Getting Started | Core Concepts | Platform | Reference
---
```

Add a page by dropping a new `.md` file in `src/content/docs/` — the sidebar
and prev/next pager update automatically (sorted by `section`, then `order`).
Callouts are styled HTML divs: `<div class="callout callout--warning">…`
(also `--note`, `--danger`); deployment/domain states use
`<span class="badge badge--live">` (also `--building`, `--failed`, …).

Styling is hand-rolled CSS — no Tailwind, no JS frameworks. Fonts (Space
Grotesk, JetBrains Mono) are self-hosted via Fontsource. The only client-side
script is the install-command copy button.

## Commands

| Command | Action |
| :------ | :----- |
| `pnpm install` | Install dependencies |
| `pnpm dev` | Start the dev server at `localhost:4321` |
| `pnpm astro dev --background` | Start the dev server in the background (see AGENTS.md) |
| `pnpm build` | Build the production site to `./dist/` |
| `pnpm preview` | Preview the production build locally |
