import { describe, expect, it } from "vitest";
import { calculateCampaignProgress } from "./campaigns-router";
import { readFileSync } from "node:fs";

const campaignsPageSource = readFileSync(new URL("../client/src/pages/Campaigns.tsx", import.meta.url), "utf8");

describe("campaign permissions", () => {
  it("protects campaign reads with finances.view", () => {
    const routerSource = readFileSync(new URL("./campaigns-router.ts", import.meta.url), "utf8");
    expect(routerSource).toContain("list: protectedProcedure");
    expect(routerSource).toContain('assertPermission(ctx.user, "finances.view")');
  });
});

describe("campaign progress", () => {
  it("calculates a bounded percentage from real amounts", () => {
    expect(calculateCampaignProgress("5000", "3200")).toBe(64);
    expect(calculateCampaignProgress("2000", "2400")).toBe(100);
    expect(calculateCampaignProgress("0", "100")).toBe(0);
    expect(calculateCampaignProgress("invalid", "100")).toBe(0);
  });

  it("renders an accessible progress bar and real campaign data", () => {
    expect(campaignsPageSource).toContain("trpc.campaigns.list.useQuery()");
    expect(campaignsPageSource).toContain('role="progressbar"');
    expect(campaignsPageSource).toContain("aria-valuenow={campaign.progress}");
    expect(campaignsPageSource).toContain("Objectif atteint");
    expect(campaignsPageSource).toContain("Objectif non renseigné");
    expect(campaignsPageSource).not.toContain("Campagne de Financement 2025");
  });
});
