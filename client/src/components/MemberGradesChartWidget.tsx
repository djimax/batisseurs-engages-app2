import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Award, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { MEMBER_GRADE_LEVELS } from "../../../shared/memberProgression";

interface MemberGradesChartWidgetProps {
  gradesBreakdown?: Record<string, number>;
  onRemove?: () => void;
  onSelectGrade?: (grade: string) => void;
  isDragging?: boolean;
}

export function MemberGradesChartWidget({
  gradesBreakdown = {},
  onRemove,
  onSelectGrade,
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
                <Tooltip key={grade.value}>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      onClick={() => onSelectGrade?.(grade.value)}
                      aria-label={`${grade.label} : seuil minimal ${grade.minimumScore} sur 100. Cliquer pour filtrer les membres.`}
                      className="block w-full space-y-1.5 rounded-md text-left outline-none transition-colors hover:bg-primary/5 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    >
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
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs space-y-1">
                    <p className="font-semibold">{grade.label} · minimum {grade.minimumScore}/100</p>
                    <p>{grade.responsibilities}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
