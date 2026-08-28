## What changed


## Why


## Verification

- [ ] `pnpm check`
- [ ] Regression test added or not applicable
- [ ] Documentation and changelog updated
- [ ] Deployed Eve eval run or not applicable
- [ ] Physical iMessage check run or not applicable

## Safety review

- [ ] No credentials, customer data, private transcripts, private URLs, or proprietary identifiers
- [ ] Authorization remains server-derived and checked at execution time
- [ ] Writes remain bounded, idempotent, audited, and reversible where promised
- [ ] Webhook, delivery, retry, and duplicate behavior considered
- [ ] Logs, analytics, errors, URLs, and OG metadata remain privacy-safe
- [ ] Simulator still deploys without secrets and real delivery still fails closed
