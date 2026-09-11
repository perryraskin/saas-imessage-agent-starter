import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("iMessage workflow bundle boundary", () => {
  it("uses relative imports that the workflow bundler can resolve", async () => {
    const source = await readFile(new URL("./imessage-event.ts", import.meta.url), "utf8");

    expect(source).not.toMatch(/from\s+["']@\//);
  });
});
