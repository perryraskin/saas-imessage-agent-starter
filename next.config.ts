import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  skipTrailingSlashRedirect: true,
};

// Workflow belongs to the Next.js channel adapter. Eve is built independently
// from the repository root with pnpm build:agent.
export default withWorkflow(nextConfig);
