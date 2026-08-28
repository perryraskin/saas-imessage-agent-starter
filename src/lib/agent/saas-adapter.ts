/**
 * The only file an adopter must replace to connect the starter to a real SaaS.
 * Keep authorization and canonical mutations here, never in the model prompt.
 */

export const SAAS_TOOL_NAMES = [
  "get_account_summary",
  "update_notification_preference",
  "undo_last_change",
  "get_handoff_link",
  "submit_product_feedback",
] as const;

export type SaasToolName = (typeof SAAS_TOOL_NAMES)[number];

export type LinkedActor = {
  actorId: string;
  status: "active" | "paused";
  conversationId: string;
};

export type ToolExecution = {
  actorId: string;
  tool: SaasToolName;
  input: unknown;
  idempotencyKey: string;
  channel: "imessage" | "web";
};

const demoClaimedEvents = new Set<string>();

export function productionAdapterConfigured(): boolean {
  return process.env.SAAS_ADAPTER === "custom";
}

export function assertRealChannelReady(): void {
  if (!productionAdapterConfigured()) {
    throw new Error("Real iMessage delivery requires a custom SaaS adapter. See docs/ADAPT-YOUR-SAAS.md.");
  }
}

/** Atomically claim a provider event in your durable store. */
export async function claimInboundEvent(eventId: string): Promise<boolean> {
  if (productionAdapterConfigured()) {
    throw new Error("Implement claimInboundEvent with a unique event-id constraint before enabling iMessage.");
  }
  if (demoClaimedEvents.has(eventId)) return false;
  demoClaimedEvents.add(eventId);
  return true;
}

/** Resolve a hashed provider handle to a currently authorized SaaS actor. */
export async function resolveLinkedActor(_handleHash: string): Promise<LinkedActor | null> {
  if (productionAdapterConfigured()) {
    throw new Error("Implement resolveLinkedActor against your authenticated channel bindings.");
  }
  return null;
}

export async function updateChannelStatus(_actorId: string, _status: "active" | "paused"): Promise<void> {
  if (productionAdapterConfigured()) {
    throw new Error("Implement updateChannelStatus in your canonical channel-binding store.");
  }
}

/**
 * Execute through canonical domain services. Reauthorize at execution time,
 * derive actor identity server-side, and make mutations idempotent + auditable.
 */
export async function executeSaasTool(call: ToolExecution): Promise<Record<string, unknown>> {
  if (productionAdapterConfigured()) {
    throw new Error("Implement executeSaasTool with your authorization-aware domain services.");
  }
  if (!call.actorId.startsWith("starter-eval")) return { ok: false, error: "adapter_not_configured" };
  switch (call.tool) {
    case "get_account_summary":
      return { ok: true, plan: "Starter", openItems: 2, nextAction: "Connect your SaaS adapter" };
    case "update_notification_preference":
      return { ok: true, changed: true, changeId: call.idempotencyKey, preference: "weekly" };
    case "undo_last_change":
      return { ok: true, reverted: true };
    case "get_handoff_link":
      return { ok: true, url: `${process.env.SAAS_APP_URL || "http://localhost:3000"}/go/demo` };
    case "submit_product_feedback":
      return { ok: true, submitted: true };
  }
}
