import { claimInboundEvent } from "../lib/agent/saas-adapter";
import { openImessageEvent } from "../lib/imessage/security";
import { processImessageEvent } from "../lib/imessage/process.server";

export type ImessageWorkflowEnvelope = {
  eventId: string;
  sealedEvent: string;
};

async function claim(envelope: ImessageWorkflowEnvelope) {
  "use step";
  return claimInboundEvent(envelope.eventId);
}

async function process(envelope: ImessageWorkflowEnvelope) {
  "use step";
  const event = openImessageEvent(envelope.sealedEvent);
  if (event.event_id !== envelope.eventId) throw new Error("Workflow envelope identity mismatch.");
  return processImessageEvent(event);
}

process.maxRetries = 4;

export async function imessageEventWorkflow(envelope: ImessageWorkflowEnvelope) {
  "use workflow";
  if (!(await claim(envelope))) return "duplicate";
  return process(envelope);
}
