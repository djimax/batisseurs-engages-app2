import { afterEach, describe, expect, it, vi } from "vitest";
import { sendTransactionalEmail, textToHtml } from "./brevo";

describe("Brevo transactional email client", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });

  it("escapes text before converting it to HTML", () => {
    expect(textToHtml("Bonjour <membre>\nMerci & à bientôt")).toBe("Bonjour &lt;membre&gt;<br>Merci &amp; à bientôt");
  });

  it("sends the expected Brevo payload without exposing the API key in the payload", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ messageId: "<brevo-id>" }), { status: 201 }));
    vi.stubGlobal("fetch", fetchMock);

    const result = await sendTransactionalEmail({
      to: { email: "member@example.com", name: "Membre Test" },
      subject: "Confirmation",
      textContent: "Votre inscription est confirmée.",
    });

    expect(result).toEqual({ messageId: "<brevo-id>" });
    expect(fetchMock).toHaveBeenCalledOnce();
    const [url, options] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.brevo.com/v3/smtp/email");
    expect(options.method).toBe("POST");
    expect((options.headers as Record<string, string>)["api-key"]).toBe("test-brevo-key");
    expect(JSON.parse(options.body as string)).toMatchObject({
      to: [{ email: "member@example.com", name: "Membre Test" }],
      subject: "Confirmation",
      textContent: "Votre inscription est confirmée.",
    });
    expect(options.body).not.toContain("test-brevo-key");
  });

  it("rejects a Brevo API error without leaking provider details", async () => {
    vi.stubEnv("BREVO_API_KEY", "test-brevo-key");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response("secret provider detail", { status: 401 })));

    await expect(sendTransactionalEmail({
      to: { email: "member@example.com" },
      subject: "Confirmation",
      textContent: "Contenu",
    })).rejects.toMatchObject({ code: "BAD_GATEWAY" });
  });
});
