# Agent contribution notes

This repository is a public starter, not a production SaaS database. Keep examples generic and never copy customer data, credentials, private URLs, proprietary prompts, or product-specific identifiers into it.

Before calling work complete:

1. Run `pnpm check`.
2. Update documentation when configuration, security boundaries, or deployment changes.
3. Add a regression test for every channel bug.
4. Keep simulator mode deployable without secrets.
5. Keep real provider delivery disabled until the adopter explicitly configures a production SaaS adapter.

Use Conventional Commit-style subjects and never commit secrets or generated `.vercel`, `.eve`, `.workflow`, or environment files.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
