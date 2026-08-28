# Adapt your SaaS

## Implement the adapter

Replace the demo methods in `src/lib/agent/saas-adapter.ts`. Do not dynamically import an arbitrary adapter path from an environment variable; keep the integration visible to TypeScript, tests, and code review.

### `claimInboundEvent`

Insert the provider `event_id` into a durable table with a unique constraint. Return `false` on a duplicate. Track attempts, terminal outcome, and provider trace ID separately if needed.

### `resolveLinkedActor`

Look up a keyed hash of the sender handle in a channel-binding table. Return only an active or paused binding whose user/account still exists. Never accept a user ID from a provider payload or model output.

Suggested binding fields:

```text
user_id · handle_hmac · handle_last4 · provider_handle_id
status · consent_version · linked_at · paused_at · unlinked_at
conversation_id · state_version · last_event_at
```

### `updateChannelStatus`

Update pause/resume/unlink state transactionally and record who/what caused it. STOP must not depend on the model.

### `executeSaasTool`

Call the same domain services used by your web UI. For every call:

1. Load the actor from trusted server context.
2. Reauthorize the target account/resource at execution time.
3. Validate with a strict schema.
4. Use the supplied idempotency key for writes.
5. Write canonical data and audit history in one transaction.
6. Return structured results; the model may summarize but not invent success.
7. For reversible writes, store the previous value/version and implement conflict-safe undo.

### Handoff links

Return an HTTPS link that lands on the exact entity or action. Prefer a short-lived opaque token that contains no sensitive data, then reauthorize in the browser before redirecting. Preview crawlers must receive a privacy-safe generic card, never authenticated page content.

### Feedback

Connect to your existing feedback/survey ingestion. Preserve the user's meaning, tag the iMessage channel, and keep contact permission explicit. Broad analytics should contain only feedback-present/contact-permission metadata, not feedback text.

## Add tools carefully

For each proposed tool, document:

- Product value and natural-language examples.
- Roles and resources allowed.
- Read-only, immediate reversible write, or unavailable/high risk.
- Input bounds and domain validation.
- Idempotency and concurrency behavior.
- Audit and undo behavior.
- Safe response fields and analytics summary.
- Failure and revoked-authorization tests.

Do not expose generic SQL, HTTP, shell, arbitrary URL fetch, or dynamic code execution to an account agent.
