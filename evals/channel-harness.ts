import type { EveEvalContext, EveEvalSession } from "eve/evals";

function secret(): string {
  const value = process.env.CHANNEL_EVAL_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("CHANNEL_EVAL_SECRET is required for channel evals.");
  return value;
}

export async function sendViaChannel(t: EveEvalContext, conversationId: string, message: string): Promise<EveEvalSession> {
  const response = await t.target.fetch("/eve/v1/starter/eval/message", {
    method: "POST",
    headers: { "content-type": "application/json", "x-channel-eval-secret": secret() },
    body: JSON.stringify({ conversationId, message }),
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; sessionId?: string } | null;
  if (!response.ok || !result?.sessionId) throw new Error(`Eval channel rejected the request with status ${response.status}.`);
  return t.target.attachSession(result.sessionId);
}

export function finalAssistantMessage(events: readonly { type: string; data?: unknown }[]): string {
  return events.flatMap((event) => {
    if (event.type !== "message.completed") return [];
    const data = event.data as { message?: unknown; finishReason?: unknown };
    return typeof data.message === "string" && data.finishReason !== "tool-calls" ? [data.message] : [];
  }).at(-1) ?? "";
}
