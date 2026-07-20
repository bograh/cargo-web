# cargo-web — Landing Page & Documentation Site Design

- **Date:** 2026-07-20
- **Status:** Approved (design review with user)
- **Subject project:** [Cargo](~/Code/cargo) — self-hosted PaaS (Go controlplane + Postgres + Traefik)

## 1. Overview

cargo-web is the public website for the Cargo project, built with Astro 7 (static output). It has two deliverables:

1. **Landing page** (`/`) — marketing page presenting Cargo: what it is, how it works, features, install command.
2. **Documentation** (`/docs/*`) — a full, multi-page documentation site whose every fact is sourced from the real Cargo repository (`README.md`, `PRD.md`, `PhasedPlans.md`, `deploy/install.sh`, `deploy/docker-compose.yml`, `deploy/docker-compose.dns01.yml`, `deploy/README.md`). No invented features, no invented flags or env vars.

Decisions locked with the user:

| Question | Decision |
|---|---|
| Docs content | Accurate product docs authored from the real repo |
| Docs structure | Multi-page with grouped sidebar nav |
| Visual direction | Dark, industrial cargo/freight theme |
| Styling | Hand-rolled CSS, no Tailwind, no JS frameworks |

## 2. Site map

- `/` — landing page
- `/docs/` — Introduction (docs index)
- `/docs/installation/`
- `/docs/quickstart/`
- `/docs/applications/`
- `/docs/deployments/`
- `/docs/domains-ssl/`
- `/docs/environment-variables/`
- `/docs/databases/`
- `/docs/organizations/`
- `/docs/administration/`
- `/docs/upgrading/`
- `/docs/architecture/`
- `/404.html` — themed not-found page

## 3. Technical architecture

### 3.1 Docs authoring: Astro Content Collections

- `src/content.config.ts` — `docs` collection via the glob loader over `src/content/docs/**/*.md`.
- Frontmatter schema (zod): `title: string`, `description: string`, `order: number`, `section: enum('Getting Started' | 'Core Concepts' | 'Platform' | 'Reference')`.
- `src/pages/docs/[...slug].astro` — rest-param route; `getStaticPaths()` maps every collection entry to its slug, plus an extra path with `slug: undefined` that renders the introduction entry at `/docs/` itself (no redirect, no separate index page).
- Sidebar data derived from the collection: group by `section` in fixed section order, sort entries by `order` within groups.
- Markdown rendered with Astro's built-in Shiki highlighting (github-dark-default or similar dark theme).

### 3.2 Layouts & components

- `src/layouts/Layout.astro` — HTML shell: fonts, global CSS, `<SiteNav>`, slot, `<SiteFooter>`. Props: `title`, `description`.
- `src/layouts/DocsLayout.astro` — wraps `Layout`: sidebar nav (grouped, active state), `<article class="prose">`, prev/next pager, on-page "last updated" not needed.
- `src/components/SiteNav.astro` — sticky top nav: container-mark logo + "Cargo", links (Docs, GitHub), "Get started" CTA. Mobile: simple horizontal wrap, no JS menu.
- `src/components/SiteFooter.astro` — links (Docs, Install, GitHub), stack credit line.
- Landing components (all `.astro`, zero client JS except copy):
  - `Hero.astro` — headline, subcopy, `InstallCommand.astro` (code + copy button, tiny inline `<script>`), secondary CTA to docs.
  - `ArchitectureStrip.astro` — three container cards (controlplane / db / traefik) with roles, dashed connectors.
  - `FeatureGrid.astro` — 8 feature cards (see §4.3).
  - `HowItWorks.astro` — 3-step flow, manifest-styled.
  - `TerminalDemo.astro` — install session in a terminal-chrome code block.
  - `FinalCta.astro` — repeat install command + docs link.
- Docs components: `Callout.astro` (`type: note|warning|danger`); fenced code blocks get terminal/mac chrome via CSS on `.prose pre`.
- `src/pages/404.astro` — themed lost-container page.

### 3.3 Fonts & assets

- `@fontsource/space-grotesk` (display/headings), `@fontsource/jetbrains-mono` (code), system-ui body stack. npm-installed, no CDN.
- Logo: inline SVG shipping-container mark (corrugated rectangle + wordmark). No raster assets required; `public/favicon.svg` replaces the default.

### 3.4 Design system (`src/styles/global.css`)

CSS custom properties:

