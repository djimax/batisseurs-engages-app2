export type ProjectDateValue = string | Date | null | undefined;

export interface ProjectTimelineInput {
  projectStartDate?: ProjectDateValue;
  projectEndDate?: ProjectDateValue;
  tasks?: Array<{
    id: number;
    title: string;
    status?: string | null;
    dueDate?: ProjectDateValue;
  }>;
  milestones?: Array<{
    id: number;
    title: string;
    status?: string | null;
    dueDate?: ProjectDateValue;
  }>;
}

export interface ProjectTimelineItem {
  id: string;
  kind: "task" | "milestone";
  label: string;
  status: string;
  date: Date | null;
  position: number | null;
}

export interface ProjectTimeline {
  start: Date | null;
  end: Date | null;
  durationDays: number;
  items: ProjectTimelineItem[];
}

export interface BudgetSummaryItem {
  id: number | string;
  label: string;
  planned: number;
  spent: number;
  remaining: number;
  spentPercent: number;
}

export interface BudgetSummary {
  planned: number;
  spent: number;
  remaining: number;
  utilizationPercent: number;
  items: BudgetSummaryItem[];
}

function toValidDate(value: ProjectDateValue): Date | null {
  if (!value) return null;
  const date = value instanceof Date ? new Date(value.getTime()) : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function clampPercent(value: number) {
  return Math.min(100, Math.max(0, Math.round(value)));
}

function getPosition(date: Date | null, start: Date, end: Date) {
  if (!date) return null;
  const range = end.getTime() - start.getTime();
  if (range <= 0) return 0;
  return clampPercent(((date.getTime() - start.getTime()) / range) * 100);
}

export function buildProjectTimeline(input: ProjectTimelineInput): ProjectTimeline {
  const projectStart = toValidDate(input.projectStartDate);
  const projectEnd = toValidDate(input.projectEndDate);
  const datedValues = [
    ...(input.tasks ?? []).map((item) => toValidDate(item.dueDate)),
    ...(input.milestones ?? []).map((item) => toValidDate(item.dueDate)),
  ].filter((date): date is Date => Boolean(date));

  const start = projectStart ?? datedValues.reduce<Date | null>(
    (earliest, date) => (!earliest || date < earliest ? date : earliest),
    null,
  );
  const latestDate = datedValues.reduce<Date | null>(
    (latest, date) => (!latest || date > latest ? date : latest),
    null,
  );
  const inferredEnd = latestDate && start && latestDate > start
    ? latestDate
    : start
      ? new Date(start.getTime() + 30 * 24 * 60 * 60 * 1000)
      : null;
  const end = projectEnd ?? inferredEnd;

  if (!start || !end) {
    return { start: null, end: null, durationDays: 0, items: [] };
  }

  const normalizedEnd = end < start ? new Date(start.getTime() + 24 * 60 * 60 * 1000) : end;
  const durationDays = Math.max(1, Math.ceil((normalizedEnd.getTime() - start.getTime()) / (24 * 60 * 60 * 1000)));
  const items: ProjectTimelineItem[] = [
    ...(input.tasks ?? []).map((task) => {
      const date = toValidDate(task.dueDate);
      return {
        id: `task-${task.id}`,
        kind: "task" as const,
        label: task.title,
        status: task.status ?? "todo",
        date,
        position: getPosition(date, start, normalizedEnd),
      };
    }),
    ...(input.milestones ?? []).map((milestone) => {
      const date = toValidDate(milestone.dueDate);
      return {
        id: `milestone-${milestone.id}`,
        kind: "milestone" as const,
        label: milestone.title,
        status: milestone.status ?? "pending",
        date,
        position: getPosition(date, start, normalizedEnd),
      };
    }),
  ].sort((left, right) => (left.date?.getTime() ?? Number.MAX_SAFE_INTEGER) - (right.date?.getTime() ?? Number.MAX_SAFE_INTEGER));

  return { start, end: normalizedEnd, durationDays, items };
}

export function summarizeBudget(
  items: Array<{ id: number | string; category: string; amount?: string | number | null; spent?: string | number | null }>,
  fallback?: { planned?: number; spent?: number; remaining?: number },
): BudgetSummary {
  const normalizedItems = items
    .map((item) => {
      const planned = Number(item.amount ?? 0) || 0;
      const spent = Number(item.spent ?? 0) || 0;
      return {
        id: item.id,
        label: item.category,
        planned,
        spent,
        remaining: planned - spent,
        spentPercent: planned > 0 ? clampPercent((spent / planned) * 100) : 0,
      };
    })
    .filter((item) => item.planned > 0 || item.spent > 0);

  const planned = normalizedItems.reduce((sum, item) => sum + item.planned, 0) || Number(fallback?.planned ?? 0) || 0;
  const spent = normalizedItems.reduce((sum, item) => sum + item.spent, 0) || Number(fallback?.spent ?? 0) || 0;
  const remaining = planned - spent;
  const fallbackItem = normalizedItems.length === 0 && planned > 0
    ? [{
      id: "global-budget",
      label: "Budget global",
      planned,
      spent,
      remaining,
      spentPercent: planned > 0 ? clampPercent((spent / planned) * 100) : 0,
    }]
    : normalizedItems;

  return {
    planned,
    spent,
    remaining,
    utilizationPercent: planned > 0 ? clampPercent((spent / planned) * 100) : 0,
    items: fallbackItem,
  };
}

export function createTimelineTicks(start: Date | null, end: Date | null, count = 4) {
  if (!start || !end || count < 2) return [];
  const ticks = [];
  const range = end.getTime() - start.getTime();
  for (let index = 0; index < count; index += 1) {
    const position = (index / (count - 1)) * 100;
    ticks.push({
      position,
      date: new Date(start.getTime() + (range * index) / (count - 1)),
    });
  }
  return ticks;
}
