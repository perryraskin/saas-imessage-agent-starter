import { IMESSAGE_MAX_REPLY_CHARACTERS } from "./contracts";

function captureUrl(urls: string[], candidate: string): string {
  const url = candidate.replace(/[.,!?;:}\]]+$/u, "");
  if (url && !urls.includes(url)) urls.push(url);
  return candidate.slice(url.length);
}

function splitPlainText(text: string): string[] {
  const messages: string[] = [];
  let remaining = text.trim();
  while (remaining.length > IMESSAGE_MAX_REPLY_CHARACTERS) {
    const window = remaining.slice(0, IMESSAGE_MAX_REPLY_CHARACTERS + 1);
    const boundary = Math.max(
      window.lastIndexOf("\n\n"),
      window.lastIndexOf("\n"),
      window.lastIndexOf(". ") + 1,
      window.lastIndexOf("? ") + 1,
      window.lastIndexOf("! ") + 1,
      window.lastIndexOf(" "),
    );
    const safeBoundary = boundary > 0 ? boundary : IMESSAGE_MAX_REPLY_CHARACTERS;
    messages.push(remaining.slice(0, safeBoundary).trim());
    remaining = remaining.slice(safeBoundary).trim();
  }
  if (remaining) messages.push(remaining);
  return messages;
}

/** Turn model-oriented text into native-feeling iMessage bubbles. */
export function renderImessageMessages(source: string): string[] {
  const urls: string[] = [];
  let text = source.replace(/!?\[([^\]\n]+)\]\((https?:\/\/[^\s)]+)\)/giu, (_match, label: string, url: string) => {
    captureUrl(urls, url);
    return label;
  });
  text = text.replace(/https?:\/\/[^\s<>]+/giu, (candidate) => captureUrl(urls, candidate));
  text = text
    .replace(/^[ \t]*```[^\n]*$/gmu, "")
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gmu, "")
    .replace(/^[ \t]*>[ \t]?/gmu, "")
    .replace(/^[ \t]*[-*+][ \t]+/gmu, "• ")
    .replace(/\*\*([^*\n]+)\*\*/gu, "$1")
    .replace(/__([^_\n]+)__/gu, "$1")
    .replace(/~~([^~\n]+)~~/gu, "$1")
    .replace(/`([^`\n]+)`/gu, "$1")
    .replace(/(^|[\s(])\*([^*\n]+)\*(?=$|[\s).,!?])/gu, "$1$2")
    .replace(/(^|[\s(])_([^_\n]+)_(?=$|[\s).,!?])/gu, "$1$2")
    .replace(/\s+([.,!?;:])/gu, "$1")
    .replace(/\n{3,}/gu, "\n\n")
    .trim();
  return [...splitPlainText(text), ...urls];
}