- **Palette:** bg `#0b0c0e`, surface `#121316`, raised `#17181c`, border `#23252b`; text `#e8e9eb`, muted `#9aa0a8`; accent amber `#f5a524` (container-marking/hazard amber), accent-deep `#c47f12`; signal green `#3fb950` for "live" states; danger `#e5484d`.
- **Type scale:** fluid `clamp()` steps; headings Space Grotesk 600/700; code JetBrains Mono.
- **Motifs (all CSS, no images):**
  - Corrugated texture: `repeating-linear-gradient` vertical ribs on hero/containers.
  - Hazard stripes: 45° repeating gradient in amber/transparent, used sparingly (rules under section titles, warning callout edge).
  - Shipping-label chips: uppercase mono, dashed border, slight rotate — e.g. "SELF-HOSTED", "3 CONTAINERS".
  - Manifest tables: docs tables styled like freight manifests (uppercase mono header row, row rules).
  - Status badges: pill freight tags (`live` green, `building` amber, etc.) used in Deployments docs.
- Motion: none beyond hover transitions (opacity/color). No scroll animation libraries.

### 3.5 Client JS

Exactly one inline script: copy-to-clipboard for the install command (with `navigator.clipboard` fallback to `execCommand`). Everything else is static HTML/CSS.

## 4. Page designs

### 4.1 Landing (`/`)

Sections in order:

