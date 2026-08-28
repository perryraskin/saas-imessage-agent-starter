# Maintainer sync

This starter is intended to absorb reusable lessons from real SaaS iMessage deployments.

## When production work lands

For every production channel change, ask:

1. Is the problem generic to SaaS iMessage agents?
2. Can the solution be published without customer data, secrets, private URLs, proprietary business logic, or vendor-contract details?
3. Does it belong in core code, an adapter example, a regression test, documentation, or the physical checklist?

If yes, open or update an issue here in the same development cycle. Port the regression test first, then the generic fix. Link the public issue from the private/product task rather than copying private context into this repository.

## Monthly reminder

`.github/workflows/maintenance-reminder.yml` opens one deduplicated maintenance issue when no reminder is already open. Maintainers review production learnings, upstream Eve/Linq/Vercel/PostHog changes, dependency/security alerts, open roadmap items, docs accuracy, and deploy-button health.

## Release discipline

- Keep `main` deployable in simulator mode without credentials.
- Pin beta infrastructure intentionally and review release notes.
- Add entries to `CHANGELOG.md` for user-visible or architectural changes.
- Run `pnpm check` and deployed evals before tagging a release.
- Never copy private transcripts or analytics into issues; summarize the generic failure mode.
