import { defineTool } from "eve/tools";
import { z } from "zod";
import { callSaasTool } from "../lib/saas-internal";

export default defineTool({
  description: "Revert the latest eligible agent change when the SaaS service confirms it is still conflict-safe.",
  inputSchema: z.object({}).strict(),
  execute: (input, ctx) => callSaasTool("undo_last_change", input, ctx),
});
