import { connectLinqAdapter } from "@vercel/connect/chat";
import { renderImessageMessages } from "./render";
import { IMESSAGE_MAX_REPLY_CHARACTERS } from "./contracts";

const LINQ_API_BASE = "https://api.linqapp.com/api/partner/v3";

function connectorUid(): string {
  const value = process.env.IMESSAGE_LINQ_CONNECTOR?.trim();
  if (!value) throw new Error("IMESSAGE_LINQ_CONNECTOR is not configured.");
  return value;
}

async function apiKey(): Promise<string> {
  return (await connectLinqAdapter(connectorUid()).credentials()).apiKey;
}

export function linqWebhookVerifier() {
  return connectLinqAdapter(connectorUid()).webhookVerifier;
}

async function updatePresence(chatId: string, path: "read" | "typing", method: "POST" | "DELETE"): Promise<void> {
  const response = await fetch(`${LINQ_API_BASE}/chats/${encodeURIComponent(chatId)}/${path}`, {
    method,
    headers: { authorization: `Bearer ${await apiKey()}` },
    signal: AbortSignal.timeout(8_000),
  });
  if (!response.ok) throw new Error(`Linq ${path} update failed with status ${response.status}.`);
}

export function markChatRead(chatId: string): Promise<void> {
  return updatePresence(chatId, "read", "POST");
}

export function startTyping(chatId: string): Promise<void> {
  return updatePresence(chatId, "typing", "POST");
}

export function stopTyping(chatId: string): Promise<void> {
  return updatePresence(chatId, "typing", "DELETE");
}

export async function sendImessage(input: { chatId: string; text: string; idempotencyKey: string }): Promise<void> {
  const messages = renderImessageMessages(input.text);
  for (const [index, text] of messages.entries()) {
    const suffix = index === 0 ? "" : `:part-${index + 1}`;
    const idempotencyKey = `${input.idempotencyKey.slice(0, 255 - suffix.length)}${suffix}`;
    const response = await fetch(`${LINQ_API_BASE}/chats/${encodeURIComponent(input.chatId)}/messages`, {
      method: "POST",
      headers: {
        authorization: `Bearer ${await apiKey()}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        message: {
          parts: [{ type: "text", value: text.slice(0, IMESSAGE_MAX_REPLY_CHARACTERS) }],
          preferred_service: "iMessage",
          idempotency_key: idempotencyKey,
        },
      }),
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Linq delivery failed with status ${response.status}.`);
  }
}
