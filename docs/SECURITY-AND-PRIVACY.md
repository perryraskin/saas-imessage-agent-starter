# Security and privacy

## Threat model

Treat provider payloads, user messages, attachments, model output, tool input, tool output, web previews, analytics, and delivery callbacks as untrusted.

Primary risks include forged/replayed webhooks, recycled phone numbers, cross-account bindings, prompt injection, authorization drift, duplicate writes, misleading completion claims, sensitive lock-screen previews, crawler disclosure, provider log exposure, and test traffic reaching real users.

## Required controls

- Verify signed raw webhooks, strict schema, partner, event freshness, size, and supported chat type.
- Encrypt private provider payloads before durable workflow storage.
- Hash sender handles with a keyed secret; store only the minimum display suffix.
- Bind channels through a signed-in, expiring, single-use consent flow.
- Reauthorize every tool at execution time.
- Use least-privilege tools instead of database/model credentials.
- Make writes idempotent, transactional, audited, and undoable where promised.
- Handle STOP, resume, rate limits, quiet hours, and unlink deterministically.
- Keep URLs, OG metadata, logs, errors, and analytics privacy-minimized.
- Isolate canary accounts/numbers and flag test analytics.
- Keep the provider canary disabled by default, protect it with an independent operator secret, and allow it to target only a dedicated canary binding.
- Add kill switches for inbound processing, outbound delivery, and proactive messages.

## PostHog MCP Analytics

The starter emits canonical `$mcp_tool_call` events only when PostHog is configured. Summaries deliberately exclude raw messages, account/resource identifiers, financial or plan values, feedback content, URLs, signed tokens, tool results, and provider errors.

Review event samples before production. Document retention and access. Exclude test accounts from default product KPIs.

## High-risk actions

Do not enable purchases, payments, signatures, contract acceptance, permission/role changes, destructive deletion, export/sharing of private data, or third-party messages merely because the user is authenticated. Design a separate risk-appropriate workflow.

## Eve session policy

The agent explicitly requests Workflow retention `0`: the World deletes completed or failed run payloads and stream chunks. Completed transcripts/results may become unreadable, while run metadata may remain for the World's default period; exported traces are not deleted by this setting. Use a World that supports retention enforcement. Persist required domain records and audit history through the canonical SaaS adapter, not completed Eve transcripts.

Sessions use a 30-day **idle** timeout (not an absolute lifetime), and active turns do not expire. Each continuation window pauses before another model call once reported input reaches two million tokens, including cache reads. A user-approved continuation starts a new window; channels that cannot ask fail instead. This is a token guard, not a guaranteed dollar ceiling, and subagents inherit the check rather than sharing an atomic global quota. The starter does not author subagents. Review these bounds before adding them or enabling real provider delivery.

## Dependency security

Keep `pnpm-workspace.yaml` security overrides and the lockfile together. Undici 7.x resolves to at least 7.30.1, Eve's Undici 8.x resolves to 8.12.2, and vulnerable Zod 4.x versions resolve to 4.6.7. These floors address HTTP-client security issues and oversized-collection validation exhaustion without changing package major versions. The devalue override applies only below 5.9.3 so Workflow can use its required 6.x serializer. Remove overrides only after the upstream dependency graph resolves to safe versions; verify with `pnpm audit` and `pnpm check`.
