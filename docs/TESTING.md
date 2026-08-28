# Testing

## Local checks

```bash
pnpm check
```

The suite covers native message rendering, standalone links, payload bounds, cryptographic event envelopes, internal authentication, and privacy-safe MCP Analytics. Add a regression test for every channel bug.

## Deployed Eve evals

The disabled-by-default eval channel creates real Eve sessions with a fixed test actor and the demo adapter. It does not call Linq or contact a phone.

```bash
CHANNEL_EVAL_ENABLED=true
CHANNEL_EVAL_SECRET=at-least-32-random-characters
CHANNEL_EVAL_USER_ID=starter-eval-user

CHANNEL_EVAL_TARGET_URL=https://your-deployment.vercel.app \
CHANNEL_EVAL_SECRET=$CHANNEL_EVAL_SECRET \
pnpm eval:deployed
```

Require two consecutive passes. In your production adapter, use a dedicated fixture account and deterministic reset/snapshot methods that cannot accept arbitrary customer IDs.

## Provider canary

Use a dedicated number and account. Exercise signed inbound handling, read/typing presence, thread continuity, delivery state, formatting, feedback, one reversible write, undo, and exact handoff. Cap frequency and ensure it cannot reach a customer.

The disabled-by-default `/api/internal/imessage/canary` route turns a genuine encrypted Workflow envelope into a fresh provider-level test. It opens the source only in memory, requires its chat to equal the server-only `IMESSAGE_PROVIDER_CANARY_CHAT_ID`, preserves that dedicated canary chat/sender identity, replaces the text plus event/message/trace IDs and timestamp, encrypts it again, and starts the same Workflow as real ingress. It requires both `IMESSAGE_ENABLED=true` and `IMESSAGE_PROVIDER_CANARY_ENABLED=true`, plus an independent `IMESSAGE_PROVIDER_CANARY_SECRET` sent as `x-imessage-canary-token`.

Prepare a JSON body from a genuine encrypted event belonging to the dedicated canary account:

```json
{
  "eventId": "source-event-uuid",
  "sealedEvent": "authenticated-ciphertext-from-workflow",
  "message": "Automated production delivery check: summarize my test account."
}
```

Then invoke the deployed channel origin:

```bash
curl --fail-with-body \
  -H 'content-type: application/json' \
  -H "x-imessage-canary-token: $IMESSAGE_PROVIDER_CANARY_SECRET" \
  --data-binary @provider-canary.json \
  https://channel.example.com/api/internal/imessage/canary
```

Do not call the test complete when the route returns `202` or when the ingress Workflow says `dispatched`. Require evidence that Eve ran in the intended deployment, canonical tools succeeded when expected, the delivery route ran in the connector-owning deployment, and the provider accepted the outbound message. Finally confirm the bubble on a physical Apple client. Delete temporary ciphertext and operator-secret files after the run.

## Physical iMessage acceptance

Run on a real iPhone whenever transport, formatting, contact identity, or OG previews change:

- First inbound gets a timely read/typing indication and terminal reply.
- No raw Markdown appears.
- Long responses split at sensible boundaries.
- The exact URL arrives alone and unfurls.
- The preview is useful but safe on the lock screen and when forwarded.
- Multi-turn references, interruptions, and “start over” behave naturally.
- A clear low-risk write executes once, reports the actual result, and can be undone.
- A provider/model/tool timeout ends typing and produces an honest recovery message.
- STOP, resume, pause, unlink, stale auth, and revoked access behave deterministically.
- Feedback actually reaches the existing feedback destination.

## Trace requirements

Failures should correlate inbound event, workflow run, Eve session/turn, tool calls, audit change, MCP Analytics, outbound idempotency key, delivery deployment, and provider delivery status without storing message content in broad logs.
