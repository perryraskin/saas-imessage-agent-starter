# Architecture

## Production boundary

Use one repository and three independently deployable Vercel projects:

```text
iMessage / Linq
       │ signed webhook
       ▼
Channel adapter (Next.js + Workflow + Linq connector)
       │ authenticated turn
       ▼
Standalone Eve service
       │                         │
       │ actor-scoped tools      └── provider delivery
       ▼                                  ▼
Canonical SaaS app               Channel adapter
authorization + data             native render + Linq send
```

The split is about ownership, not extra databases:

- The **canonical SaaS project** owns users, authorization, domain data, mutations, audit/undo records, and the product UI.
- The **channel adapter project** verifies Linq webhooks, owns consent and account bindings, accepts encrypted events into Vercel Workflow, applies channel policy, and delivers through the Linq connector.
- The **standalone Eve project** owns durable conversation orchestration, model/tool selection, channel events, traces, and evals. It has no product database or provider credential.

All three projects may deploy from the same repository. Keep the Vercel Root Directory blank. Build the two Next.js projects with `pnpm build`; build the standalone Eve project from the repository root with `pnpm build:agent`. The nested `agent/` folder is Eve's authored source layout, not a separate package.

The deploy button creates only the safe simulator project. A real channel requires the three-project setup below.

## Explicit directional origins

These paths must never share one catch-all origin in a deployed environment:

| Direction | Required setting | Destination |
| --- | --- | --- |
| Channel adapter → Eve | `AGENT_SERVICE_ORIGIN` | Standalone Eve project |
| Eve → canonical SaaS tools | `SAAS_INTERNAL_API_ORIGIN` | Canonical SaaS project |
| Eve → provider delivery | `CHANNEL_DELIVERY_ORIGIN` | Connector-owning channel adapter |

The resolvers fail closed on Vercel when an explicit destination is missing. This prevents an accepted webhook or successful Eve turn from silently calling the wrong project.

Use one independent 32+ character `AGENT_INTERNAL_SECRET` value across the three authenticated service boundaries. Scope all other credentials narrowly:

- Product database/auth credentials: canonical SaaS project only.
- Linq connector and event-sealing key: channel adapter only.
- Model and Eve runtime configuration: standalone Eve project only.

## Inbound sequence

```text
Linq signs message.received
  → channel adapter verifies the signature against the raw request
  → validates size, schema, partner, freshness, and one-to-one chat
  → encrypts the private provider payload
  → starts a durable Workflow
  → adapter atomically claims event_id
  → adapter resolves hashed handle to a current actor binding
  → STOP / RESUME is handled deterministically
  → adapter dispatches the authenticated turn to standalone Eve
  → Eve calls bounded SaaS tools
  → canonical SaaS service reauthorizes and executes
  → Eve calls the channel adapter's delivery boundary
  → adapter renders native bubbles and sends through Linq
```

Webhook acknowledgement, Workflow dispatch, and Eve completion do not prove delivery. Operational evidence must continue through the connector-owning deployment and provider acceptance.

## Data ownership

| Data | Owner |
| --- | --- |
| Users, accounts, subscriptions, domain records | Canonical SaaS |
| Channel consent and hashed-handle binding | Canonical SaaS or its explicit channel-binding store |
| Event deduplication and delivery audit | Channel adapter / canonical operational store |
| Conversation execution and trace | Eve |
| Provider delivery state | Linq, reconciled into operational records |
| Product analytics | Existing product analytics; agent tool metadata only |

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
