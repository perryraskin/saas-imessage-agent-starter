# Linq and Vercel Connect setup

## Before provisioning

Confirm Linq and Apple/provider terms allow your intended transactional agent use. Document retention, subprocessors, fallback behavior, support access, deletion, incident response, opt-out, quiet hours, and consent. Do not silently downgrade private content to SMS.

## Setup

1. Deploy the starter to Vercel.
2. Add Linq through Vercel Connect and copy the connector UID into `IMESSAGE_LINQ_CONNECTOR`.
3. Set `IMESSAGE_LINQ_PARTNER_ID` from the Linq partner configuration.
4. Set `SAAS_APP_URL` to the production HTTPS origin.
5. Generate independent 32+ character values for `AGENT_INTERNAL_SECRET` and `IMESSAGE_EVENT_SEALING_KEY`.
6. Implement and test the SaaS adapter and authenticated linking flow.
7. Configure Linq's signed webhook to `https://your-domain.example/api/webhooks/linq`.
8. Enable isolated test accounts with `IMESSAGE_ENABLED=true` and `SAAS_ADAPTER=custom`.
9. Run deployed evals twice and the physical-device checklist before expanding the cohort.

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
