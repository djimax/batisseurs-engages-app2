import { TRPCError } from "@trpc/server";

const BREVO_ENDPOINT = "https://api.brevo.com/v3/smtp/email";
const DEFAULT_SENDER_EMAIL = "contact.lesbatisseursengages@gmail.com";

export type TransactionalEmailInput = {
  to: { email: string; name?: string };
  subject: string;
  textContent: string;
  htmlContent?: string;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>\"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;",
  })[character] ?? character);
}

export function textToHtml(text: string) {
  return escapeHtml(text).replace(/\r?\n/g, "<br>");
}

export async function sendTransactionalEmail(input: TransactionalEmailInput) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Brevo n’est pas configuré" });
  if (!input.to.email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(input.to.email)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Adresse e-mail destinataire invalide" });
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);
  try {
    const response = await fetch(BREVO_ENDPOINT, {
      method: "POST",
      headers: { "api-key": apiKey, "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({
        sender: {
          email: process.env.BREVO_SENDER_EMAIL || DEFAULT_SENDER_EMAIL,
          name: process.env.BREVO_SENDER_NAME || "Les Bâtisseurs Engagés",
        },
        to: [input.to],
        subject: input.subject.trim().slice(0, 255),
        textContent: input.textContent,
        htmlContent: input.htmlContent ?? textToHtml(input.textContent),
      }),
      signal: controller.signal,
    });
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      console.error("Brevo rejected transactional email", { status: response.status, detail: detail.slice(0, 500) });
      throw new TRPCError({ code: "BAD_GATEWAY", message: "Brevo a refusé l’envoi de l’e-mail" });
    }
    const payload = await response.json() as { messageId?: string };
    return { messageId: payload.messageId ?? null };
  } catch (error) {
    if (error instanceof TRPCError) throw error;
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Le service Brevo est momentanément indisponible" });
  } finally {
    clearTimeout(timeout);
  }
}
