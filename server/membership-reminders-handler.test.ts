import { readFileSync } from "node:fs";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  authenticateRequest: vi.fn(),
  getDb: vi.fn(),
}));

vi.mock("./_core/sdk", () => ({ sdk: { authenticateRequest: mocks.authenticateRequest } }));
vi.mock("./db", () => ({ getDb: mocks.getDb }));

const { authenticateRequest, getDb } = mocks;

import { membershipRemindersHandler } from "./membership-reminders-handler";

function responseMock() {
  const response = {
    status: vi.fn(),
    json: vi.fn(),
  } as any;
  response.status.mockReturnValue(response);
  response.json.mockReturnValue(response);
  return response;
}

describe("membershipRemindersHandler", () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it("branche les rappels créés sur Brevo sans ignorer la préférence e-mail", () => {
    const source = readFileSync(new URL("./membership-reminders-handler.ts", import.meta.url), "utf8");
    expect(source).toContain("sendTransactionalEmail");
    expect(source).toContain("emailEnabled === 0");
    expect(source).toContain("generateMembershipReminderNotifications(new Date(), async");
    expect(source).toContain("Rappel Brevo envoyé");
  });

  it("refuse les appels qui ne proviennent pas d’un cron authentifié", async () => {
    authenticateRequest.mockResolvedValue({ isCron: false, taskUid: undefined });
    const response = responseMock();
    await membershipRemindersHandler({ originalUrl: "/api/scheduled/membership-reminders" } as any, response);
    expect(response.status).toHaveBeenCalledWith(403);
    expect(response.json).toHaveBeenCalledWith({ error: "cron-only" });
  });

  it("retourne un succès idempotent si la tâche n’existe plus en base", async () => {
    authenticateRequest.mockResolvedValue({ isCron: true, taskUid: "task-orphan" });
    getDb.mockResolvedValue({
      select: () => ({
        from: () => ({
          where: () => ({ limit: async () => [] }),
        }),
      }),
    });
    const response = responseMock();
    await membershipRemindersHandler({ originalUrl: "/api/scheduled/membership-reminders" } as any, response);
    expect(response.json).toHaveBeenCalledWith({ ok: true, skipped: "orphan" });
  });

  it("retourne une erreur structurée en cas d’échec serveur", async () => {
    authenticateRequest.mockRejectedValue(new Error("auth failed"));
    const response = responseMock();
    await membershipRemindersHandler({ originalUrl: "/api/scheduled/membership-reminders" } as any, response);
    expect(response.status).toHaveBeenCalledWith(500);
    expect(response.json.mock.calls[0][0]).toMatchObject({ error: "auth failed" });
  });
});
