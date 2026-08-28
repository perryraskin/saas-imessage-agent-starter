import { defineTool } from "eve/tools";
import { z } from "zod";
import { callSaasTool } from "../lib/saas-internal";

export default defineTool({
  description: "Immediately update a low-risk notification preference. The SaaS service must audit it and make it reversible.",
  inputSchema: z.object({ preference: z.enum(["off", "daily", "weekly"]) }).strict(),
  execute: (input, ctx) => callSaasTool("update_notification_preference", input, ctx),
});
