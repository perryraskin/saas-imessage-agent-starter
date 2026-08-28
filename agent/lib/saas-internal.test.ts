import { afterEach, describe, expect, it } from "vitest";
import { channelDeliveryOrigin, saasInternalOrigin } from "./saas-internal";

describe("split deployment origins", () => {
  afterEach(() => {
    delete process.env.SAAS_INTERNAL_API_ORIGIN;
    delete process.env.SAAS_APP_URL;
    delete process.env.CHANNEL_DELIVERY_ORIGIN;
    delete process.env.VERCEL_ENV;
    delete process.env.VERCEL_URL;
  });

  it("keeps production SaaS tools on the canonical product origin", () => {
    process.env.VERCEL_ENV = "production";
    process.env.SAAS_INTERNAL_API_ORIGIN = "https://app.example.com/";
    expect(saasInternalOrigin()).toBe("https://app.example.com");
  });

  it("requires the connector-owning delivery origin in deployed Eve", () => {
    process.env.VERCEL_ENV = "production";
    process.env.SAAS_INTERNAL_API_ORIGIN = "https://app.example.com";
    expect(() => channelDeliveryOrigin()).toThrow("CHANNEL_DELIVERY_ORIGIN is required");
  });

  it("routes provider delivery to the explicit channel adapter", () => {
    process.env.CHANNEL_DELIVERY_ORIGIN = "https://channel.example.com/";
    expect(channelDeliveryOrigin()).toBe("https://channel.example.com");
  });

  it("fails closed when a split production tool origin is missing", () => {
    process.env.VERCEL_ENV = "production";
    expect(() => saasInternalOrigin()).toThrow("SAAS_INTERNAL_API_ORIGIN or SAAS_APP_URL");
  });
});
