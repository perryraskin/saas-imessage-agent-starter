function internalSecret(): string {
  const value = process.env.AGENT_INTERNAL_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("AGENT_INTERNAL_SECRET is not configured.");
  return value;
}

function agentOrigin(): string {
  const explicit = process.env.AGENT_SERVICE_ORIGIN?.trim().replace(/\/$/, "");
  if (explicit) return explicit;
  if (process.env.SAAS_APP_URL) return process.env.SAAS_APP_URL.replace(/\/$/, "");
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function dispatchToAgent(input: {
  chatId: string;
  conversationId: string;
  eventId: string;
  message: string;
  userId: string;
}): Promise<string> {
  const response = await fetch(`${agentOrigin()}/eve/v1/starter/imessage/message`, {
    method: "POST",
    headers: { authorization: `Bearer ${internalSecret()}`, "content-type": "application/json" },
    body: JSON.stringify(input),
    redirect: "error",
    signal: AbortSignal.timeout(20_000),
  });
  const result = await response.json().catch(() => null) as { ok?: boolean; sessionId?: string } | null;
  if (!response.ok || result?.ok !== true || !result.sessionId) {
    throw new Error(`Eve rejected the iMessage turn with status ${response.status}.`);
  }
  return result.sessionId;
}
