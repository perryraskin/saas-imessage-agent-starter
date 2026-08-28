import { defineTool } from "eve/tools";
import { z } from "zod";
import { callSaasTool } from "../lib/saas-internal";

export default defineTool({
  description: "Read a concise live summary for the authenticated user's SaaS account.",
  inputSchema: z.object({}).strict(),
  execute: (input, ctx) => callSaasTool("get_account_summary", input, ctx),
});
