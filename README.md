# FEROKINZA EXPORT & IMPORT — website

## Current state

`index.html` is the **live production site** served at ferokinza.com via GitHub Pages.
It is plain, self-contained HTML/CSS/JS — no build step, no framework, no runtime
dependency. Images live in `assets/`. Edit `index.html` directly and push.

`design-source.dc.html` is the original design prototype (Claude artifact component
format). It needs `support.js` and `image-slot.js` to open in a browser and is kept
for reference only — it is **not** what ships. The navy/gold and white/gold design
variants were dropped.

`maintenance.html` is the "We're rebuilding our site" page that ran at
ferokinza.com before this one. It is kept as a standby and is self-contained, so
it works anywhere. To put it back up during downtime:

```sh
cp index.html live.html.bak    # keep the real site
cp maintenance.html index.html
git commit -am "Show maintenance page" && git push
```

Reverse it with `cp live.html.bak index.html`. Note it still lists
**admin@ferokinza.com**, not the `info@` address the current site uses — update
that before putting it live.

Both forms post to a Google Apps Script Web App that writes each submission to its
own sheet — **Contact us → `Contact`**, **Request a quotation → `RFQ`**. The script
and its one-time setup steps are in [`apps-script/`](apps-script/README.md). Paste
the deployed `/exec` URL into `var ENDPOINT` near the top of the page script in
`index.html`; until you do, the forms fall back to opening a pre-filled email.

The rest of this file is the original design handoff document. It describes the
prototype's intent and constraints, which the production page follows.

---

## Overview

A single-page marketing website for FEROKINZA EXPORT & IMPORT, an Italy-based
international sourcing, procurement and export company based in Milano. The page
explains the service, the sectors covered, the procurement process, logistics and
Incoterms, export documentation, target markets, a supplier-side pitch, the company
vision, an FAQ, and a two-tab contact/RFQ form.

The central positioning is that FEROKINZA accepts **small batches through to
full-container shipments** — small buyers are not turned away. This claim appears in
the hero, the stats strip, the "Why FEROKINZA" section and FAQ #1, and must survive
any reimplementation.

## About the Design Files

The files in this bundle are **design references created in HTML** — a prototype
showing intended look and behavior, not production code to copy directly.

The task is to **recreate this design in the target codebase's existing environment**
(React, Next.js, Astro, WordPress, whatever is in use) using its established patterns,
component library and build tooling. If no environment exists yet, choose an
appropriate framework — for a marketing site of this kind, a static-site generator
(Astro, Next.js static export, Eleventy) is the natural fit, since the page has no
authenticated state and only two client-side interactions.

`Ferokinza Website.dc.html` is written in a proprietary streaming-component format:
a template with `{{ value }}` holes plus a small JavaScript logic class, bound
together by `support.js`. **Do not try to ship or port `support.js`.** Read the file
as markup + a state description and rewrite it idiomatically. Everything is inline
styles; there are no CSS classes to carry over.

`Ferokinza Website (standalone).html` is a fully self-contained build of the same page
(all fonts, scripts and images inlined). Open it in a browser to see the finished
design without any tooling. It is the reference render.

## Fidelity

**High-fidelity.** Final colors, typography, spacing, copy and interaction states.
Recreate the UI faithfully. All copy in the HTML is approved client copy — do not
rewrite it.

## Layout system

- Page background `#FAF6F0`. Sections alternate between `#FAF6F0` (paper),
  `#EDE1D1` (cream), `#1D4A57` (teal) and `#10333C` (dark ink).
- Every section: `padding: clamp(72px, 8vw, 124px) clamp(18px, 4vw, 44px)`.
- Inner container: `max-width: 1280px; margin: 0 auto`.
  Exception: the FAQ container is `max-width: 980px`.
- Multi-column blocks use
  `display: grid; grid-template-columns: repeat(auto-fit, minmax(<N>px, 1fr))`
  with no media queries. The whole page is responsive through `auto-fit` + `clamp()`.
