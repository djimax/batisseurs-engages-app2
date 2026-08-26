import { describe, expect, it } from "vitest";

describe("Brevo credentials", () => {
  it("accepts the server API key without sending an email", async () => {
    const apiKey = process.env.BREVO_API_KEY;
    expect(apiKey, "BREVO_API_KEY doit être configurée pour valider Brevo").toBeTruthy();

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 5000);
    try {
      const response = await fetch("https://api.brevo.com/v3/account", {
        headers: { "api-key": apiKey as string, accept: "application/json" },
        signal: controller.signal,
      });
      expect(response.status).toBe(200);
    } finally {
      clearTimeout(timeout);
    }
  }, 10000);
});
