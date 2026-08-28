import { timingSafeEqual } from "node:crypto";
import { defineChannel, POST } from "eve/channels";
import { z } from "zod";

type State = { conversationId: string | null; userId: string | null };
const schema = z.object({ conversationId: z.string().trim().min(1).max(192), message: z.string().trim().min(1).max(2_000) }).strict();

function authorized(request: Request): boolean {
  if (process.env.CHANNEL_EVAL_ENABLED !== "true") return false;
  const expectedValue = process.env.CHANNEL_EVAL_SECRET?.trim();
  const suppliedValue = request.headers.get("x-channel-eval-secret")?.trim();
  if (!expectedValue || expectedValue.length < 32 || !suppliedValue) return false;
  const supplied = Buffer.from(suppliedValue, "utf8");
  const expected = Buffer.from(expectedValue, "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export default defineChannel<State>({
  kindHint: "imessage",
  turnPolicy: "queue",
  state: { conversationId: null, userId: null },
  metadata: () => ({ audience: "private" as const, qa: true }),
  routes: [
    POST<State>("/eve/v1/starter/eval/message", async (request, { from }) => {
      if (!authorized(request)) return Response.json({ ok: false }, { status: 404 });
      const parsed = schema.safeParse(await request.json().catch(() => null));
      if (!parsed.success) return Response.json({ ok: false, error: "invalid_request" }, { status: 400 });
      const userId = process.env.CHANNEL_EVAL_USER_ID?.trim() || "starter-eval-user";
      const session = await from(parsed.data.conversationId).send(parsed.data.message, {
        auth: {
          issuer: "starter-eval",
          authenticator: "channel-eval",
          principalId: userId,
          principalType: "user",
          attributes: { channel: "imessage", isTestAccount: "true" },
        },
        state: { conversationId: parsed.data.conversationId, userId },
        turnPolicy: "queue",
      });
      return Response.json({ ok: true, sessionId: session.id }, { status: 202 });
    }),
  ],
});
