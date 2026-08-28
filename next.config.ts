import type { NextConfig } from "next";
import { withEve } from "eve/next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: { unoptimized: true },
  skipTrailingSlashRedirect: true,
};

// Eve is isolated as its own Vercel service while sharing this origin with the
// product app. Workflow provides durable acceptance and retry of provider events.
export default withEve(withWorkflow(nextConfig), { eveRoot: "." });
