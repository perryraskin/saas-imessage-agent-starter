import { NextResponse } from "next/server";
import { z } from "zod";
import { authorizedInternalRequest } from "@/lib/imessage/security";
import { sendImessage, startTyping, stopTyping } from "@/lib/imessage/provider.server";
import { IMESSAGE_MAX_REPLY_CHARACTERS } from "@/lib/imessage/contracts";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  chatId: z.string().trim().min(1).max(128),
  text: z.string().trim().min(1).max(IMESSAGE_MAX_REPLY_CHARACTERS * 3),
  idempotencyKey: z.string().trim().min(1).max(255),
  continueTyping: z.boolean().optional().default(false),
}).strict();

export async function POST(request: Request) {
  try {
    if (!authorizedInternalRequest(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });
  await stopTyping(parsed.data.chatId).catch(() => undefined);
  await sendImessage(parsed.data);
  if (parsed.data.continueTyping) await startTyping(parsed.data.chatId).catch(() => undefined);
  return NextResponse.json({ ok: true });
}
