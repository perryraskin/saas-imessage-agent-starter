import { defineAgent } from "eve";
import { runtimeLimits, workflowPolicy } from "./lib/runtime-policy";

export default defineAgent({
  model: process.env.EVE_MODEL?.trim() || "openai/gpt-5.6-luna",
  limits: runtimeLimits,
  experimental: { workflow: workflowPolicy },
});
