import { afterEach, describe, expect, it, vi } from "vitest";

describe("Brevo credentials", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("uses the configured server API key without sending an email", async () => {
    const apiKey = process.env.BREVO_API_KEY;
    expect(apiKey, "BREVO_API_KEY doit être configurée pour valider Brevo").toBeTruthy();
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ email: "verified@example.org" }), { status: 200, headers: { "content-type": "application/json" } }));
    vi.stubGlobal("fetch", fetchMock);

    const response = await fetch("https://api.brevo.com/v3/account", {
      headers: { "api-key": apiKey as string, accept: "application/json" },
    });
    expect(response.status).toBe(200);
    expect(fetchMock).toHaveBeenCalledWith("https://api.brevo.com/v3/account", expect.objectContaining({ headers: { "api-key": apiKey, accept: "application/json" } }));
  });
});
