import { afterEach, describe, expect, it } from "vitest";
import { channelDeliveryOrigin, saasInternalOrigin } from "./saas-internal";

describe("split deployment origins", () => {
  afterEach(() => {
    delete process.env.SAAS_INTERNAL_API_ORIGIN;
    delete process.env.SAAS_APP_URL;
    delete process.env.CHANNEL_DELIVERY_ORIGIN;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_PROJECT_PRODUCTION_URL;
    delete process.env.VERCEL_URL;
  });

  it("keeps production SaaS tools on the canonical product origin", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "channel.example.vercel.app";
    process.env.SAAS_INTERNAL_API_ORIGIN = "https://app.example.com/";
    expect(saasInternalOrigin()).toBe("https://app.example.com");
  });

  it("routes provider delivery back to the isolated channel deployment", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "channel.example.vercel.app";
    process.env.SAAS_INTERNAL_API_ORIGIN = "https://app.example.com";
    expect(channelDeliveryOrigin()).toBe("https://channel.example.vercel.app");
  });

  it("fails closed when a split production tool origin is missing", () => {
    process.env.VERCEL_ENV = "production";
    process.env.VERCEL_PROJECT_PRODUCTION_URL = "channel.example.vercel.app";
    expect(() => saasInternalOrigin()).toThrow("SAAS_INTERNAL_API_ORIGIN or SAAS_APP_URL");
  });
});
