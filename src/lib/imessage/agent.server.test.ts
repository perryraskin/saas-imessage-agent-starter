import { afterEach, describe, expect, it } from "vitest";
import { agentServiceOrigin } from "./agent.server";

describe("Eve dispatch origin", () => {
  afterEach(() => {
    delete process.env.AGENT_SERVICE_ORIGIN;
    delete process.env.VERCEL_ENV;
  });

  it("fails closed when a deployed channel adapter has no standalone agent origin", () => {
    process.env.VERCEL_ENV = "production";
    expect(() => agentServiceOrigin()).toThrow("AGENT_SERVICE_ORIGIN is required");
  });

  it("allows an explicit agent service origin", () => {
    process.env.AGENT_SERVICE_ORIGIN = "https://agent.example.com/";
    expect(agentServiceOrigin()).toBe("https://agent.example.com");
  });
});
