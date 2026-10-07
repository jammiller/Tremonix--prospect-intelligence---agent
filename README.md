# Tremonix Prospect Intelligence Agent

A browser-local MVP for the PulseOS prospect pipeline. Includes company/contact entry and editing, CSV import/export, search and priority filters, transparent qualification scoring, fact-based summaries, editable outreach templates, and next-action tracking.

## Run and test

Requires Node.js 22 or newer. No runtime dependencies.

```
npm test
npm run build
npx serve dist
```

Vercel uses `npm run build` and serves `dist` (see vercel.json).

## Limits and data handling

Data persists in localStorage in the current browser only. There is no authentication, shared database, live discovery, enrichment, verified contact lookup, monitoring, CRM connection, email sending, predictive ML, or AI model integration. Summaries and outreach are deterministic templates. Fictional examples are explicitly labeled and loaded only on request. Do not use this prototype to store sensitive data on shared devices. Clearing browser storage loses data; export regularly.

Score: product fit 30, verified buying signals 10 each (maximum 30), budget potential 20, growth indicators 15, prior engagement 5. Hot 80+, Warm 60–79, Nurture 40–59, Low Priority below 40. All factors are entered by the user; the score is not a probability of conversion.

CSV requires `companyName`. Optional columns: industry, location, employees, revenue, website, firstName, lastName, title, email, phone, linkedin, nextAction, fit, signals, budget, growth, engaged. Booleans use true/false. Import does not deduplicate or independently verify facts. Exports neutralize formula-leading characters for spreadsheet safety.

## Next milestones

Authenticated shared storage and access controls; approved public-data providers with provenance; CRM adapter; server-side AI summaries with evidence and review; scheduled buying-signal monitoring; consent-aware outreach workflows. No automated scraping or outreach is enabled by this MVP.

## Authentication and cloud storage update

The authenticated version replaces local-only active storage with Supabase PostgreSQL and email/password sign-in. Follow **SETUP.md** and apply **supabase/schema.sql** before use. The earlier local-only description documents the initial MVP; current active records are cloud-backed and per-account. Local records are retained solely for explicit migration. No AI, CRM, or research integration has been added.
