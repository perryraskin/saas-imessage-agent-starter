# Architecture

## Boundary

The repository uses two logical services on one Vercel origin:

- The Next.js product boundary verifies Linq webhooks, accepts events into Vercel Workflow, resolves linked actors, executes domain tools, sends replies, and owns analytics.
- Eve owns durable conversation orchestration, model/tool selection, channel events, traces, and evals.

Eve calls the product boundary with a shared internal secret and an authenticated actor derived from a previously verified channel binding. Eve never receives your product database credentials.

## Inbound sequence

```text
Linq signs message.received
  → Next.js verifies signature against raw request
  → validates size, schema, partner, freshness, and one-to-one chat
  → encrypts the private provider payload
  → starts a durable Workflow
  → adapter atomically claims event_id
  → adapter resolves hashed handle to a current actor binding
  → STOP / RESUME is handled deterministically
  → Eve queues the turn on the durable conversation
  → Eve calls bounded SaaS tools
  → product service reauthorizes and executes
  → Eve completion is rendered into native bubbles
  → Linq sends with deterministic idempotency keys
```

## Why provider and agent are separate

Webhook acknowledgement should be fast and deterministic. Model execution can be slow, variable, and retryable. Workflow accepts the provider event; Eve handles durable reasoning; the product service remains authoritative.

## Data ownership

| Data | Owner |
| --- | --- |
| Users, accounts, subscriptions, domain records | Your SaaS |
| Channel consent and hashed-handle binding | Your SaaS |
| Event deduplication and delivery audit | Your SaaS |
| Conversation execution and trace | Eve |
| Provider delivery state | Linq, reconciled into your operational records |
| Product analytics | PostHog, metadata-only for agent tool events |

## Scaling out

Start as one repository and one Vercel project. Split Eve into its own project when its deploy/rollback cycle, secrets, traffic, region, or ownership must be independent. Keep the same internal actor-scoped tool contract; do not create a second database-owning backend.

## Required production substitutions

`src/lib/agent/saas-adapter.ts` is an explicit seam, not a production database. Replace its demo implementations with:

- Atomic unique event claiming.
- Current channel-binding lookup by keyed handle hash.
- Pause/resume/unlink state.
- Execution-time role and resource authorization.
- Idempotent canonical writes and audit events.
- Conflict-safe undo.
- Short-lived exact handoff links.
- Existing feedback ingestion.
