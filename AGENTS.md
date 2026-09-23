# AGENTS.md

Project conventions for AI agents and humans editing this codebase.

## Original request
make me a financial dashboard to manage my day to day expenses.

## Goal
Build a modern dark glass-futuristic personal financial dashboard with expense tracking, budgets, analytics, and transaction management across four fully functional pages.

## Project type
dashboard

## Design system — match this exactly
- Color tokens: `--background: #0f172a`, `--card: #1e293b`, `--foreground: #f8fafc`, `--muted-foreground: #94a3b8`, `--border: #334155`, `--primary: #38bdf8`, `--accent: #22d3ee`, `--destructive: #ef4444`

## Existing components — reuse these, don't create near-duplicates
- Footer (components/Footer.tsx)
- LanguageToggle (components/LanguageToggle.tsx)
- LocaleProvider (components/LocaleProvider.tsx)
- Navbar (components/Navbar.tsx)

## Existing i18n namespaces
Every translation key must be namespaced (`hero.title`, never a bare `title`) so two components never collide on the same catalog slot. Reuse one of these, or pick a new, distinct name:
`alerts`, `analytics`, `breakdown`, `budgets`, `cta`, `dashboard`, `features`, `footer`, `hero`, `nav`, `stats`

When editing or adding pages: preserve the design system above, reuse existing components and the shared nav data file, and keep the established structure and tone.
