# Changelog

## Unreleased

- Separated Next.js-to-Eve dispatch, Eve-to-SaaS data tools, and Eve-to-provider delivery origins so isolated Vercel deployments cannot silently route work or replies through the wrong project.
- Added regression coverage for split-origin resolution.
- Added a disabled-by-default operator canary that re-seals a dedicated account's genuine encrypted provider event with fresh identity and exercises the real Workflow → Eve → SaaS → Linq path.

## 0.1.0 — 2026-08-28

- Published the zero-configuration iMessage response simulator and one-click Vercel deployment.
- Added Eve durable channel orchestration and an isolated deployed-eval channel.
- Added Linq through Vercel Connect, signed/bounded webhooks, encrypted Workflow envelopes, and provider presence/delivery helpers.
- Added an explicit authorization-aware SaaS adapter boundary with read, reversible write, undo, handoff, and feedback tools.
- Added native iMessage rendering with Markdown removal, safe splitting, and standalone URL bubbles.
- Added privacy-safe dynamic OG handoff example and PostHog MCP Analytics.
- Added CI, security guidance, contributing standards, issue/PR templates, Dependabot, CodeQL, and a maintenance reminder.
- Pinned Workflow's transitive `nanoid` dependency to the first patched release for GHSA-mwcw-c2x4-8c55.
