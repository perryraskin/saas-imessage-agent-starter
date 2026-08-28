# Contributing

Thank you for helping make SaaS iMessage agents more trustworthy and useful.

## Before opening work

- Use GitHub Discussions for broad design questions.
- Search existing issues before opening a bug or proposal.
- Report vulnerabilities privately through GitHub Security Advisories, never a public issue.
- Keep contributions generic and free of customer data, private transcripts, credentials, proprietary prompts, or product-specific identifiers.

## Development

Requirements: Node.js 24+ and pnpm.

```bash
git clone https://github.com/perryraskin/saas-imessage-agent-starter.git
cd saas-imessage-agent-starter
pnpm install
cp .env.example .env.local
pnpm check
```

Simulator mode needs no credentials. Do not enable real provider delivery against a personal or customer number while developing.

## Pull requests

1. Keep one coherent behavior change per pull request.
2. Add a regression test for channel behavior and failure fixes.
3. Update relevant docs, `.env.example`, and `CHANGELOG.md`.
4. Preserve the fail-closed adapter boundary and zero-secret simulator deploy.
5. Run `pnpm check` and include the result.
6. Describe privacy, authorization, idempotency, delivery, and rollback implications.

Maintainers may ask for a deployed Eve eval or physical iPhone evidence when changes affect transport, output formatting, typing, or rich previews.

## Commit style

Use concise imperative subjects such as `fix: keep preview URLs in their own bubble`. Do not add AI tools as co-authors unless the human contributor explicitly wants that attribution.

## License

By contributing, you agree that your contribution is licensed under the MIT License.
