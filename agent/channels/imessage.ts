import { timingSafeEqual } from "node:crypto";
import { defineChannel, POST } from "eve/channels";
import { z } from "zod";
import { channelDeliveryOrigin } from "../lib/saas-internal";

type State = {
  chatId: string | null;
  eventId: string | null;
  userId: string | null;
  turnStartedAt: number | null;
  progressDelivered: boolean;
  failureDelivered: boolean;
};

type Context = { state: State };

const inputSchema = z.object({
  chatId: z.string().trim().min(1).max(128),
  conversationId: z.string().trim().min(1).max(192),
  eventId: z.string().uuid(),
  message: z.string().trim().min(1).max(2_000),
  userId: z.string().trim().min(1).max(128),
}).strict();

function secret(): string {
  const value = process.env.AGENT_INTERNAL_SECRET?.trim();
  if (!value || value.length < 32) throw new Error("AGENT_INTERNAL_SECRET is not configured.");
  return value;
}

function authorized(request: Request): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7), "utf8");
  const expected = Buffer.from(secret(), "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

async function deliver(state: State, text: string, suffix: string, continueTyping = false): Promise<void> {
  if (!state.chatId || !state.eventId || !text.trim()) return;
  const response = await fetch(`${channelDeliveryOrigin()}/api/internal/agent/deliver`, {
    method: "POST",
    headers: { authorization: `Bearer ${secret()}`, "content-type": "application/json" },
    body: JSON.stringify({
      chatId: state.chatId,
      text: text.trim(),
      idempotencyKey: `eve:${state.eventId}:${suffix}`,
      continueTyping,
    }),
    redirect: "error",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`Delivery failed with status ${response.status}.`);
}

const initialState = (): State => ({
  chatId: null,
  eventId: null,
  userId: null,
  turnStartedAt: null,
  progressDelivered: false,
  failureDelivered: false,
});

export default defineChannel<State, Context>({
  kindHint: "imessage",
  turnPolicy: "queue",
  state: initialState(),
  context(state) {
    return { state };
  },
  metadata(state) {
    return { audience: "private" as const, userId: state.userId };
  },
  routes: [
    POST<State>("/eve/v1/starter/imessage/message", async (request, { from }) => {
      let allowed = false;
      try { allowed = authorized(request); } catch { /* fail closed */ }
      if (!allowed) return Response.json({ ok: false, error: "unauthorized" }, { status: 401 });
      const parsed = inputSchema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
      const state: State = {
        chatId: parsed.data.chatId,
        eventId: parsed.data.eventId,
        userId: parsed.data.userId,
        turnStartedAt: Date.now(),
        progressDelivered: false,
        failureDelivered: false,
      };
      const session = await from(parsed.data.conversationId).send(parsed.data.message, {
        auth: {
          issuer: "saas-product",
          authenticator: "imessage-link",
          principalId: parsed.data.userId,
          principalType: "user",
          attributes: { channel: "imessage" },
        },
        state,
        turnPolicy: "queue",
      });
      return Response.json({ ok: true, sessionId: session.id }, { status: 202 });
    }),
  ],
  events: {
    "turn.started"(_event, channel) {
      channel.state.turnStartedAt = Date.now();
      channel.state.progressDelivered = false;
      channel.state.failureDelivered = false;
    },
    async "message.completed"(event, channel) {
      if (!event.message) return;
      if (event.finishReason === "tool-calls") {
        const progress = event.message.split(/\r?\n/u).find((line) => line.trim())?.trim();
        if (!progress || channel.state.progressDelivered) return;
        channel.state.progressDelivered = true;
        await deliver(channel.state, progress, `progress:${event.turnId}:${event.stepIndex}`, true);
        return;
      }
      await deliver(channel.state, event.message, `complete:${event.turnId}`);
    },
    async "turn.failed"(_event, channel) {
      if (channel.state.failureDelivered) return;
      channel.state.failureDelivered = true;
      await deliver(channel.state, "I couldn’t finish that, and I haven’t claimed any unverified change. Please try once more.", "turn-failed");
    },
    async "session.failed"(_event, channel) {
      if (channel.state.failureDelivered) return;
      channel.state.failureDelivered = true;
      await deliver(channel.state, "I hit a persistent problem and couldn’t finish that. Your account is unchanged.", "session-failed");
    },
  },
});
