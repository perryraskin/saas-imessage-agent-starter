import { defineTool } from "eve/tools";
import { z } from "zod";
import { callSaasTool } from "../lib/saas-internal";

export default defineTool({
  description: "Submit explicit product feedback through the SaaS product's existing feedback system.",
  inputSchema: z.object({ feedback: z.string().trim().min(3).max(2_000), contactPermission: z.boolean().default(false) }).strict(),
  execute: (input, ctx) => callSaasTool("submit_product_feedback", input, ctx),
});