- Card grids draw their dividing lines with a 1px grid gap over a `#E6DACA`
  background plus a `1px solid #E6DACA` border — cards themselves are `#FAF6F0`.
  On dark sections the divider color is `rgba(237,225,209,.16-.18)` and the cards are
  the section background color.

## Screens / Views

One page, thirteen blocks in this order.

### 1. Header (sticky)

- `position: sticky; top: 0; z-index: 50`, background `rgba(250,246,240,.88)`,
  `backdrop-filter: blur(12px)`, bottom border `1px solid #E6DACA`.
- Row: `min-height: 76px; display: flex; align-items: center; gap: clamp(12px,2vw,28px)`,
  horizontal padding `clamp(14px,4vw,44px)`.
- Left: 42×42 circular emblem (`assets/ferokinza-emblem.png`, `object-fit: cover`,
  `mix-blend-mode: multiply` so its cream background disappears into the bar), then a
  two-line lockup — "FEROKINZA" (Source Serif 4, 700, 20px, letter-spacing .06em,
  `#1D4A57`) over "EXPORT AND IMPORT COMPANY" (8.5px, 600, letter-spacing .2em,
  `#7C8B88`).
- Desktop (viewport ≥ 1000px): nav links `Services · What we source · How it works ·
  Logistics · FAQ` (14px, 500, `#2C4A50`, hover `#B85C38`, `white-space: nowrap`),
  then the CTA "Request a quotation" (background `#1D4A57`, text `#FAF6F0`,
  `12px 22px`, radius 2px, 13.5px/600, hover background `#B85C38`).
- Below 1000px: nav and CTA are replaced by a 46×46 hamburger button
  (`1px solid #D6C4AB`, three 20×1.5px bars in `#1D4A57`). Tapping it opens a drawer
  under the bar: full-width links at 16px with `1px solid #EFE4D4` separators, and the
  CTA as a full-width teal button. Any link tap closes the drawer.
- The breakpoint is implemented in JS (`window.innerWidth < 1000`, re-evaluated on
  resize) because the source format has no stylesheet. **In a normal codebase use a
  CSS media query instead.**
- `scroll-behavior: smooth` and `scroll-padding-top: 92px` on `html` so anchor jumps
  clear the sticky bar.

### 2. Hero

- Background `linear-gradient(180deg, #EDE1D1 0%, #F3EADD 100%)`.
- Two columns, `repeat(auto-fit, minmax(340px, 1fr))`, gap `clamp(32px,5vw,72px)`,
  `align-items: center`.
- Left column, in order:
  - Pill badge: `1px solid #C9B79E`, radius 100px, `7px 15px`, 11.5px/600,
    letter-spacing .14em, uppercase, `#7A5A3C`, with a 6px `#B85C38` dot.
    Text: "EuropEan Sourcing - Global Impact" (client-edited; preserve verbatim).
  - H1: Source Serif 4, 600, `clamp(40px, 5.6vw, 74px)`, line-height 1.02,
    letter-spacing -.025em, `#10333C`. Two lines: "From small batches" /
    "to global scale."
  - Tagline: Source Serif 4, italic, `clamp(19px,1.9vw,26px)`, `#7A5A3C` —
    "We source, you grow."
  - Body paragraph, `clamp(16px,1.35vw,19px)`, line-height 1.62, `#3C5257`,
    `max-width: 36em`.
  - Two buttons in a `flex; gap: 14px; flex-wrap: wrap` row: solid teal
    "Send us your requirement" (→ `#contact`, also switches the form to the RFQ tab)
    and outlined "See what we source" (→ `#sectors`).
  - Region line: 12.5px/500, letter-spacing .1em, uppercase, `#8A7B68` —
    "Europe · GCC · India · Asia · Africa · USA".
  - Entrance animation: `fkRise .9s cubic-bezier(.2,.7,.3,1) both`
    (opacity 0 → 1, translateY 18px → 0).
