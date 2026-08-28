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
- Add kill switches for inbound processing, outbound delivery, and proactive messages.

## PostHog MCP Analytics

The starter emits canonical `$mcp_tool_call` events only when PostHog is configured. Summaries deliberately exclude raw messages, account/resource identifiers, financial or plan values, feedback content, URLs, signed tokens, tool results, and provider errors.

Review event samples before production. Document retention and access. Exclude test accounts from default product KPIs.

## High-risk actions

Do not enable purchases, payments, signatures, contract acceptance, permission/role changes, destructive deletion, export/sharing of private data, or third-party messages merely because the user is authenticated. Design a separate risk-appropriate workflow.
