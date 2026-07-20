# cargo-web Landing Page & Docs Site Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Cargo landing page (`/`) and a 12-page documentation site (`/docs/*`) in the Astro 7 project at `/home/bograh/Code/cargo-web`, per spec `docs/superpowers/specs/2026-07-20-cargo-web-design.md`.

**Architecture:** Static Astro site. Docs authored as Markdown in a content collection (`src/content/docs/*.md`), rendered through a shared `DocsLayout` with grouped sidebar + prev/next pager. Landing composed of section `.astro` components. Hand-rolled CSS in `src/styles/global.css`; zero client JS except one copy-to-clipboard script.

**Tech Stack:** Astro 7, `@fontsource/space-grotesk`, `@fontsource/jetbrains-mono`, Shiki (built into Astro). Package manager: **pnpm**.

## Global Constraints

- Every docs fact must match the cargo repo (`/home/bograh/Code/cargo`): `README.md`, `PRD.md`, `deploy/install.sh`, `deploy/docker-compose.yml`, `deploy/README.md`. No invented flags, env vars, or features.
- Docs frontmatter schema: `title` (string), `description` (string), `order` (number), `section` (one of `Getting Started`, `Core Concepts`, `Platform`, `Reference`).
- Sidebar section order is fixed: `Getting Started` → `Core Concepts` → `Platform` → `Reference`.
- No Tailwind, no JS frameworks, no CDN fonts. Only runtime script: copy button.
- Palette tokens: `--bg:#0b0c0e`, `--surface:#121316`, `--raised:#17181c`, `--border:#23252b`, `--text:#e8e9eb`, `--muted:#9aa0a8`, `--amber:#f5a524`, `--amber-deep:#c47f12`, `--green:#3fb950`, `--danger:#e5484d`.
- GitHub URL used site-wide: `https://github.com/bograh/cargo`.
- **No git commits during execution** unless the user explicitly asks (agent policy overrides the template's commit steps).
- Verify with `pnpm astro build` (must exit 0) and greps against `dist/` output.

---

### Task 1: Project setup & design tokens

**Files:**
- Modify: `package.json` (via pnpm add)
- Modify: `astro.config.mjs`
- Create: `src/styles/global.css`
- Create: `public/favicon.svg`
- Delete: `src/components/Welcome.astro`, `src/assets/background.svg`, `src/assets/astro.svg`

**Interfaces:**
- Produces: CSS custom properties + utility classes used by all later tasks: `.wrap` (max-width 72rem, centered, padding-inline 1.25rem), `.btn`, `.btn--primary`, `.btn--ghost`, `.chip` (uppercase mono dashed-border label), `.card`, `.hazard` (45° amber stripe rule). Font families: `--font-display:'Space Grotesk'`, `--font-mono:'JetBrains Mono'`.

- [ ] **Step 1: Install fonts**

Run: `pnpm add @fontsource/space-grotesk @fontsource/jetbrains-mono`
Expected: both appear in `package.json` dependencies.

- [ ] **Step 2: Configure Shiki theme**

`astro.config.mjs`:

```js
// @ts-check
import { defineConfig } from 'astro/config';

// https://astro.build/config
export default defineConfig({
  markdown: {
    shikiConfig: { theme: 'github-dark-default' },
  },
});
```

- [ ] **Step 3: Delete default template files**

Run: `rm src/components/Welcome.astro src/assets/background.svg src/assets/astro.svg`

- [ ] **Step 4: Write `public/favicon.svg`** — corrugated container mark:

```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">
  <rect width="32" height="32" rx="6" fill="#0b0c0e"/>
  <rect x="5" y="9" width="22" height="14" rx="1.5" fill="none" stroke="#f5a524" stroke-width="2"/>
  <path d="M9 9v14M13 9v14M17 9v14M21 9v14" stroke="#f5a524" stroke-width="1.4"/>
</svg>
```

- [ ] **Step 5: Write `src/styles/global.css`**

Contents (in order):
1. Font-face handled by Fontsource imports in `Layout.astro` (Task 2) — not here.
2. `:root` tokens: the palette above; fonts `--font-display:'Space Grotesk',system-ui,sans-serif`, `--font-body:system-ui,-apple-system,'Segoe UI',sans-serif`, `--font-mono:'JetBrains Mono',ui-monospace,monospace`; `--radius:10px`.
3. Reset/base: `*,*::before,*::after{box-sizing:border-box}`, `body{margin:0;background:var(--bg);color:var(--text);font-family:var(--font-body);line-height:1.6;-webkit-font-smoothing:antialiased}`, `h1..h4{font-family:var(--font-display);line-height:1.15;letter-spacing:-0.01em}`, `a{color:inherit}`, `code,pre{font-family:var(--font-mono)}`, `::selection{background:rgba(245,165,36,.28)}`.
4. Utilities: `.wrap{max-width:72rem;margin-inline:auto;padding-inline:1.25rem}`; `.btn{display:inline-flex;align-items:center;gap:.5rem;padding:.65rem 1.2rem;border-radius:var(--radius);font-weight:600;text-decoration:none;border:1px solid transparent;transition:...}`; `.btn--primary{background:var(--amber);color:#14100a}` hover `var(--amber-deep)`; `.btn--ghost{border-color:var(--border);color:var(--text)}` hover `border-color:var(--amber)`; `.chip{display:inline-block;font-family:var(--font-mono);font-size:.72rem;letter-spacing:.14em;text-transform:uppercase;border:1px dashed color-mix(in srgb,var(--amber) 60%,transparent);color:var(--amber);padding:.3rem .7rem;border-radius:4px}`; `.card{background:var(--surface);border:1px solid var(--border);border-radius:var(--radius)}`; `.hazard{height:6px;background:repeating-linear-gradient(45deg,var(--amber) 0 12px,transparent 12px 24px);border-radius:2px}`.
5. Focus-visible outlines in amber.

- [ ] **Step 6: Verify build still passes**

Run: `pnpm astro build`
Expected: exit 0 (existing index.astro untouched at this point).

---

### Task 2: Site shell (Layout, Nav, Footer)

**Files:**
- Create: `src/layouts/Layout.astro` (overwrite existing stub)
- Create: `src/components/SiteNav.astro`
- Create: `src/components/SiteFooter.astro`

**Interfaces:**
- `Layout.astro` props: `{ title: string; description?: string }`. Emits `<html><head>…</head><body><SiteNav/><main><slot/></main><SiteFooter/></body></html>`. Imports Fontsource css: `@fontsource/space-grotesk/500.css`, `/600.css`, `/700.css`; `@fontsource/jetbrains-mono/400.css`, `/500.css`, `/700.css`; and `../styles/global.css`.
- `SiteNav.astro` props: none. Sticky header, blurred bg: logo (inline SVG container mark, same as favicon + wordmark "Cargo"), links `Docs → /docs/`, `GitHub → https://github.com/bograh/cargo` (external), CTA `Get started → /docs/installation/`.
- `SiteFooter.astro`: three link groups (Product: Docs, Installation, Architecture; Project: GitHub; Resources: PRD/roadmap links to GitHub paths — just GitHub + Docs), bottom line "Cargo — self-hosted PaaS. Three containers, zero YAML.".

- [ ] **Step 1: Write `src/layouts/Layout.astro`**

```astro
---
import '@fontsource/space-grotesk/500.css';
import '@fontsource/space-grotesk/600.css';
import '@fontsource/space-grotesk/700.css';
import '@fontsource/jetbrains-mono/400.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/700.css';
import '../styles/global.css';
import SiteNav from '../components/SiteNav.astro';
import SiteFooter from '../components/SiteFooter.astro';

interface Props {
  title: string;
  description?: string;
}
const { title, description = 'Cargo — a self-hosted PaaS. Ship apps from GitHub to HTTPS URLs on infrastructure you own.' } = Astro.props;
---
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="description" content={description} />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <title>{title}</title>
  </head>
  <body>
    <SiteNav />
    <main><slot /></main>
    <SiteFooter />
  </body>
</html>
```

- [ ] **Step 2: Write `src/components/SiteNav.astro`** — sticky `.nav` with `.wrap` inner, logo SVG, links, `.btn .btn--primary` CTA; styles scoped in-component (bg `color-mix(in srgb, var(--bg) 82%, transparent)` + `backdrop-filter:blur(10px)`, bottom border `var(--border)`).

- [ ] **Step 3: Write `src/components/SiteFooter.astro`** — `.footer` with top border, link columns, muted small print.

- [ ] **Step 4: Point `src/pages/index.astro` at the new shell temporarily**

Replace its contents with `<Layout title="Cargo">Hello</Layout>` pattern (import Layout). Verify:

Run: `pnpm astro build`
Expected: exit 0; `dist/index.html` contains `<title>Cargo</title>`.

---

### Task 3: Landing page

**Files:**
- Create: `src/components/landing/InstallCommand.astro`
- Create: `src/components/landing/Hero.astro`
- Create: `src/components/landing/ArchitectureStrip.astro`
- Create: `src/components/landing/HowItWorks.astro`
- Create: `src/components/landing/FeatureGrid.astro`
- Create: `src/components/landing/TerminalDemo.astro`
- Create: `src/components/landing/FinalCta.astro`
- Overwrite: `src/pages/index.astro`
- Append: `src/styles/global.css` (landing section styles, or scoped styles per component — prefer scoped)

**Interfaces:**
- `InstallCommand.astro` props: `{ command?: string }` default `cd deploy && ./install.sh`. Renders a mono bar with the command and a `<button data-copy>`; one inline `<script>` handling all `[data-copy]` buttons via `navigator.clipboard.writeText` with `document.execCommand` fallback; button label flips to "Copied" for 1.5s.
- All other landing components: no props; pure markup + scoped styles.

- [ ] **Step 1: Write `InstallCommand.astro`** per interface above.

- [ ] **Step 2: Write `Hero.astro`**

- `.chip` reading `SELF-HOSTED PAAS`.
- H1: `Your own Vercel, on your own hardware.`
- Sub: `Cargo is a self-hosted platform-as-a-service: one install script, then ship apps from a GitHub repo or container registry to a running HTTPS URL — no SSH, no YAML, no proxy config. Exactly three containers on a server you own.`
- `<InstallCommand />` + ghost button `Read the docs → /docs/`.
- Background: corrugated ribs via `repeating-linear-gradient(90deg, rgba(255,255,255,.025) 0 2px, transparent 2px 14px)` over a radial amber glow, masked at edges.

- [ ] **Step 3: Write `ArchitectureStrip.astro`**

Section title `Exactly three platform containers` + `.hazard` rule. Three `.card`s with dashed connector line behind (pseudo-element):
1. `controlplane` — `Single Go binary: API, embedded React UI, job queue, deploy engine.`
2. `db` — `Postgres 16 — platform state, job queue, migrations at startup.`
3. `traefik` — `Reverse proxy. The only container publishing host ports (80/443); automatic Let's Encrypt certificates.`
Footnote: `+ one container per app you deploy.`

- [ ] **Step 4: Write `HowItWorks.astro`**

Three numbered manifest-style steps: `01 Install` (`One script checks dependencies, prompts for your domains, generates mode-0600 secrets, and starts the stack.`), `02 Connect` (`Authorize the GitHub App and pick a repo + branch — or deploy any registry image directly.`), `03 Ship` (`Cargo builds, deploys, and serves your app at https://<app>.<apps-domain> with automatic SSL.`).

- [ ] **Step 5: Write `FeatureGrid.astro`** — 8 cards, title + one-liner each:

1. **Push to deploy** — `GitHub App webhooks (HMAC-validated) redeploy on every push to the tracked branch. Manual deploys too.`
2. **Dockerfile or Nixpacks** — `Builder auto-detected: your Dockerfile if present, Nixpacks otherwise. Custom context, Dockerfile path, and build args supported.`
3. **Automatic HTTPS** — `Wildcard DNS-01 or per-domain HTTP-01 via Let's Encrypt. Custom domains attach in one click.`
4. **Live build & deploy logs** — `Streamed live over SSE and retained per deployment.`
5. **Encrypted env vars** — `AES-256-GCM at rest. Values are write-only after saving.`
6. **One-click rollback** — `Redeploy any previous deployment's retained image in seconds — no rebuild.`
7. **Managed databases** — `Provision Postgres 16/17 and Redis 7 per org; attaching injects DATABASE_URL or REDIS_URL.`
8. **Teams & roles** — `Organizations with owner/admin/member/viewer roles and shareable invite links.`

- [ ] **Step 6: Write `TerminalDemo.astro`**

Terminal chrome (three dots, title `deploy/`). Body:

```
$ ./install.sh
==> Platform domain: cargo.example.com
==> Apps domain suffix: apps.example.com
==> Email for Let's Encrypt certificates: ops@example.com
==> DNS provider for wildcard certs (empty = per-domain HTTP-01):
==> wrote .env (mode 0600)

  BACK UP CARGO_MASTER_KEY FROM .env SOMEWHERE SAFE.

==> starting Cargo…
[+] Running 4/4  ✔ traefik  ✔ controlplane  ✔ db
==> done. Open https://cargo.example.com and register — the first account becomes the instance admin.
```

- [ ] **Step 7: Write `FinalCta.astro`** — H2 `Ship your first app in ten minutes.`, `<InstallCommand />`, ghost `Read the documentation → /docs/`.

- [ ] **Step 8: Write `src/pages/index.astro`** composing all sections inside `Layout` (title `Cargo — Your own Vercel, on your own hardware`).

- [ ] **Step 9: Verify**

Run: `pnpm astro build`
Expected: exit 0. Then `grep -c "Your own Vercel" dist/index.html` → ≥1; `grep -c "Managed databases" dist/index.html` → ≥1.

---

### Task 4: Docs system (collection, layout, route, callout)

**Files:**
- Create: `src/content.config.ts`
- Create: `src/components/Callout.astro`
- Create: `src/layouts/DocsLayout.astro`
- Create: `src/pages/docs/[...slug].astro`
- Create: `src/content/docs/installation.md` (exemplar — full content below)
- Append: prose + docs CSS (scoped in DocsLayout where possible)

**Interfaces:**
- Collection `docs`: glob loader `src/content/docs/**/*.md`; zod schema per Global Constraints. Entry `id` = filename without extension (e.g. `installation`).
- `Callout.astro` props: `{ type?: 'note' | 'warning' | 'danger'; title?: string }`; slot body. Left border + icon glyph per type (`note`=amber, `warning`=amber with hazard edge, `danger`=red).
- `DocsLayout.astro` props: `{ entry: DocEntry; headings: {depth:number;slug:string;text:string}[] }` where `DocEntry` = collection entry. Internally calls `getCollection('docs')`, sorts by `section` order then `order`, renders: sidebar (section headings + links, `.active` when `link.id === entry.id`, links to `/docs/${id}/` except introduction → `/docs/`), `<article class="prose">` with slot, prev/next pager across the flattened ordered list.
- `[...slug].astro`: `getStaticPaths()` returns every entry at `{ params:{ slug: entry.id } }` plus the introduction entry at `{ params:{ slug: undefined } }` (renders `/docs/`).
- Prose CSS targets `.prose` children: headings with anchor offset, `pre.astro-code` terminal chrome (rounded, border, dark `#0d1117`-ish), inline `code` chips, manifest tables (mono uppercase `thead`), callouts, status-badge spans.

- [ ] **Step 1: Write `src/content.config.ts`**

```ts
import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

const docs = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/docs' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    order: z.number(),
    section: z.enum(['Getting Started', 'Core Concepts', 'Platform', 'Reference']),
  }),
});

export const collections = { docs };
```

- [ ] **Step 2: Write `src/components/Callout.astro`** per interface.

- [ ] **Step 3: Write `src/layouts/DocsLayout.astro`**

Skeleton:

```astro
---
import { getCollection } from 'astro:content';
import Layout from './Layout.astro';

const SECTION_ORDER = ['Getting Started', 'Core Concepts', 'Platform', 'Reference'];
const { entry, headings } = Astro.props;

const all = await getCollection('docs');
const sorted = all.sort((a, b) =>
  SECTION_ORDER.indexOf(a.data.section) - SECTION_ORDER.indexOf(b.data.section) ||
  a.data.order - b.data.order
);
const hrefFor = (id: string) => (id === 'introduction' ? '/docs/' : `/docs/${id}/`);
const idx = sorted.findIndex((e) => e.id === entry.id);
const prev = idx > 0 ? sorted[idx - 1] : undefined;
const next = idx < sorted.length - 1 ? sorted[idx + 1] : undefined;
const groups = SECTION_ORDER.map((s) => ({ name: s, items: sorted.filter((e) => e.data.section === s) }));
---
<Layout title={`${entry.data.title} — Cargo Docs`} description={entry.data.description}>
  <div class="docs-shell wrap">
    <aside class="docs-sidebar">
      {groups.map((g) => (
        <nav>
          <h2>{g.name}</h2>
          <ul>
            {g.items.map((e) => (
              <li><a href={hrefFor(e.id)} class:list={[{ active: e.id === entry.id }]}>{e.data.title}</a></li>
            ))}
          </ul>
        </nav>
      ))}
    </aside>
    <article class="prose">
      <h1>{entry.data.title}</h1>
      <slot />
      <div class="pager">
        {prev && <a href={hrefFor(prev.id)}>← {prev.data.title}</a>}
        {next && <a href={hrefFor(next.id)}>{next.data.title} →</a>}
      </div>
    </article>
  </div>
</Layout>
```

Plus scoped CSS: `.docs-shell{display:grid;grid-template-columns:15rem 1fr;gap:2.5rem;padding-block:2.5rem}`; sticky sidebar; mobile (<900px) collapses to a single column with the sidebar as a horizontal scroll strip; full `.prose` typography (headings, links amber, `pre.astro-code` chrome with border + radius + padding, inline code chips, manifest tables, `.pager` split row).

- [ ] **Step 4: Write `src/pages/docs/[...slug].astro`**

```astro
---
import { getCollection, render } from 'astro:content';
import DocsLayout from '../../layouts/DocsLayout.astro';

export async function getStaticPaths() {
  const docs = await getCollection('docs');
  const paths = docs.map((entry) => ({ params: { slug: entry.id }, props: { entry } }));
  const intro = docs.find((e) => e.id === 'introduction');
  if (intro) paths.unshift({ params: { slug: undefined }, props: { entry: intro } });
  return paths;
}

const { entry } = Astro.props;
const { Content, headings } = await render(entry);
---
<DocsLayout entry={entry} headings={headings}>
  <Content />
</DocsLayout>
```

- [ ] **Step 5: Write exemplar `src/content/docs/installation.md`**

Frontmatter: `title: Installation`, `description: Prerequisites and the one-command Cargo installer.`, `order: 2`, `section: Getting Started`.

Body requirements (facts from `deploy/install.sh`, `deploy/README.md`, `README.md`):
- Prerequisites list: Linux host with Docker Engine + compose plugin; DNS records `<platform-domain>` → server IP and `*.<apps-domain>` → server IP; ports 80 and 443 open.
- Quick install code block: `cd deploy` / `./install.sh`.
- What the installer does (ordered): dependency checks (docker, compose plugin, daemon reachable); prompts for platform domain, apps suffix, Let's Encrypt email, optional DNS provider; generates `CARGO_MASTER_KEY` (64 hex chars) and `CARGO_DB_PASSWORD` into a mode-0600 `.env`; prints DNS records to verify; starts the stack.
- Danger callout: back up `CARGO_MASTER_KEY` — encrypted env vars and credentials are unrecoverable without it.
- Non-interactive table: `CARGO_PLATFORM_DOMAIN`, `CARGO_APPS_SUFFIX`, `CARGO_ACME_EMAIL`, optional `CARGO_DNS_PROVIDER` (+ provider credential env vars, e.g. `CF_DNS_API_TOKEN`).
- Flags table: `--force` (overwrite existing `.env` — changes secrets), `--no-up` (write `.env` without launching).
- After install: open `https://<platform-domain>` and register — first account becomes the instance admin.

- [ ] **Step 6: Verify**

Run: `pnpm astro build`
Expected: exit 0; `dist/docs/index.html` and `dist/docs/installation/index.html` exist; `grep -c "CARGO_MASTER_KEY" dist/docs/installation/index.html` ≥ 1; sidebar markup contains `Getting Started`.

---

### Task 5: Docs — Getting Started (introduction, quickstart)

**Files:**
- Create: `src/content/docs/introduction.md` (`order: 1`, `section: Getting Started`)
- Create: `src/content/docs/quickstart.md` (`order: 3`, `section: Getting Started`)

**Interfaces:** Consumes Task 4's docs system.

- [ ] **Step 1: `introduction.md`** — what Cargo is (self-hosted PaaS in the spirit of Dokploy/Coolify; Vercel/Railway-like UX on infrastructure you own); capability bullets (GitHub repos with Dockerfile/Nixpacks auto-detection or registry images; `https://<app>.<apps-domain>` with automatic SSL + custom domains; live build/deploy logs, encrypted env vars, one-click rollback; orgs with roles + invite links; push-to-deploy webhooks; managed Postgres/Redis); architecture-at-a-glance manifest table (controlplane / db / traefik, exactly as spec §4.2.1); link to Installation.

- [ ] **Step 2: `quickstart.md`** — bootstrap flow: open platform domain → register (first account = instance admin) → create org → optional: configure GitHub App in admin settings → New App → GitHub source (authorize app, pick repo + branch; builder auto-detected) or registry image → set exposed port (+ env vars) → Deploy → watch live logs → live at `https://<slug>.<apps-suffix>`; note targets: install ≤ 10 min, first login → live app ≤ 5 min + build time; push-to-deploy and rollback flow summaries.

- [ ] **Step 3: Verify** — `pnpm astro build` exit 0; `dist/docs/index.html` contains `self-hosted`; `dist/docs/quickstart/index.html` exists.

---

### Task 6: Docs — Core Concepts

**Files** (all `section: Core Concepts`):
- Create: `src/content/docs/applications.md` (`order: 4`)
- Create: `src/content/docs/deployments.md` (`order: 5`)
- Create: `src/content/docs/domains-ssl.md` (`order: 6`)
- Create: `src/content/docs/environment-variables.md` (`order: 7`)

- [ ] **Step 1: `applications.md`** — sources: GitHub repo + branch (Dockerfile if present, else Nixpacks; custom context path, Dockerfile path, build args) or registry image (e.g. `ghcr.io/org/app:tag`) incl. private registries with encrypted stored pull credentials; settings table: unique slug, exposed port, healthcheck path, auto-deploy toggle. (PRD FR-3)

- [ ] **Step 2: `deployments.md`** — triggers (GitHub webhook HMAC-validated, manual button, rollback); status machine `queued → building → deploying → live | failed | cancelled` rendered as a mono flow line with status badges; SSE live logs retained per deployment (last N); build concurrency cap default 2; deploys serialized per app; failed build never affects the running app; rollback redeploys retained image without rebuilding; warning callout: apply step recreates the container — brief downtime per deploy; failed healthcheck leaves the app down until rollback; zero-downtime is a later phase. (PRD FR-4)

- [ ] **Step 3: `domains-ssl.md`** — every app gets `<slug>.<apps-suffix>` at creation; attach/remove custom domains, applied on next reconcile; SSL modes table: HTTP-01 default (no DNS API, per-domain certs, LE rate limits with many apps) vs wildcard DNS-01 recommended (run with `-f docker-compose.yml -f docker-compose.dns01.yml`, set `CARGO_DNS_PROVIDER` e.g. `cloudflare` + provider credentials e.g. `CF_DNS_API_TOKEN`); custom domains always HTTP-01 once DNS points at the server; domain status `active / pending / misconfigured` from periodic DNS + HTTPS checks. (PRD FR-5, deploy/README.md)

- [ ] **Step 4: `environment-variables.md`** — per-app key/value; AES-256-GCM encrypted at rest; write-only after saving; changes apply on next deploy/reconcile. (PRD FR-6)

- [ ] **Step 5: Verify** — build exit 0; all four `dist/docs/*/index.html` exist; `grep -c "DNS-01" dist/docs/domains-ssl/index.html` ≥ 1.

---

### Task 7: Docs — Platform

**Files** (all `section: Platform`):
- Create: `src/content/docs/databases.md` (`order: 8`)
- Create: `src/content/docs/organizations.md` (`order: 9`)
- Create: `src/content/docs/administration.md` (`order: 10`)

- [ ] **Step 1: `databases.md`** — per-org managed Postgres (16/17) and Redis (7) from the UI; attach to an app → per-app isolated credentials; injects `DATABASE_URL` (Postgres) / `REDIS_URL` (Redis) at deploy time; one attachment per engine per app; volumes under `<dataDir>/databases/<id>`; manual snapshots (`pg_dumpall --clean` for Postgres; `BGSAVE` + `LASTSAVE` copy of `dump.rdb` for Redis) written to `<dataDir>/db-backups/<id>/` and downloadable from the UI; provisioning logs in `<dataDir>/db-logs/`; warning callout: optional host-port exposure makes the instance reachable from outside the docker network. (README §Managed databases)

- [ ] **Step 2: `organizations.md`** — any user can create an org and becomes owner; roles table (owner: everything incl. delete org; admin: manage members/apps/domains; member: create/deploy apps; viewer: read-only); invite links with role + expiry, revocable, token shown once and stored hashed; multi-org membership + switching; non-members get 404 (resources invisible), never 403; only the owner deletes an org; the last owner can't be demoted or removed. (PRD FR-2, PhasedPlans §1.4–1.5)

- [ ] **Step 3: `administration.md`** — first registered user becomes instance admin; instance settings UI (apps-domain suffix, SMTP, GitHub App credentials); list all organizations and users; the instance admin is not implicitly a member of any org; security notes: argon2id password hashing, cookie sessions with refresh-token rotation and reuse detection (family-wide revocation), auth endpoints rate-limited (10/min per IP). (PRD FR-1, FR-7; PhasedPlans §1)

- [ ] **Step 4: Verify** — build exit 0; three new `dist/docs/*/index.html` exist; `grep -c "REDIS_URL" dist/docs/databases/index.html` ≥ 1.

---

### Task 8: Docs — Reference

**Files** (all `section: Reference`):
- Create: `src/content/docs/upgrading.md` (`order: 11`)
- Create: `src/content/docs/architecture.md` (`order: 12`)

- [ ] **Step 1: `upgrading.md`** — code block `docker compose pull && docker compose up -d`; migrations run automatically at startup; running user apps are not touched; reminder callout to keep the `CARGO_MASTER_KEY` backup safe across upgrades. (README §Upgrade)

- [ ] **Step 2: `architecture.md`** — exactly three platform containers + one per deployed app; container cards/table: controlplane (single Go binary: chi API, embedded React SPA via `go:embed`, River job queue on Postgres, deploy engine; mounts the Docker socket); db (Postgres 16; goose migrations embedded and run at startup; sqlc typed queries); traefik v3 (only container publishing host ports 80/443; Docker provider on the `cargo-proxy` network; routing entirely via container labels — the platform UI is dogfooded through Traefik like any app); stack table (Backend: Go — chi, River, goose, sqlc · Frontend: React, Vite, TypeScript, Tailwind, shadcn/ui, TanStack Query — served embedded in the Go binary); state & volumes table (`cargo-db`, `cargo-data` → `<dataDir>` with `databases/`, `db-backups/`, `db-logs/`; `cargo-acme`); production image `ghcr.io/bograh/cargo:latest`; development section: `docker compose -f docker-compose.dev.yml up --build` → http://localhost:8080 without Traefik/SSL; tests: `go test ./...`, `npm test` in `web/`, e2e smoke `scripts/smoke.sh`. (README, PRD §11, docker-compose.yml, PhasedPlans §0)

- [ ] **Step 3: Verify** — build exit 0; `dist/docs/architecture/index.html` contains `ghcr.io/bograh/cargo:latest`; sidebar shows all four section groups.

---

### Task 9: 404 page & final verification

**Files:**
- Create: `src/pages/404.astro`

- [ ] **Step 1: Write `404.astro`** — inside `Layout`: chip `LOST CONTAINER`, H1 `404 — this crate never arrived.`, copy linking `/` and `/docs/`.

- [ ] **Step 2: Full route sweep**

Run: `pnpm astro build && find dist -name "index.html" | sort`
Expected routes: `/`, `/404.html`, `/docs/`, and all 11 remaining docs slugs (13 index routes total + 404).

- [ ] **Step 3: Link check**

Run: `grep -rhoE 'href="(/docs/[a-z-]*/?|/)"' dist | sort -u` — every listed href must correspond to a built route.

- [ ] **Step 4: Dev-server smoke test**

Run: `pnpm astro dev --background`, then `curl -s -o /dev/null -w "%{http_code}" http://localhost:4321/` and `/docs/` and `/docs/architecture/` — all `200`. Then `pnpm astro dev stop`.

- [ ] **Step 5: Runtime dependency check**

Run: `grep -rE "fonts.googleapis|cdn\." dist` — expected: no matches (fonts self-hosted).

---

## Self-Review

- **Spec coverage:** §2 site map → Tasks 3–9 cover all 14 routes. §3.1 collection → Task 4. §3.2 layouts/components → Tasks 2–4. §3.3 fonts/favicon → Tasks 1–2. §3.4 design system → Task 1 + scoped styles. §3.5 single script → Task 3 Step 1. §4.1 landing sections 1–7 → Task 3. §4.2 docs pages 1–12 → Tasks 4–8. §5 error handling → Tasks 4 (active state/pager), 9 (404); mobile collapse in DocsLayout scoped CSS (Task 4 Step 3). §6 verification → Task 9. §7 out of scope respected.
- **Placeholder scan:** docs content tasks specify required facts per page rather than full prose (prose is authored at execution from the cited repo sources, per the approved spec §4.2 which enumerates the facts). All code-bearing steps contain complete code or complete structural skeletons.
- **Type consistency:** `entry.id` used consistently; `hrefFor('introduction') → /docs/` used in sidebar and pager consistently; `Callout` props (`type`, `title`) consistent; CSS class API (`.wrap`, `.btn--primary`, `.chip`, `.card`, `.hazard`, `.prose`, `.docs-shell`, `.docs-sidebar`, `.pager`, `.active`) consistent across tasks.
