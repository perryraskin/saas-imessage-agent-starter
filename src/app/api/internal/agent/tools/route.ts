import { NextResponse } from "next/server";
import { z } from "zod";
import { executeSaasTool, SAAS_TOOL_NAMES } from "@/lib/agent/saas-adapter";
import { authorizedInternalRequest } from "@/lib/imessage/security";
import { captureMcpToolCall } from "@/lib/posthog/mcp-analytics.server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const requestSchema = z.object({
  userId: z.string().trim().min(1).max(128),
  tool: z.enum(SAAS_TOOL_NAMES),
  input: z.unknown(),
  idempotencyKey: z.string().trim().min(1).max(255),
  channel: z.enum(["imessage", "web"]),
  telemetry: z.object({ conversationId: z.string().max(256).optional(), testAccount: z.boolean().optional() }).optional(),
}).strict();

export async function POST(request: Request) {
  try {
    if (!authorizedInternalRequest(request)) return NextResponse.json({ ok: false, error: "unauthorized" }, { status: 401 });
  } catch {
    return NextResponse.json({ ok: false, error: "unavailable" }, { status: 503 });
  }
  const parsed = requestSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: "invalid_request" }, { status: 400 });

  const startedAt = Date.now();
  let result: Record<string, unknown>;
  try {
    result = await executeSaasTool({
      actorId: parsed.data.userId,
      tool: parsed.data.tool,
      input: parsed.data.input,
      idempotencyKey: parsed.data.idempotencyKey,
      channel: parsed.data.channel,
    });
  } catch {
    result = { ok: false, error: "tool_unavailable" };
  }
  await captureMcpToolCall({
    userId: parsed.data.userId,
    tool: parsed.data.tool,
    toolInput: parsed.data.input,
    result,
    durationMs: Date.now() - startedAt,
    conversationId: parsed.data.telemetry?.conversationId,
    testAccount: parsed.data.telemetry?.testAccount,
  });
  return NextResponse.json(result, { status: result.ok === true ? 200 : 422 });
}
