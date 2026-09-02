# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Static HTML/CSS/JS marketing site for Morocco Boutique Tours (a private, chauffeur-driven Morocco tour operator). No build system, no package manager, no framework — every page is a hand-authored, self-contained `.html` file sharing one stylesheet (`css/style.css`) and one script (`js/script.js`). The one exception is the Instagram auto-poster (see below), which is a small serverless backend layered on top via Netlify Functions.

## Instagram auto-poster

`instagram-queue.html` is a private, password-gated, `noindex` admin page (not linked from nav/footer/sitemap) for queuing Instagram posts. Backed by `netlify/functions/`:
- `login.js` — password check against `UPLOAD_PAGE_PASSWORD`, sets a signed HttpOnly cookie (see `_lib/auth.js`).
- `queue-add.js` / `queue-list.js` — read/write a JSON manifest of queued posts in Netlify Blobs (`_lib/queue.js`). The page itself uploads photos/videos directly to Cloudinary (unsigned preset, `window.MBT_CLOUDINARY_CLOUD_NAME`/`MBT_CLOUDINARY_UPLOAD_PRESET` at the top of the page) so large video files never pass through a Netlify Function — only the resulting public URL + caption reach `queue-add`.
- `instagram-post-daily.js` — scheduled (`netlify.toml`, cron `0 9 * * *` UTC ≈ 10:00 Morocco time) function that takes the oldest pending queue item and creates its Instagram Graph API media container. Photos publish immediately; videos (posted as Reels) can't — Instagram needs processing time that can outlast a single function call — so the item is left in `processing` status instead.
- `instagram-finish-processing.js` — scheduled every 10 minutes, publishes any `processing` video once Instagram reports it's ready (or marks it `failed` after a 30-minute timeout). This two-function split avoids needing Netlify Background Functions, which require a paid plan.
- `instagram-refresh-token.js` — scheduled monthly, exchanges the current long-lived access token for a fresh one before it expires (`_lib/token.js` stores the live token in Blobs; `META_APP_ID`/`META_APP_SECRET` stay in env vars).

Required Netlify environment variables: `META_APP_ID`, `META_APP_SECRET`, `IG_ACCESS_TOKEN` (seed), `IG_BUSINESS_ACCOUNT_ID`, `UPLOAD_PAGE_PASSWORD`, `COOKIE_SIGNING_SECRET`. The Cloudinary cloud name/preset are not secret and are set directly in `instagram-queue.html`.

## Commands

