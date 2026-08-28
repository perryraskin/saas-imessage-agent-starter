import { createCipheriv, createDecipheriv, createHash, createHmac, randomBytes, timingSafeEqual } from "node:crypto";
import { linqMessageReceivedEventSchema, type LinqMessageReceivedEvent } from "./contracts";

function requiredSecret(name: "AGENT_INTERNAL_SECRET" | "IMESSAGE_EVENT_SEALING_KEY"): string {
  const value = process.env[name]?.trim();
  if (!value || value.length < 32) throw new Error(`${name} must contain at least 32 characters.`);
  return value;
}

export function authorizedInternalRequest(request: Request): boolean {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return false;
  const supplied = Buffer.from(authorization.slice(7), "utf8");
  const expected = Buffer.from(requiredSecret("AGENT_INTERNAL_SECRET"), "utf8");
  return supplied.length === expected.length && timingSafeEqual(supplied, expected);
}

export function hashSenderHandle(handle: string): string {
  return createHmac("sha256", requiredSecret("IMESSAGE_EVENT_SEALING_KEY"))
    .update(`imessage-handle:v1:${handle.trim().toLowerCase()}`)
    .digest("hex");
}

function encryptionKey(): Buffer {
  return createHash("sha256")
    .update(`imessage-workflow:v1:${requiredSecret("IMESSAGE_EVENT_SEALING_KEY")}`)
    .digest();
}

export function sealImessageEvent(event: LinqMessageReceivedEvent): string {
  const nonce = randomBytes(12);
  const cipher = createCipheriv("aes-256-gcm", encryptionKey(), nonce);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(event), "utf8"), cipher.final()]);
  return [nonce, cipher.getAuthTag(), ciphertext].map((part) => part.toString("base64url")).join(".");
}

export function openImessageEvent(sealed: string): LinqMessageReceivedEvent {
  const parts = sealed.split(".");
  if (parts.length !== 3) throw new Error("Invalid iMessage workflow envelope.");
  const [nonce, tag, ciphertext] = parts.map((part) => Buffer.from(part, "base64url"));
  if (nonce.length !== 12 || tag.length !== 16 || ciphertext.length === 0) throw new Error("Invalid iMessage workflow envelope.");
  const decipher = createDecipheriv("aes-256-gcm", encryptionKey(), nonce);
  decipher.setAuthTag(tag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8");
  return linqMessageReceivedEventSchema.parse(JSON.parse(plaintext));
}
