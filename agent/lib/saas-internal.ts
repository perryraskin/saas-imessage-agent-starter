import type { ToolContext } from "eve/tools";

export type ToolName =
  | "get_account_summary"
  | "update_notification_preference"
  | "undo_last_change"
  | "get_handoff_link"
  | "submit_product_feedback";

export function saasInternalOrigin(): string {
  const explicit = process.env.SAAS_INTERNAL_API_ORIGIN?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  const configured = process.env.SAAS_APP_URL?.trim().replace(/\/$/, "");
  if (configured) return configured;
  if (process.env.VERCEL_ENV === "production") {
    throw new Error("SAAS_INTERNAL_API_ORIGIN or SAAS_APP_URL is required for production SaaS tools.");
  }
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export function channelDeliveryOrigin(): string {
  const explicit = process.env.CHANNEL_DELIVERY_ORIGIN?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.VERCEL_ENV) {
    throw new Error("CHANNEL_DELIVERY_ORIGIN is required for a deployed Eve service.");
  }
  return saasInternalOrigin();
}

function secret(): string {
  const value = process.env.AGENT_INTERNAL_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("The internal SaaS tool boundary is not configured.");
  return value;
}

export async function callSaasTool(tool: ToolName, input: unknown, ctx: ToolContext): Promise<unknown> {
  const caller = ctx.session.auth.current;
  if (!caller || caller.principalType !== "user") return { ok: false, error: "unauthorized" };
  const response = await fetch(`${saasInternalOrigin()}/api/internal/agent/tools`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret()}`, "content-type": "application/json" },
    body: JSON.stringify({
      userId: caller.principalId,
      tool,
      input,
      channel: "imessage",
      idempotencyKey: `${ctx.session.turn.id}:${ctx.callId}:${tool}`,
      telemetry: {
        conversationId: ctx.session.id,
        testAccount: caller.attributes.isTestAccount === "true",
      },
    }),
    redirect: "error",
    signal: AbortSignal.timeout(30_000),
  });
  return response.json().catch(() => ({ ok: false, error: "invalid_internal_response" }));
}
