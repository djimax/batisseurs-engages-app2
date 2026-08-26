import { describe, expect, it } from "vitest";
import { summarizeEmailCampaigns } from "./db";

describe("email campaign statistics", () => {
  it("aggregates campaign and recipient outcomes", () => {
    expect(summarizeEmailCampaigns([
      { status: "sent", recipientCount: 10, successCount: 9, failureCount: 1 },
      { status: "failed", recipientCount: 4, successCount: 0, failureCount: 4 },
      { status: "sending", recipientCount: 2, successCount: null, failureCount: null },
    ])).toEqual({
      totalCampaigns: 3,
      sentCampaigns: 1,
      failedCampaigns: 1,
      activeCampaigns: 1,
      totalRecipients: 16,
      successfulRecipients: 9,
      failedRecipients: 5,
      deliveryRate: 56.3,
    });
  });

  it("returns a zero rate when no recipients exist", () => {
    expect(summarizeEmailCampaigns([]).deliveryRate).toBe(0);
  });
});