- Right column: image, `aspect-ratio: 4/3.4`, radius 3px,
  `box-shadow: 0 30px 70px -30px rgba(16,51,60,.45)`, entrance `fkFade 1.2s ease .2s both`.
  Beneath it a callout card: `#FAF6F0`, `1px solid #E0D2BE`, `18px 24px`,
  flex row with baseline alignment and 18px gap — "Small batches" (Source Serif 4,
  700, 30px, `#1D4A57`) then 13px `#5A6E70` supporting text.

### 3. Stats strip

Background `#1D4A57`, text `#EDE1D1`, padding `clamp(36px,4vw,54px)` block.
Four cells, `repeat(auto-fit, minmax(190px, 1fr))`, gap `clamp(24px,3vw,40px)`.
Each: a Source Serif 4 600 `clamp(30px,3.4vw,44px)` figure in `#FAF6F0`, then 13.5px
`#A8C0C6` caption.

| Figure | Caption |
| --- | --- |
| Small batches | Welcome, right up to full-container shipments |
| 17 | Product categories and industry sectors covered |
| 6 | Market regions: Europe, GCC, India, Asia, Africa, USA |
| 1 | Procurement partner handling sourcing through delivery |

Toggleable via the `showStats` flag.

### 4. What we do — `#services`

Two-column intro (`minmax(300px,1fr)`): left holds the eyebrow "WHAT WE DO" and the
H2 "European sourcing, handled end to end"; right holds two body paragraphs.

Below, a six-card grid, `repeat(auto-fit, minmax(340px, 1fr))` — this minimum is
chosen so the six cards form exactly two rows of three at desktop width and two rows
of two on tablet, never leaving empty cells. Card padding `clamp(28px,3vw,40px)`,
hover background `#FFFDFA`. Each card: a Source Serif 4 700 15px `#B85C38` number,
a 22px Source Serif 4 600 heading, and a 14.5px `#5A6E70` paragraph.

01 Product identification · 02 Supplier sourcing · 03 Alternative solutions ·
04 Quotation · 05 Procurement coordination · 06 International delivery.

### 5. Why FEROKINZA

Background `#10333C`. Two columns. Left: eyebrow in `#D98D63`, H2 "Most exporters
start at a container. We start at a small batch.", body paragraph in `#B5CBD1`.
Right: four stacked cards (single-column grid, 1px dividers) — "No minimum barrier",
"Genuine, traceable product", "European base, global reading", "One point of contact".

### 6. What we source — `#sectors`

- Header row: `flex; flex-wrap: wrap; align-items: end; justify-content: space-between`
  — H2 "Food, industry, infrastructure and everything between" on the left, a 15.5px
  paragraph capped at 34em on the right.
- **Highlight block**: `#EDE1D1` panel with `1px solid #DFCFB8`, padding
  `clamp(28px,3.4vw,48px)`, two columns. Left has a `#B85C38` "PARTICULAR EXPERTISE"
  tag, the H3 "Multi-supplier European consolidation", a paragraph, and eight chips
  (`1px solid #C9B79E`, background `#F6EEE3`, `8px 14px`, 13px). Right is a 4:3 image
  with `box-shadow: 0 24px 50px -30px rgba(16,51,60,.5)`.
- **Sector grid**: `repeat(auto-fill, minmax(250px, 1fr))`, cards `24px 26px`,
  hover background `#EDE1D1`. 18 cells:
  Food & beverage, Electrical & automation, Industrial & mechanical,
  Plumbing & sanitary, Water treatment, Construction materials,
  Healthcare & hospital, Hotel & hospitality, Automotive & marine,
  Oil & gas equipment, Manufacturing & packaging, Safety equipment,
  Agricultural products, Energy solutions, OEM parts, Maintenance (MRO),
  Project requirements — and finally a teal `#1D4A57` CTA cell titled
  "Can't Find Your Category?" that links to `#contact` and switches the form to the
  RFQ tab (hover background `#B85C38`).

### 7. How it works — `#process`

Background `#EDE1D1`. Five columns, `repeat(auto-fit, minmax(210px, 1fr))`, each with
a `2px solid #1D4A57` top rule, a "STEP 0N" label in `#B85C38`, a 21px heading and a
14px paragraph. Steps: You send the requirement · We source and confirm · You receive
a quotation · We procure and consolidate · We export and deliver.

