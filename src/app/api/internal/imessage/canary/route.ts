import { createHash, randomUUID, timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { z } from "zod";
import { openImessageEvent, sealImessageEvent } from "@/lib/imessage/security";
import { imessageEventWorkflow } from "@/workflows/imessage-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const schema = z.object({
  eventId: z.string().uuid(),
  sealedEvent: z.string().min(64).max(64 * 1024),
  message: z.string().trim().min(1).max(500),
}).strict();

function authorized(request: Request): boolean {
  const expected = process.env.IMESSAGE_PROVIDER_CANARY_SECRET;
  const supplied = request.headers.get("x-imessage-canary-token");
  if (!expected || expected.length < 32 || !supplied) return false;
  const digest = (value: string) => createHash("sha256").update(value).digest();
  return timingSafeEqual(digest(expected), digest(supplied));
}

export async function POST(request: Request) {
  if (process.env.IMESSAGE_ENABLED !== "true" || process.env.IMESSAGE_PROVIDER_CANARY_ENABLED !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if (!authorized(request)) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 70 * 1024) return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid envelope" }, { status: 400 });

  try {
    const source = openImessageEvent(parsed.data.sealedEvent);
    if (source.event_id !== parsed.data.eventId) {
      return NextResponse.json({ error: "Envelope identity mismatch" }, { status: 400 });
    }
    const canaryChatId = process.env.IMESSAGE_PROVIDER_CANARY_CHAT_ID?.trim();
    if (!canaryChatId || source.data.chat.id !== canaryChatId) {
      return NextResponse.json({ error: "Canary binding mismatch" }, { status: 403 });
    }
    const eventId = randomUUID();
    const event = {
      ...source,
      event_id: eventId,
      created_at: new Date().toISOString(),
      trace_id: `provider-canary-${randomUUID()}`,
      data: {
        ...source.data,
        id: randomUUID(),
        parts: [{ type: "text" as const, value: parsed.data.message }],
      },
    };
    const run = await start(imessageEventWorkflow, [{ eventId, sealedEvent: sealImessageEvent(event) }]);
    return NextResponse.json({ accepted: true, eventId, runId: run.runId }, { status: 202 });
  } catch {
    return NextResponse.json({ error: "Unable to start canary" }, { status: 503 });
  }
}
