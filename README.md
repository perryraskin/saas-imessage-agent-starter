# SaaS iMessage Agent Starter

[![CI](https://github.com/perryraskin/saas-imessage-agent-starter/actions/workflows/ci.yml/badge.svg)](https://github.com/perryraskin/saas-imessage-agent-starter/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-black.svg)](./LICENSE)

A production-minded starter for giving a SaaS or online product a real agent experience through iMessage.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fperryraskin%2Fsaas-imessage-agent-starter&project-name=saas-imessage-agent&repository-name=saas-imessage-agent)

The deploy button intentionally launches a safe, zero-configuration message simulator first. Real iMessage delivery remains off until you connect a provider and implement the authorization-aware adapter for your product.

## Why this exists

Most agent examples stop at chat UI, a webhook, or a model call. A trustworthy SaaS channel needs more:

- Durable multi-turn sessions that survive serverless and deployment interruption.
- Signed, bounded, deduplicated provider events.
- Secure account linking; a phone number is not authorization.
- Product-owned tools that reauthorize every read and write.
- Immediate low-risk writes with audit history, idempotency, and undo.
- Honest progress, typing, failure, and delivery behavior.
- Plain text and standalone URL bubbles that work in iMessage.
- Exact web handoffs with privacy-safe Open Graph previews.
- Feedback through the product's existing feedback system.
- Metadata-only PostHog MCP Analytics.
- Deployed-agent canaries and physical-device acceptance testing.
- Split-deployment origin safety and an operator-only real-provider canary.

This starter packages those boundaries without shipping a fake universal auth or database layer.

## Architecture

```text
Linq / iMessage
       │ signed webhook
       ▼
Durable Workflow ── bounded input · sealed payload · dedupe · retry
       │
       ▼
Eve session ─────── durable context · tools · trace · evals
       │ actor-scoped internal calls
       ▼
Your SaaS services ─ authorization · canonical writes · audit · undo
       │
       ├── PostHog MCP Analytics (metadata only)
       └── Exact UI link + privacy-safe dynamic OG preview
```

Read [Architecture](./docs/ARCHITECTURE.md) and [Threat model](./docs/SECURITY-AND-PRIVACY.md) before enabling a real channel.

## What ships

| Capability | Starter behavior |
| --- | --- |
| One-click Vercel deploy | Zero-secret response renderer and architecture demo |
| iMessage transport | Linq via Vercel Connect; disabled until explicitly configured |
| Agent runtime | Eve durable sessions and queue-per-conversation policy |
| Event durability | Vercel Workflow with encrypted event envelopes and retry hooks |
| SaaS tools | Typed read, reversible write, undo, handoff, and feedback examples |
| Native output | Markdown removal, safe splitting, standalone URL bubbles |
| Presence | Read and typing lifecycle tied to real execution |
| Analytics | Optional canonical `$mcp_tool_call` events via PostHog MCP Analytics |
| Rich handoff | Exact-link and dynamic OG example with privacy guidance |
| QA | Unit tests, Eve deployed evals, operator-only provider canary, CI, and physical-client checklist |
| Community | MIT license, contributing guide, code of conduct, security policy, templates, discussions |

## Quick start

### 1. Deploy the safe simulator

Use the deploy button above. No credentials are requested and no message can be sent to a real person.

### 2. Run locally

Requirements: Node.js 24+ and pnpm.

```bash
git clone https://github.com/perryraskin/saas-imessage-agent-starter.git
cd saas-imessage-agent-starter
pnpm install
cp .env.example .env.local
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000).

### 3. Adapt it to your SaaS

Implement the five integration functions in [`src/lib/agent/saas-adapter.ts`](./src/lib/agent/saas-adapter.ts). The starter deliberately fails closed when `SAAS_ADAPTER=custom` is set but those methods still contain placeholders.

Follow [Adapt your SaaS](./docs/ADAPT-YOUR-SAAS.md), including durable account bindings, event claiming, execution-time authorization, audit records, undo, feedback, and signed handoffs.

### 4. Connect iMessage

Follow [Linq and Vercel Connect setup](./docs/LINQ-SETUP.md). Configure the webhook only after your adapter and account-linking flow pass their tests.

### 5. Prove the real path

```bash
pnpm check

CHANNEL_EVAL_TARGET_URL=https://your-deployment.vercel.app \
CHANNEL_EVAL_SECRET=your-isolated-eval-secret \
pnpm eval:deployed
```

Then run the [physical iPhone checklist](./docs/TESTING.md#physical-imessage-acceptance).

The deployed Eve eval deliberately stops before Linq. Before production changes are called healthy, run the [provider canary](./docs/TESTING.md#provider-canary) and require evidence through the actual connector-owning delivery deployment.

## Principles

1. The product database and domain services remain the source of truth.
2. The provider handle and conversation history are never authorization.
3. The model never gets direct database credentials.
4. Low-risk writes may flow naturally only when they are idempotent, audited, and reversible.
5. High-risk, destructive, financial, permission, signature, contract, and third-party actions stay unavailable by default.
6. Never claim progress or completion from model text alone.
7. URLs are raw, standalone messages; sensitive data never belongs in public OG metadata.
8. Test the deployed agent and provider path, not just a mocked model call.

## Project status

The repo is intentionally useful on day one and explicit about what remains adopter-specific. See [Roadmap](./ROADMAP.md) and [Changelog](./CHANGELOG.md). Eve is currently beta, so pin versions and review upstream release notes before upgrades.

## Upstream foundations

- [Vercel Eve](https://github.com/vercel/eve)
- [Vercel Eve examples](https://github.com/vercel/eve-examples)
- [Vercel Personal Agent Template](https://github.com/vercel-labs/personal-agent-template)
- [Vercel Connect + Linq](https://vercel.com/changelog/vercel-connect-now-supports-linq)
- [Linq API documentation](https://docs.linqapp.com/)
- [PostHog MCP Analytics](https://posthog.com/docs/mcp-analytics)

## Contributing and security

Contributions are welcome. Read [CONTRIBUTING.md](./CONTRIBUTING.md), [CODE_OF_CONDUCT.md](./CODE_OF_CONDUCT.md), and [SECURITY.md](./SECURITY.md). Do not report vulnerabilities in public issues.

## License

[MIT](./LICENSE) © Perry Raskin.
