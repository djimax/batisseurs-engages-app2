import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, X } from "lucide-react";
import { MEMBER_GRADE_LEVELS } from "../../../shared/memberProgression";

interface MemberGradesChartWidgetProps {
  gradesBreakdown?: Record<string, number>;
  onRemove?: () => void;
  isDragging?: boolean;
}

export function MemberGradesChartWidget({
  gradesBreakdown = {},
  onRemove,
  isDragging,
}: MemberGradesChartWidgetProps) {
  const totalEvaluated = Object.values(gradesBreakdown).reduce((a, b) => a + b, 0);

  return (
    <Card className={`relative ${isDragging ? "opacity-50" : ""}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0">
        <div>
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <Award className="h-4 w-4 text-primary" />
            Répartition des membres par grade
          </CardTitle>
          <CardDescription>Évolution et responsabilités des adhérents</CardDescription>
        </div>
        {onRemove && (
          <Button variant="ghost" size="sm" onClick={onRemove} className="h-6 w-6 p-0">
            <X className="h-4 w-4" />
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {totalEvaluated === 0 ? (
          <div className="py-6 text-center">
            <p className="text-sm text-muted-foreground mb-2">Aucune évaluation de grade enregistrée pour le moment.</p>
            <p className="text-xs text-muted-foreground">Utilisez l’action « Évaluer / promouvoir » dans l’annuaire des membres.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {MEMBER_GRADE_LEVELS.map((grade) => {
              const count = gradesBreakdown[grade.value] || 0;
              const percentage = totalEvaluated > 0 ? Math.round((count / totalEvaluated) * 100) : 0;
              return (
                <div key={grade.value} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-primary" />
                      {grade.label}
                    </span>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">{count} membre{count > 1 ? "s" : ""}</Badge>
                      <span className="text-xs text-muted-foreground w-10 text-right">{percentage}%</span>
                    </div>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all duration-500"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
