import { readFile } from "node:fs/promises";
import { describe, expect, it } from "vitest";

describe("private channel audience", () => {
  it.each(["imessage.ts", "eval.ts"])("classifies %s conversations as private", async (filename) => {
    const source = await readFile(new URL(`channels/${filename}`, import.meta.url), "utf8");

    expect(source).toMatch(/audience:\s*\(\)\s*=>\s*"private"/u);
    expect(source).not.toMatch(/metadata[^}]*audience/su);
  });
});