- **Install dependencies:** `npm install` — only needed for the Netlify Functions (`@netlify/blobs`); the static pages themselves have no dependencies.
- **Local preview:** `npx --yes serve -l 5173 .` (also wired up as the `static-site` launch config in `.claude/launch.json`), then open `http://localhost:5173`.
- **Deploy (draft/preview):** `npx --yes netlify-cli deploy --dir=.` — site is linked via `.netlify/` (site name `moroccoboutiquetours`). Never run with `--prod` unless the user explicitly confirms a production push.
- There is no build, lint, or test step — pages are plain HTML and are verified by opening/screenshotting them.
- **Visual verification:** the built-in Browser pane's screenshot function does not work in this environment. Recreate the local headless-Chrome toolchain in the scratch dir when visual checks matter: `npm install sharp puppeteer-core` with a `package.json` (installing separately with `--no-save` causes each package to evict the other), launch Puppeteer with `executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'`. Use it to screenshot both the local preview server and live Netlify draft URLs.

## Architecture

**Every page is a standalone HTML file with the header/nav and footer copy-pasted in.** There is no templating, include mechanism, or static-site generator — when the nav, footer, or any shared markup changes, it must be edited in every single `.html` file individually (~70 pages). Search-and-replace across all `*.html` files is the normal way to make a sitewide change.

**Page families (by filename prefix):**
- `tour-*.html` — individual signature-journey itinerary pages (e.g. `tour-7-day-casablanca-fes-sahara.html`), 37 and growing. Each embeds full SEO meta (canonical, Open Graph, Twitter card) and a `TouristTrip` JSON-LD schema block with per-day itinerary and pricing offers.
- `tailored-tours-{city}.html` — "tailor-made from X" landing pages, one per departure city (Casablanca, Marrakech, Fes, Agadir, Tangier), each linking out to a curated subset of the real `tour-*.html` itineraries departing from that city.
- `blog-*.html` — blog articles, indexed from `blog.html`.
- Top-level pages: `index.html`, `tours.html`, `tailor-made.html`, `destinations.html`, `our-story.html`, `contact.html`, `faqs.html`, `thank-you.html`.

**Shared page skeleton** (present on every page): Google Fonts preconnect (Cormorant Garamond + Jost) → `css/style.css` → `<header class="site-header">` with logo, hamburger `.nav-toggle`, `.main-nav` (including a `.nav-dropdown` for the tailored-tours submenu) → page content sections built from reusable CSS block classes (`.hero`, `.section-sand`, `.section-teal`, `.split`, `.card`, `.grid-3`/`.grid-4`, `.content-panel`, `.itinerary-day`, `.includes-panel`, `.price-box`, `.testimonial`, `.contact-panel`, `.cta-band`) → `<footer class="site-footer">` with a 4-column link/contact grid → `js/script.js`.

**Hero slider:** every page except `thank-you.html` opens with a `.hero-slider` of 3 stacked `.hero-slide` divs (each a `background-image` inline style) crossfading via a pure-CSS `hero-slide-fade` keyframe animation (12s cycle, staggered `animation-delay` of 0s/4s/8s per slide, defined in `css/style.css`) under a `.hero-slide-tint` gradient overlay — no JS involved, and it degrades to a static first slide under `prefers-reduced-motion`.

**`css/style.css`** is one global stylesheet (no preprocessor) driving the whole site off `:root` custom properties: color palette (`--color-teal-*`, `--color-terracotta*`, `--color-gold`, `--color-sand*`, `--color-charcoal*`), fonts (`--font-display`, `--font-body`), and shadows. Design language is "quiet luxury": editorial serif headings, restrained jewel-tone accents, real photography rather than illustration/iconography.

**`js/script.js`** is a single small vanilla-JS file handling three concerns for every page: mobile nav toggle, sticky/scrolled header state, and an `IntersectionObserver`-driven scroll-reveal effect (`.reveal`/`.is-visible` classes, skipped under `prefers-reduced-motion`).

**Forms** use Netlify Forms directly in HTML (`data-netlify="true"`, hidden `form-name` input, `netlify-honeypot` spam trap) — no JS form handling or backend. `contact.html` submits to `thank-you.html`.

**Images** live flat in `images/` (~120 files, descriptive kebab-case filenames referenced directly as `background-image` inline styles or `<img src>`), with originals kept in `images/_originals/`.

## Design conventions

- **Zellige/tile texture:** always use the real Bou Inania Madrasa photo assets (`images/zellige-fez-web.jpg`, `images/zellige-fez-band.jpg`, exposed as `--zellige-panel`/`--zellige-band` in `css/style.css`), never a hand-drawn SVG tessellation pattern — SVG zellige attempts were explicitly rejected as not reading as authentic. Since the photo is fully opaque, always stack one of the tinted overlay gradients (`--overlay-teal`, `--overlay-charcoal`, `--overlay-terracotta`) on top of it for text contrast, and don't apply the full-field texture to small light-background text-bearing elements (cards, mini-cards) — only use `--zellige-band` there, as a thin top-edge accent strip.
- Positioning throughout copy is "private, chauffeur-driven" (not small-group/shared) tours.
- Prices are per person, twin/double share, in EUR (`€X,XXX per person`).

## SEO conventions

Tour and top-level pages carry full SEO metadata: `<title>`, meta description, `rel="canonical"` (absolute URL under `https://www.moroccoboutiquetours.com/`), Open Graph tags, Twitter card, and (on tour pages) a `TouristTrip` JSON-LD block listing the itinerary stops and pricing offers. Every tour page also carries a second JSON-LD block, `FAQPage`, mirroring an on-page `.faq-category` of five `<details class="faq-item">` questions (placed right after the `.price-box` section) — the questions are fixed, but the answers are interpolated per page from that page's own duration/route/meals/price data, so they aren't identical boilerplate across pages. Follow the existing pattern in a sibling `tour-*.html` file when adding a new tour page, and add the new URL to `sitemap.xml`.

**`llms.txt`** (root) is a hand-written summary for AI crawlers/assistants — business description, key page links, and notes on the per-tour structured data. It links page *categories*, not individual `tour-*`/`blog-*` pages, so it only needs updating for changes at that level (e.g. a new departure city, a new top-level page).
