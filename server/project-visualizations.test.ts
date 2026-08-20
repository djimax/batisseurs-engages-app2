import { describe, expect, it } from "vitest";
import { buildProjectTimeline, createTimelineTicks, summarizeBudget } from "../client/src/lib/projectVisualizations";

describe("project visualizations", () => {
  it("builds a dated timeline from project bounds and due dates", () => {
    const timeline = buildProjectTimeline({
      projectStartDate: "2026-01-01T00:00:00.000Z",
      projectEndDate: "2026-04-01T00:00:00.000Z",
      tasks: [
        { id: 1, title: "Préparer", status: "completed", dueDate: "2026-02-01T00:00:00.000Z" },
        { id: 2, title: "Sans date", status: "todo" },
      ],
      milestones: [
        { id: 3, title: "Lancement", status: "pending", dueDate: "2026-03-01T00:00:00.000Z" },
      ],
    });

    expect(timeline.durationDays).toBe(90);
    expect(timeline.items).toHaveLength(3);
    expect(timeline.items[0]).toMatchObject({ id: "task-1", position: 34 });
    expect(timeline.items[1]).toMatchObject({ id: "milestone-3", position: 66 });
    expect(timeline.items[2]).toMatchObject({ id: "task-2", position: null });
  });

  it("infers a safe 30-day window when only a due date is available", () => {
    const timeline = buildProjectTimeline({
      milestones: [{ id: 10, title: "Jalon", dueDate: "2026-06-15T00:00:00.000Z" }],
    });

    expect(timeline.start?.toISOString()).toBe("2026-06-15T00:00:00.000Z");
    expect(timeline.durationDays).toBe(30);
    expect(timeline.items[0].position).toBe(0);
  });

  it("summarizes budget items and clamps utilization for presentation", () => {
    const summary = summarizeBudget([
      { id: 1, category: "Transport", amount: "1000", spent: "250" },
      { id: 2, category: "Matériel", amount: "500", spent: "650" },
    ]);

    expect(summary.planned).toBe(1500);
    expect(summary.spent).toBe(900);
    expect(summary.remaining).toBe(600);
    expect(summary.utilizationPercent).toBe(60);
    expect(summary.items[1].spentPercent).toBe(100);
  });

  it("uses report totals when there are no budget categories", () => {
    const summary = summarizeBudget([], { planned: 2000, spent: 500 });

    expect(summary.items).toEqual([
      expect.objectContaining({ label: "Budget global", planned: 2000, spent: 500, spentPercent: 25 }),
    ]);
    expect(summary.remaining).toBe(1500);
  });

  it("creates evenly spaced timeline ticks", () => {
    const ticks = createTimelineTicks(
      new Date("2026-01-01T00:00:00.000Z"),
      new Date("2026-04-01T00:00:00.000Z"),
      4,
    );

    expect(ticks.map((tick) => tick.position)).toEqual([0, 33.33333333333333, 66.66666666666666, 100]);
  });
});