### 8. Logistics & terms — `#logistics`

Two columns. Left: H2 "Shipped the way the order deserves", a paragraph, then five
mode rows (`flex; gap: 14px`, a fixed 78px-wide 11px `#B85C38` label followed by a
14.5px description): COURIER, AIR, SEA LCL, SEA FCL, ROAD.
Right: a bordered card on `#FFFDFA` with a header, then a
`repeat(auto-fit, minmax(180px,1fr))` grid of seven Incoterm cells (EXW, FCA, FOB,
CIF, CIP, DAP/DDP), then a footnote. Toggleable via `showIncoterms`.

### 9. Compliance & documentation — `#documentation`

Background `#1D4A57`. Left column intro; right column a six-cell grid
(`minmax(230px,1fr)`): commercial invoice & packing list, Certificate of Origin /
EUR.1, CE marking & declarations, food safety documents, technical datasheets & MSDS,
transport & insurance.

### 10. Markets — `#markets`

Eyebrow, H2, intro paragraph, then a six-cell grid (`minmax(190px,1fr)`) —
Europe, GCC, India, Africa, Asia, USA, each with a 21px Source Serif 4 name and a
13.5px caption. Below, three 3:2 images in a
`repeat(auto-fit, minmax(240px,1fr))` row with `clamp(14px,1.6vw,22px)` gap.

### 11. For suppliers & brands — `#suppliers`

Background `#EDE1D1`. Left: H2 "European manufacturers: we open the markets that buy
from you", paragraph, outlined CTA "Talk to us about supplying" (→ `#contact`).
Right: four stacked `#F6EEE3` cards with `#DFCFB8` dividers.

### 12. Our vision — `#vision`

Background `#10333C`. Eyebrow, then a Source Serif 4 600
`clamp(28px,3.6vw,48px)` statement capped at 19em — "One trusted partner between
European supply and global demand." Below, three paragraphs in a
`repeat(auto-fit, minmax(240px,1fr))` grid, `#B5CBD1`.

### 13. FAQ — `#faq`

Background `#EDE1D1`, container 980px. Six native `<details>` / `<summary>` items
(the first `open`), each with a `1px solid #D6C4AB` top rule and 22px vertical
padding; the last also carries a bottom rule. Summary is a `flex; gap: 20px;
align-items: baseline` row of a 13px `#B85C38` index and a
`clamp(19px,1.7vw,23px)` Source Serif 4 question. The default disclosure marker is
suppressed (`summary::marker { content: '' }` and
`summary::-webkit-details-marker { display: none }`); answers are indented 43px to
align under the question text.

Questions: Do you accept small orders? · Do you only source from Europe? · I only
have a photo or an old part number. Can you still help? · What if the item is
discontinued or out of budget? · Can you combine several suppliers into one shipment? ·
How long does a quotation take?

### 14. Contact — `#contact`

Two columns. Left: H2 "Tell us what you need", a paragraph, then labelled contact
blocks — Email `admin@ferokinza.com`, Telephone `+39 351 619 9605`, Office
"FEROKINZA EXPORT & IMPORT, Via Edolo 46, 20125 Milano MI, Italy". Labels are 11px/700
letter-spacing .16em uppercase `#8A7B68`; values are Source Serif 4 600
`clamp(20px,1.9vw,26px)` `#1D4A57`. An optional outlined WhatsApp button renders when
a WhatsApp number is configured.

Right: a form card, `#FFFDFA` with `1px solid #E6DACA`, padding `clamp(26px,3vw,40px)`,
containing a two-tab switcher and one of two forms.

- **Tab switcher**: a `#F1E7DA` track with `1px solid #E6DACA`, 4px padding, radius
  3px, holding two equal-width buttons. Active tab: background `#1D4A57`, text
  `#FAF6F0`. Inactive: transparent, text `#5A6E70`. Labels "Contact us" and
  "Request a quotation".
