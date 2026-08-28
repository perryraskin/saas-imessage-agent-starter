import { defineTool } from "eve/tools";
import { z } from "zod";
import { callSaasTool } from "../lib/saas-internal";

export default defineTool({
  description: "Create an exact authorized link to the relevant SaaS UI with privacy-safe social preview metadata.",
  inputSchema: z.object({ destination: z.string().trim().min(1).max(64) }).strict(),
  execute: (input, ctx) => callSaasTool("get_handoff_link", input, ctx),
});
