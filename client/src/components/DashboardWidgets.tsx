import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  Users,
  FileText,
  DollarSign,
  Briefcase,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  Clock,
  X,
  GripVertical,
} from "lucide-react";
import { Button } from "@/components/ui/button";

export interface Widget {
  id: string;
  title: string;
  type: "statistic" | "list" | "chart";
  visible: boolean;
  position: number;
}

interface StatisticWidgetProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  trend?: number;
  color?: string;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function StatisticWidget({
  title,
  value,
  icon,
  trend,
  color = "bg-primary",
  onRemove,
  isDragging,
}: StatisticWidgetProps) {
  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className="flex items-center gap-2">
          {onRemove && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onRemove}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
          <div className={`p-2 rounded-lg ${color}`}>
            {icon}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{value}</div>
        {trend !== undefined && (
          <p className={`text-xs mt-2 ${trend > 0 ? "text-green-600" : "text-red-600"}`}>
            <TrendingUp className="inline h-3 w-3 mr-1" />
            {trend > 0 ? "+" : ""}{trend}% vs dernier mois
          </p>
        )}
      </CardContent>
    </Card>
  );
}

interface ListWidgetProps {
  title: string;
  description?: string;
  items: Array<{
    id: string | number;
    label: string;
    status?: "completed" | "pending" | "overdue";
    dueDate?: string;
  }>;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function ListWidget({
  title,
  description,
  items,
  onRemove,
  isDragging,
}: ListWidgetProps) {
  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucun élément</p>
          ) : (
            items.slice(0, 5).map((item) => (
              <div key={item.id} className="flex items-center justify-between text-sm">
                <span className="flex-1">{item.label}</span>
                <div className="flex items-center gap-2">
                  {item.status && (
                    <Badge
                      variant={
                        item.status === "completed"
                          ? "default"
                          : item.status === "overdue"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-xs"
                    >
                      {item.status === "completed"
                        ? "Complété"
                        : item.status === "overdue"
                        ? "En retard"
                        : "En attente"}
                    </Badge>
                  )}
                  {item.dueDate && (
                    <span className="text-xs text-muted-foreground">
                      {item.dueDate}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface ProgressWidgetProps {
  title: string;
  description?: string;
  completed: number;
  total: number;
  color?: string;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function ProgressWidget({
  title,
  description,
  completed,
  total,
  color = "bg-blue-500",
  onRemove,
  isDragging,
}: ProgressWidgetProps) {
  const percentage = total > 0 ? (completed / total) * 100 : 0;

  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {description && <CardDescription>{description}</CardDescription>}
        </div>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">
              {completed}/{total}
            </span>
            <span className="text-sm text-muted-foreground">
              {Math.round(percentage)}%
            </span>
          </div>
          <div className="w-full bg-secondary rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all ${color}`}
              style={{ width: `${percentage}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

interface SummaryWidgetProps {
  title: string;
  stats: Array<{
    label: string;
    value: number | string;
    icon?: React.ReactNode;
  }>;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function SummaryWidget({
  title,
  stats,
  onRemove,
  isDragging,
}: SummaryWidgetProps) {
  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {onRemove && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onRemove}
            className="h-6 w-6 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-4">
          {stats.map((stat, index) => (
            <div key={index} className="space-y-1">
              <p className="text-xs text-muted-foreground">{stat.label}</p>
              <p className="text-lg font-bold flex items-center gap-2">
                {stat.icon}
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export const AVAILABLE_WIDGETS = [
  {
    id: "documents-stat",
    title: "Documents",
    icon: <FileText className="h-4 w-4" />,
    type: "statistic" as const,
  },
  {
    id: "members-stat",
    title: "Membres",
    icon: <Users className="h-4 w-4" />,
    type: "statistic" as const,
  },
  {
    id: "projects-stat",
    title: "Projets",
    icon: <Briefcase className="h-4 w-4" />,
    type: "statistic" as const,
  },
  {
    id: "finance-stat",
    title: "Finance",
    icon: <DollarSign className="h-4 w-4" />,
    type: "statistic" as const,
  },
  {
    id: "recent-documents",
    title: "Documents Récents",
    type: "list" as const,
  },
  {
    id: "urgent-tasks",
    title: "Tâches Urgentes",
    type: "list" as const,
  },
  {
    id: "active-projects",
    title: "Projets Actifs",
    type: "list" as const,
  },
  {
    id: "projects-progress",
    title: "Progression des Projets",
    type: "chart" as const,
  },
  {
    id: "tasks-summary",
    title: "Résumé des Tâches",
    type: "chart" as const,
  },
  {
    id: "finance-summary",
    title: "Résumé Financier",
    type: "chart" as const,
  },
];