- **Tab 1 — Contact us**: name, email, message. Submit button background `#1D4A57`,
  hover `#B85C38`.
- **Tab 2 — Request a quotation**: titled "Request for quotation" with a `#B85C38`
  "PRIORITY" chip. Fields, in paired rows that collapse to one column below ~400px
  per cell: Name* + Company, Email* + Phone/WhatsApp, Products & specifications*
  (textarea, 5 rows), Quantity* + Destination country*, Preferred Incoterm (select:
  "Not sure — advise me", EXW, FCA, FOB, CIF, CIP, DAP, DDP) + Required by (date).
  Submit button background `#B85C38`, hover `#1D4A57`, label "Submit RFQ".
- **Field styling**: label 11px/700 letter-spacing .14em uppercase `#8A7B68` with 8px
  bottom margin; input `13px 14px`, `1px solid #DCCFBC`, background `#FAF6F0`, 15px
  text, radius 2px, `outline: none`, focus border `#1D4A57`.
- **After submit**: the card swaps to a confirmation — "Thank you — your message is
  ready to send." plus a "Write another message" outlined button that resets all state.

### 15. Footer

Background `#10333C`, text `#9FB8BF`. Four columns (`minmax(230px,1fr)`): the brand
lockup with a 46px emblem and a short descriptor; Company links; Markets list;
Get in touch. A bottom bar separated by `1px solid rgba(159,184,191,.22)` carries the
copyright (with a live year) and a line noting that Incoterms® is an ICC trademark.

## Interactions & Behavior

| Interaction | Behavior |
| --- | --- |
| Header nav / footer links | Anchor jumps, smooth scroll, 92px scroll padding |
| Mobile menu | Hamburger toggles a drawer; any link tap closes it; the drawer closes automatically when the viewport widens past 1000px |
| Every "Request a quotation" CTA (header, hero, sector CTA cell) | Jumps to `#contact` **and** selects the RFQ tab |
| Contact form tabs | Client-side switch; field values in the inactive tab are preserved |
| Both form submits | `preventDefault`, compose a `mailto:admin@ferokinza.com` URL with a formatted subject and body, navigate to it, then show the confirmation panel. **Replace this with a real backend** (see below) |
| FAQ | Native `<details>` toggle; first item open by default |
| Hover states | Cards lighten (`#FFFDFA` on paper, `#EDE1D1` on the sector grid); buttons swap teal ⇄ terracotta; links go `#B85C38`. All `transition: … .2s ease` (service cards `.25s`) |
| Page load | Hero left column `fkRise .9s`, hero image `fkFade 1.2s ease .2s`. Nothing else animates |

### RFQ email body format

The RFQ submit builds this plain-text body — keep the shape if you replace the
transport, since it is what the procurement desk reads:

```
REQUEST FOR QUOTATION

Contact: <name>
Company: <company>
Email: <email>
Phone / WhatsApp: <phone>
Destination country: <country>
Quantity: <qty>
Preferred Incoterm: <incoterm | "Not specified">
Required by: <date | "Not specified">

Products / specifications:
<free text>
```

Subject: `RFQ — <company or name or "website">`.
The basic form uses subject `Sourcing enquiry — <name or "website">` and a body of
`Name: … / Email: … / <message>`.

### Recommended production changes

1. **Replace `mailto:` with a server endpoint** (or a form service). `mailto:` fails
   on devices without a configured mail client and loses the enquiry silently. Post
   to an endpoint, send the email server-side, and add spam protection.
2. **Move the 1000px breakpoint into CSS.** The JS resize listener exists only
   because the prototype format has no stylesheet.
3. **Add real SEO and social metadata** — title, description, canonical, Open Graph,
   `LocalBusiness`/`Organization` JSON-LD with the Milano address, favicon set.
4. **Add the legal pages Italian/EU practice expects** — privacy policy (GDPR), a
   cookie notice if analytics are added, and a footer line carrying the company's
   P.IVA / VAT number and REA registration once available.
5. Serve the images as responsive `<picture>` sources; the prototype embeds them.

