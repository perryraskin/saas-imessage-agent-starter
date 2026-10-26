import type { AgentLimitsDefinition, AgentWorkflowDefinition } from "eve";

/** Count cached input too, so replay-heavy sessions cannot evade the cap. */
export const runtimeLimits: AgentLimitsDefinition = {
  sessionTimeoutMs: 30 * 24 * 60 * 60 * 1_000,
  sessionUsage: ({ window }) => window.inputTokens >= 2_000_000,
};

/** Delete completed run payloads; canonical SaaS records remain in the adapter. */
export const workflowPolicy: AgentWorkflowDefinition = { retention: 0 };
