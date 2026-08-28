import { NextResponse } from "next/server";
import { z } from "zod";
import { renderImessageMessages } from "@/lib/imessage/render";

const schema = z.object({ text: z.string().max(10_000) }).strict();

export async function POST(request: Request) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "invalid_request" }, { status: 400 });
  return NextResponse.json({ messages: renderImessageMessages(parsed.data.text) });
}
