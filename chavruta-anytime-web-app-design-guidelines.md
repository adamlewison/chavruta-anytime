# ChavrutaAnytime Design Guidelines

This is the canonical design system for the app — colors, type, and component conventions match what's implemented in `src/styles/globals.css` and `components.json` (shadcn/ui). If a design decision elsewhere in the repo conflicts with this file, this file wins.

## Visual language

Clean, modern SaaS — ample whitespace, soft rounded corners, no "traditional/dusty" styling. Blue for trust/navigation, orange for CTAs and highlights.

## Colors

| Role | Value | Usage |
|---|---|---|
| Brand blue | `#3D85C6` | Primary nav, headings, primary buttons, focus rings |
| Brand orange | `#F69240` | CTAs, highlights, "Anytime" accents |
| Background | `#FFFFFF` | Page background |
| Surface | `#F8FAFC` | Section backgrounds, card offsets |
| Text primary | `#1E293B` | Body text, headings |
| Text secondary | `#64748B` | Descriptions, labels |
| Border | `#E2E8F0` | Dividers, card borders |
| Success | `#10B981` | |
| Warning | `#F59E0B` | |
| Error | `#EF4444` | |

## Typography

Inter (fallback `system-ui`) throughout.

- H1: 36px / Bold — brand blue on hero sections
- H2: 28px / SemiBold
- H3: 22px / SemiBold
- Body: 16px / Regular
- Small: 14px / Regular, text-secondary
- Buttons: 16px / Medium

## Components

- **Buttons** — primary: solid orange, white text, `8px` radius, subtle hover shadow. Secondary: blue outline. Ghost: no border, blue text.
- **Cards** — white background, `1px` border (`#E2E8F0`), `12px` radius, subtle shadow.
- **Inputs** — white background, `8px` radius, `#E2E8F0` border; focus state switches to brand blue with a soft glow.
- **Nav** — fixed top bar, white with a subtle bottom shadow. Logo top-left: "chavruta" in blue, "anytime" in orange. Active link: 2px orange bottom border.
- **Icons** — thin-line or duo-tone (Lucide React). The logo's clock mark doubles as favicon, loading spinner, and empty-state decoration.

## Layout

- Max-width `1280px` desktop container, 12-column grid.
- Spacing scale: 4/8/16/24/32/64px.
- Mobile-first: every page usable at 375px, 44px minimum tap targets.

## Product UX conventions

- Onboarding: multi-step form with a progress bar, kept frictionless.
- Matches: "Smart Match" badges in brand orange.
- Empty states: never a blank page — always a heading, a line of context, and a CTA.
- Micro-interactions: 0.2s ease-in-out transitions on hover/modal states.

## Accessibility

- WCAG AA contrast on all text/background pairs.
- Never remove focus outlines — style them in brand blue instead.
- Semantic HTML (`<main>`, `<nav>`, `<section>`, `<button>`).