1. **Nav** — sticky, blurred bg.
2. **Hero** — chip "SELF-HOSTED PAAS"; H1 "Your own Vercel, on your own hardware."; sub: one-command install, GitHub-to-HTTPS in minutes, three containers; `InstallCommand` (`cd deploy && ./install.sh` per the real repo) + "Read the docs" ghost button; corrugated container backdrop.
3. **Architecture strip** — "Exactly three platform containers": `controlplane` (Go binary: API, embedded UI, job queue, deploy engine), `db` (Postgres 16: state + queue, auto migrations), `traefik` (only published ports 80/443, Let's Encrypt). Dashed connectors; "+ one container per app you deploy" note.
4. **How it works** — 1. Install (one script, prompts for domains, generates mode-0600 secrets); 2. Connect a repo (GitHub App, or any registry image); 3. Ship (`https://<app>.<apps-domain>` with automatic SSL).
5. **Feature grid** (8 cards):
   - Push to deploy — GitHub App webhooks, HMAC-validated; manual deploys too.
   - Dockerfile or Nixpacks — auto-detected builder; custom context/Dockerfile path/build args.
   - Automatic HTTPS — wildcard DNS-01 or per-domain HTTP-01; custom domains included.
   - Live build & deploy logs — streamed over SSE, retained per deployment.
   - Encrypted env vars — AES-256-GCM at rest, write-only after saving.
   - One-click rollback — redeploys a retained image in seconds, no rebuild.
   - Managed databases — Postgres 16/17 and Redis 7, attach to inject `DATABASE_URL`/`REDIS_URL`.
   - Teams & roles — organizations with owner/admin/member/viewer and shareable invite links.
6. **Terminal demo** — install.sh session: dependency checks, prompts, `.env (mode 0600)`, master-key backup banner, stack up, "Open https://cargo.example.com".
7. **Final CTA + footer.**

### 4.2 Docs pages (content outline; facts → source file)

Section grouping: **Getting Started** (Introduction, Installation, Quickstart) · **Core Concepts** (Applications, Deployments, Domains & SSL, Environment Variables) · **Platform** (Databases, Organizations, Administration) · **Reference** (Upgrading, Architecture).

1. **Introduction** — what Cargo is (self-hosted PaaS in the spirit of Dokploy/Coolify); capability bullets; architecture-at-a-glance table (3 containers); who it's for. *(README.md)*
2. **Installation** — prerequisites (Docker Engine + compose plugin; DNS: `<platform-domain>` and `*.<apps-domain>` A records; ports 80/443 open); `./install.sh` flow (dependency checks → prompts → secrets → `up -d`); non-interactive env vars `CARGO_PLATFORM_DOMAIN`, `CARGO_APPS_SUFFIX`, `CARGO_ACME_EMAIL`, optional `CARGO_DNS_PROVIDER`; flags `--force`, `--no-up`; **danger callout:** back up `CARGO_MASTER_KEY` — encrypted secrets unrecoverable without it; first registered account becomes instance admin. *(deploy/install.sh, deploy/README.md, README.md)*
3. **Quickstart** — register → create org → (optional) GitHub App in admin settings → New App (GitHub repo+branch or registry image) → set port/env → Deploy → live at `https://<slug>.<apps-suffix>`; NFR time targets (install ≤10 min, first deploy ≤5 min + build). *(PRD §7, README.md)*
4. **Applications** — sources: GitHub (Dockerfile if present, else Nixpacks; custom context path, Dockerfile path, build args) or registry image incl. private registries with encrypted stored pull credentials; app settings: unique slug, exposed port, healthcheck path, auto-deploy toggle. *(PRD FR-3)*
5. **Deployments** — triggers (webhook HMAC-validated, manual, rollback); status machine `queued → building → deploying → live | failed | cancelled`; SSE live logs retained per deployment; build concurrency cap (default 2), deploys serialized per app; failed builds never affect the running app; rollback redeploys retained image without rebuild; **warning callout:** known limitation — apply step recreates the container (brief downtime; failed healthcheck leaves app down until rollback; zero-downtime is Phase 3). *(PRD FR-4)*
6. **Domains & SSL** — auto subdomain `<slug>.<apps-suffix>` at creation; attach/remove custom domains (applied on next reconcile); HTTP-01 (default, per-domain certs, LE rate limits) vs wildcard DNS-01 (recommended: `docker-compose.dns01.yml` overlay, `CARGO_DNS_PROVIDER` = Traefik provider name e.g. `cloudflare`, provider creds e.g. `CF_DNS_API_TOKEN`); custom domains always HTTP-01; domain status `active / pending / misconfigured` from periodic DNS+HTTPS checks. *(PRD FR-5, deploy/README.md)*
7. **Environment variables** — per-app key/value; AES-256-GCM at rest; write-only after saving; changes apply on next deploy/reconcile. *(PRD FR-6)*
8. **Managed databases** — per-org Postgres 16/17 and Redis 7 from the UI; attaching grants per-app isolated credentials and injects `DATABASE_URL`/`REDIS_URL` at deploy time; one attachment per engine per app; volumes `<dataDir>/databases/<id>`; manual snapshots (`pg_dumpall --clean`; `BGSAVE`+`LASTSAVE` copy of `dump.rdb`) to `<dataDir>/db-backups/<id>/`, downloadable; provisioning logs `<dataDir>/db-logs/`; **warning callout:** optional host-port exposure reachable outside the docker network. *(README.md §Managed databases)*
9. **Organizations & teams** — creator becomes owner; roles owner/admin/member/viewer with permission summary; shareable invite links (role + expiry, revocable, token shown once, stored hashed); multi-org membership and switching; non-members get 404 (invisible), never 403; only owner deletes org; last owner can't be demoted/removed. *(PRD FR-2, PhasedPlans §1.4–1.5)*
10. **Instance administration** — first registered user is instance admin; settings UI (apps-domain suffix, SMTP, GitHub App credentials); list all orgs/users; admin not implicitly a member of any org; security notes: argon2id hashing, cookie sessions with refresh-token rotation + reuse detection, auth rate limiting (10/min). *(PRD FR-1, FR-7; PhasedPlans §1)*
11. **Upgrading** — `docker compose pull && docker compose up -d`; migrations run automatically at startup; running user apps untouched; reiterate master-key backup. *(README.md §Upgrade, deploy/README.md)*
12. **Architecture** — exactly three platform containers + one per app; controlplane (single Go binary: chi API, embedded React SPA via `go:embed`, River job queue on Postgres, deploy engine; mounts Docker socket); db (Postgres 16; goose migrations embedded, run at startup; sqlc typed queries); traefik v3 (only published ports, Docker provider on `cargo-proxy` network, label-configured routing — platform UI dogfooded through Traefik); stack table (Go chi/River/goose/sqlc · React/Vite/TS/Tailwind/shadcn/ui/TanStack Query); state & volumes (`cargo-db`, `cargo-data`, `cargo-acme`; `<dataDir>` subdirs); production image `ghcr.io/bograh/cargo:latest`; development (`docker-compose.dev.yml` → http://localhost:8080; `go test ./...`; `npm test` in `web/`; `scripts/smoke.sh` e2e). *(README.md, PRD §11, deploy/docker-compose.yml, PhasedPlans §0)*

## 5. Error handling & edge cases

- Unknown URLs → themed `404.astro` with links home/docs.
- Docs sidebar active state derived from current slug; prev/next computed from flattened ordered list (no dangling links).
- Mobile (<900px): docs sidebar collapses to a horizontal scroll strip above the article; landing grids stack.
- Copy button degrades gracefully without `navigator.clipboard` (fallback path; no crash on non-secure contexts).

## 6. Verification

- `astro build` completes with zero errors; `dist/` contains all 13 routes + 404.
- `astro dev --background` + curl: `/`, `/docs/`, each docs page return 200 and contain expected headings.
- Links: nav/footer/docs sidebar hrefs all resolve to built routes.
- No external network requests at runtime (fonts self-hosted via Fontsource).

## 7. Out of scope

- Search, versioning, i18n, blog/changelog, OG-image generation, analytics.
- Editing or mirroring the cargo repo's own markdown files (PRD/PhasedPlans) — docs are authored, not embedded.
