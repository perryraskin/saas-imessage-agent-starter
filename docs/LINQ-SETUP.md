# Linq and Vercel Connect setup

## Before provisioning

Confirm Linq and Apple/provider terms allow your intended transactional agent use. Document retention, subprocessors, fallback behavior, support access, deletion, incident response, opt-out, quiet hours, and consent. Do not silently downgrade private content to SMS.

## Setup

1. Use the deploy button for the zero-secret simulator only.
2. For a real channel, create three Vercel projects from the same repository with blank Root Directory:
   - canonical SaaS: `pnpm build`
   - channel adapter: `pnpm build`
   - standalone Eve: `pnpm build:agent`
3. Add Linq through Vercel Connect to the channel adapter only and copy the connector UID into `IMESSAGE_LINQ_CONNECTOR`.
4. Set `IMESSAGE_LINQ_PARTNER_ID` from the Linq partner configuration.
5. Set `SAAS_APP_URL` to the production HTTPS origin.
6. Generate independent 32+ character values for `AGENT_INTERNAL_SECRET` and `IMESSAGE_EVENT_SEALING_KEY`.
7. Configure the directional origins:
   - channel adapter: `AGENT_SERVICE_ORIGIN=https://agent.example.com`
   - standalone Eve: `SAAS_INTERNAL_API_ORIGIN=https://app.example.com`
   - standalone Eve: `CHANNEL_DELIVERY_ORIGIN=https://channel.example.com`
8. Implement and test the SaaS adapter and authenticated linking flow.
9. Configure Linq's signed webhook to `https://channel.example.com/api/webhooks/linq`.
10. Enable isolated test accounts with `IMESSAGE_ENABLED=true` and `SAAS_ADAPTER=custom`.
11. Run deployed evals twice and the physical-device checklist before expanding the cohort.

## Vercel project boundaries

- Set `AGENT_SERVICE_ORIGIN` on the channel adapter to standalone Eve.
- Set `SAAS_INTERNAL_API_ORIGIN` on Eve to the canonical SaaS origin.
- Set `CHANNEL_DELIVERY_ORIGIN` on Eve to the connector-owning channel adapter.
- Attach the Linq connector only to the channel adapter.
- Keep product database/auth credentials off Eve and provider credentials off the canonical SaaS and Eve projects.

All three deployed-origin resolvers fail closed when these boundaries are missing.
Do not point delivery at the canonical SaaS unless that exact project owns the
connector. A successful Eve turn does not prove that the user received a
message.

## Webhook behavior

The webhook rejects disabled, unsigned, oversized, malformed, wrong-partner, stale, and future-dated events. Accepted private payloads are encrypted before entering Workflow. Your adapter must still provide durable event claiming; Workflow retry does not replace application idempotency.

## Account linking

The included `/connect/imessage` page is intentionally explanatory. Replace it with a signed-in flow that:

- Shows the destination handle, protocols/fallback, data use, cadence, and consent version.
- Creates a short-lived, single-use challenge bound to the authenticated user.
- Consumes that challenge only when the inbound handle proves control.
- Prevents one handle from linking to multiple users unexpectedly.
- Supports inspect, pause, resume, unlink, revocation, and recycled-number recovery.
- Fails closed when identity or authorization is ambiguous.