## State Management

All state is client-side and ephemeral. Nothing persists between visits.

| State | Type | Purpose |
| --- | --- | --- |
| `narrow` | boolean | Viewport < 1000px — drives the mobile header |
| `menu` | boolean | Mobile drawer open |
| `tab` | `'basic' \| 'rfq'` | Which contact form is showing |
| `name`, `email`, `message` | string | Basic form fields |
| `rName`, `rCompany`, `rEmail`, `rPhone`, `rCountry`, `rProduct`, `rQty`, `rIncoterm`, `rDate` | string | RFQ fields |
| `sent` | boolean | Shows the confirmation panel |

Configuration flags (exposed as props in the prototype, suitable as CMS or env
settings): `whatsappNumber` (string — renders the WhatsApp button when set;
digits are stripped and appended to `https://wa.me/`), `showStats` (boolean),
`showIncoterms` (boolean).

## Design Tokens

### Color

| Token | Hex | Use |
| --- | --- | --- |
| Ink | `#10333C` | Headings; darkest section background; footer |
| Teal | `#1D4A57` | Primary buttons, stats band, documentation band, emblem-matched brand color |
| Teal text | `#24596B` | Default link color |
| Terracotta | `#B85C38` | Accent: eyebrows, numbers, hover states, RFQ submit |
| Terracotta light | `#D98D63` | Eyebrow text on dark backgrounds |
| Bronze | `#7A5A3C` | Hero badge text, hero tagline |
| Paper | `#FAF6F0` | Page background, cards on paper sections |
| Card white | `#FFFDFA` | Form card, Incoterm card, card hover on paper |
| Cream | `#EDE1D1` | Alternate section background, highlight panel |
| Cream light | `#F3EADD` | Hero gradient end |
| Chip cream | `#F6EEE3` | Chips, supplier cards |
| Tab track | `#F1E7DA` | Form tab background |
| Border | `#E6DACA` | Default hairline / grid divider |
| Border warm | `#DFCFB8`, `#DCCFBC`, `#D6C4AB`, `#C9B79E`, `#E0D2BE` | Panel, input, FAQ, chip and callout borders |
| Body text | `#3C5257` | Long-form paragraphs |
| Muted text | `#5A6E70`, `#4A5F62` | Card body copy |
| Label | `#8A7B68` | Uppercase field and meta labels |
| Faint | `#98A6A6`, `#7A8B8C`, `#7C8B88` | Helper text |
| On-dark body | `#B5CBD1` | Paragraphs on dark sections |
| On-dark muted | `#9FB8BF`, `#A8C0C6`, `#C5D6DA` | Captions and links on dark |
| On-dark label | `#5F7E85`, `#6E8B92` | Footer labels and legal line |
| On-dark divider | `rgba(237,225,209,.16)`, `rgba(159,184,191,.22)` | Dividers on dark |

### Typography

Two Google fonts, weights 400/500/600/700:

- **Source Serif 4** — display. All headings, figures, brand lockup, contact values,
  FAQ questions, Incoterm codes.
- **Archivo** — UI and body. Everything else. Fallback stack
  `Archivo, system-ui, sans-serif`.

| Role | Spec |
| --- | --- |
| H1 | Source Serif 4 600 · `clamp(40px,5.6vw,74px)` · lh 1.02 · ls -.025em |
| H2 | Source Serif 4 600 · `clamp(30px,3.8vw,50px)` · lh 1.08 · ls -.02em |
| Vision statement | Source Serif 4 600 · `clamp(28px,3.6vw,48px)` · lh 1.14 |
| H3 (card) | Source Serif 4 600 · 19–22px · lh 1.2 |
| H4 (sector) | Source Serif 4 600 · 18.5px |
| Stat figure | Source Serif 4 600 · `clamp(30px,3.4vw,44px)` · lh 1 |
| Lead paragraph | Archivo 400 · `clamp(16px,1.35vw,19px)` · lh 1.62–1.68 |
| Body | Archivo 400 · 15.5px · lh 1.65–1.68 |
| Card body | Archivo 400 · 13.5–14.5px · lh 1.55–1.6 |
| Eyebrow | Archivo 600 · 11.5px · ls .18em · uppercase |
| Field label | Archivo 700 · 11px · ls .14em–.16em · uppercase |
| Button | Archivo 600 · 13.5–15px |
| Footnote | Archivo 400 · 12.5px |

