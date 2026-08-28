import { NextResponse } from "next/server";
import { start } from "workflow/api";
import { eventIsFresh, IMESSAGE_MAX_EVENT_BYTES, linqMessageReceivedEventSchema } from "@/lib/imessage/contracts";
import { linqWebhookVerifier } from "@/lib/imessage/provider.server";
import { sealImessageEvent } from "@/lib/imessage/security";
import { imessageEventWorkflow } from "@/workflows/imessage-event";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function readBoundedBody(request: Request): Promise<Uint8Array> {
  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > IMESSAGE_MAX_EVENT_BYTES) throw new RangeError("payload_too_large");
  const body = new Uint8Array(await request.arrayBuffer());
  if (body.byteLength > IMESSAGE_MAX_EVENT_BYTES) throw new RangeError("payload_too_large");
  return body;
}

export async function POST(request: Request) {
  if (process.env.IMESSAGE_ENABLED !== "true") return NextResponse.json({ error: "Not found" }, { status: 404 });
  try {
    await linqWebhookVerifier()(request, new Uint8Array());
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let rawBody: Uint8Array;
  try {
    rawBody = await readBoundedBody(request);
  } catch (error) {
    return NextResponse.json({ error: error instanceof RangeError ? "Payload too large" : "Invalid payload" }, { status: error instanceof RangeError ? 413 : 400 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(new TextDecoder().decode(rawBody));
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const parsed = linqMessageReceivedEventSchema.safeParse(payload);
  if (!parsed.success) return NextResponse.json({ error: "Invalid event" }, { status: 400 });
  if (parsed.data.partner_id !== process.env.IMESSAGE_LINQ_PARTNER_ID) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (!eventIsFresh(parsed.data)) return NextResponse.json({ error: "Stale event" }, { status: 409 });

  const run = await start(imessageEventWorkflow, [{ eventId: parsed.data.event_id, sealedEvent: sealImessageEvent(parsed.data) }]);
  return NextResponse.json({ accepted: true, runId: run.runId }, { status: 202 });
}
