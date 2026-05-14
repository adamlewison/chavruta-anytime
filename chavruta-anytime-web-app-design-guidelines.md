# ChavrutaAnytime Web App Design Guidelines

This document serves as the foundational design system and UI/UX specification for the ChavrutaAnytime web application. The goal is to create a modern, world-class experience that facilitates connection and Jewish learning (Chavruta) with seamless efficiency.

---

## 1. Brand Identity & Visual Language

The brand identity is centered around **connection (Chavruta)** and **flexibility (Anytime)**. The visual language should be clean, professional, and inviting, moving away from "traditional/dusty" aesthetics towards a high-tech, modern SaaS feel.

### Core Visual Principles:

- **Clarity:** Use ample whitespace to reduce cognitive load.
- **Warmth:** Use the brand orange to highlight human interaction and energy.
- **Reliability:** Use the brand blue to establish trust and stability.
- **Fluidity:** Soft corners (rounded radii) to match the circular nature of the clock in the logo.

---

## 2. Color Palette

Derived from the ChavrutaAnytime logo.

### Primary Colors

- **Brand Blue:** `#3D85C6` (approx. from logo) — Used for primary navigation, headings, and primary buttons. Represents trust and depth.
- **Brand Orange:** `#F69240` (approx. from logo) — Used for Call-to-Action (CTA) buttons, highlights, and "Anytime" features. Represents energy and urgency.

### Secondary & Neutral Colors

- **Pure White:** `#FFFFFF` — Primary background color for a clean look.
- **Surface Gray:** `#F8FAFC` — Used for section backgrounds and card offsets.
- **Text Primary:** `#1E293B` — Deep slate for high readability.
- **Text Secondary:** `#64748B` — Muted slate for descriptions and labels.
- **Border/Divider:** `#E2E8F0` — Subtle lines for section separation.

### Semantic Colors

- **Success:** `#10B981` (Emerald)
- **Warning:** `#F59E0B` (Amber)
- **Error:** `#EF4444` (Red)

---

## 3. Typography

Use a modern, geometric sans-serif font family to ensure high legibility across all devices.

- **Primary Font:** `Inter` or `Poppins` (Fallback: `system-ui`).
- **Headings:**
  - **H1:** 36px / Bold / `#1E293B` (Brand Blue for hero sections)
  - **H2:** 28px / SemiBold / `#1E293B`
  - **H3:** 22px / SemiBold / `#1E293B`
- **Body Text:**
  - **Base:** 16px / Regular / `#1E293B`
  - **Small:** 14px / Regular / `#64748B` (Secondary text)
- **Button Text:** 16px / Medium / Uppercase or Title Case.

---

## 4. UI Components

### 4.1 Buttons

- **Primary Button:** Solid Brand Orange (`#F69240`) with White text. Rounded corners (`8px`). Subtle drop shadow on hover.
- **Secondary Button:** Outline Brand Blue (`#3D85C6`) with Blue text and transparent background.
- **Ghost Button:** No border/background, Brand Blue text. Used for less important actions.

### 4.2 Cards

- **Style:** White background, `1px` border (`#E2E8F0`), and a large border-radius (`12px`).
- **Shadow:** Very subtle (e.g., `box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)`).
- **Usage:** For listing study partners, upcoming sessions, or learning tracks.

### 4.3 Inputs & Forms

- **Field Style:** Background `#FFFFFF`, border-radius `8px`, border color `#E2E8F0`.
- **Focus State:** Border changes to Brand Blue (`#3D85C6`) with a subtle blue outer glow.

### 4.4 Navigation

- **Top Bar:** Fixed, White background with a subtle bottom shadow.
- **Logo Placement:** Top-left. "Chavruta" in Blue, "Anytime" in Orange.
- **Active Links:** Indicated by a 2px bottom border in Brand Orange.

---

## 5. Iconography & Imagery

- **Icons:** Use thin-line or duo-tone icons (e.g., Lucide React or Phosphor Icons).
- **The "Clock-A" Symbol:** Use the clock icon from the logo as a favicon, a loading spinner, and as a decorative element in empty states (e.g., "No partners found yet").
- **Photography:** If used, should feature diverse people smiling and engaged in learning, with bright, natural lighting.
- The logo can be found here: 'public/ca logo.png' and the brand name can be found here 'public/ca logo name.png'

---

## 6. Layout & Grid

- **Container:** Max-width `1280px` for desktop.
- **Grid:** 12-column system.
- **Spacing:** Use a 4px/8px scaling system (e.g., `8px`, `16px`, `24px`, `32px`, `64px`).
- **Mobile First:** Ensure all components are touch-friendly (min 44px tap target) and stack logically on smaller screens.

---

## 7. UX Principles for AI Agent

1. **Onboarding:** Make it frictionless. Use a multi-step form with a progress bar to gather learning interests.
2. **The "Match" Experience:** Use "Smart Match" badges in Brand Orange to highlight compatible partners.
3. **Availability (The "Anytime" factor):** Use a clean calendar view. Highlight current "Active Now" users with a green pulse indicator.
4. **Empty States:** Never show a blank page. If no sessions are scheduled, show a "Find a Chavruta" CTA button in Orange.
5. **Micro-interactions:** Add subtle transitions (0.2s ease-in-out) for button hovers and modal fades to provide a "premium" feel.

---

## 8. Accessibility (A11y)

- **Contrast:** Ensure all text-on-background combinations pass WCAG AA standards.
- **Focus States:** Never remove focus outlines; style them to match the brand blue.
- **Screen Readers:** Use semantic HTML (`<main>`, `<nav>`, `<section>`, `<button>`).

---

_Created for the ChavrutaAnytime Development Team._
