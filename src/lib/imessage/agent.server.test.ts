import { afterEach, describe, expect, it } from "vitest";
import { agentServiceOrigin } from "./agent.server";

describe("Eve dispatch origin", () => {
  afterEach(() => {
    delete process.env.AGENT_SERVICE_ORIGIN;
    delete process.env.SAAS_APP_URL;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  it("uses the isolated production deployment instead of the canonical SaaS origin", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "channel.example.vercel.app";
    process.env.SAAS_APP_URL = "https://app.example.com";
    expect(agentServiceOrigin()).toBe("https://channel.example.vercel.app");
  });

  it("allows an explicit agent service origin", () => {
    process.env.AGENT_SERVICE_ORIGIN = "https://agent.example.com/";
    expect(agentServiceOrigin()).toBe("https://agent.example.com");
  });
});