`text-wrap: pretty` is set on `body`. Font smoothing: `-webkit-font-smoothing: antialiased`.

### Spacing, radius, shadow

- Section padding `clamp(72px, 8vw, 124px)` block / `clamp(18px, 4vw, 44px)` inline.
- Grid gaps: `clamp(20px,2.4vw,32px)` (tight), `clamp(28px,4vw,64px)` (two-column),
  `clamp(36px,5vw,80px)` (wide). Card grids use a 1px gap for hairlines.
- Card padding: `24px 26px` (sector), `clamp(28px,3vw,40px)` (service),
  `22–26px clamp(22px,2.4vw,32px)` (dark cards).
- Radius: 2px on buttons and inputs, 3px on the hero image and tab track,
  100px on the hero pill, 50% on the emblem. **The design is deliberately
  square-cornered** — do not round it further.
- Shadows: hero `0 30px 70px -30px rgba(16,51,60,.45)`;
  highlight image `0 24px 50px -30px rgba(16,51,60,.5)`;
  hero callout `0 18px 40px -24px rgba(16,51,60,.35)`.
- Keyframes: `fkRise` (opacity 0→1, translateY 18px→0), `fkFade` (opacity 0→1).

## Assets

| File | Notes |
| --- | --- |
| `assets/ferokinza-logo.png` | 1024×1024 full logo supplied by the client: teal globe-and-laurel emblem over a "FEROKINZA / EXPORT AND IMPORT COMPANY" serif lockup, on a cream field. The site's palette is derived from it. |
| `assets/ferokinza-emblem.png` | 456×456 crop of the emblem only, used in the header and footer. It has an opaque cream background, so the header applies `mix-blend-mode: multiply`. **Ask the client for a transparent SVG or PNG for production** — the blend trick fails on any non-cream surface. |

Five photographic slots are filled by client-supplied images, stored in the prototype
as WebP data URLs inside `.image-slots.state.json` and inlined into the standalone
build. Extract them from the standalone file, or ask the client for originals.
Required aspect ratios and suggested sizes:

| Slot | Ratio | Size | Subject |
| --- | --- | --- | --- |
| `fk-hero` | 4:3.4 | 1200×1020 | Hero |
| `fk-food` | 4:3 | 1600×1200 | Consolidation / loading bay |
| `fk-net-1` | 3:2 | 1200×800 | Port or container terminal |
| `fk-net-2` | 3:2 | 1200×800 | Warehouse / consolidation |
| `fk-net-3` | 3:2 | 1200×800 | Industrial or manufacturing detail |

No icon set is used anywhere. The only glyph is a `→` character in the sector CTA cell.

## Content rules

The copy was written from and approved against the client's company description.
Two constraints carry over:

1. **Do not invent credentials.** The site deliberately states no founding year, no
   staff count, no client names, no certifications, no turnover. Nothing may be added
   without the client supplying it.
2. **Compliance wording is careful.** The documentation section describes paperwork
   FEROKINZA *arranges from suppliers* (CE declarations, EUR.1, health certificates).
   It never claims FEROKINZA itself holds a certification. Preserve that distinction.

## Files

| File | What it is |
| --- | --- |
| `Ferokinza Website.dc.html` | The design source: markup plus a small state class, inline-styled throughout. The authoritative reference for copy, structure and values. |
| `Ferokinza Website (standalone).html` | Self-contained build — every font, script and image inlined. Open directly in a browser to see the finished design. |
| `image-slot.js` | The prototype's drag-and-drop image placeholder component. **Prototype tooling only — do not port it.** Replace each slot with a plain `<img>` or `<picture>`. |
| `assets/` | Logo and emblem. |
