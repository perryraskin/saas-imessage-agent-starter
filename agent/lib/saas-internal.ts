import type { ToolContext } from "eve/tools";

export type ToolName =
  | "get_account_summary"
  | "update_notification_preference"
  | "undo_last_change"
  | "get_handoff_link"
  | "submit_product_feedback";

function appOrigin(): string {
  const explicit = process.env.SAAS_INTERNAL_API_ORIGIN?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.SAAS_APP_URL) return process.env.SAAS_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

function secret(): string {
  const value = process.env.AGENT_INTERNAL_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("The internal SaaS tool boundary is not configured.");
  return value;
}

export async function callSaasTool(tool: ToolName, input: unknown, ctx: ToolContext): Promise<unknown> {
  const caller = ctx.session.auth.current;
  if (!caller || caller.principalType !== "user") return { ok: false, error: "unauthorized" };
  const response = await fetch(`${appOrigin()}/api/internal/agent/tools`, {
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
