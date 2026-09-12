import { Grid2X2, List } from "lucide-react";
import { Button } from "@/components/ui/button";

export type ViewMode = "list" | "grid";

type ViewModeToggleProps = {
  value: ViewMode;
  onChange: (value: ViewMode) => void;
  label?: string;
};

export function ViewModeToggle({ value, onChange, label = "Affichage" }: ViewModeToggleProps) {
  return (
    <div className="inline-flex items-center gap-1 rounded-lg border bg-background p-1" aria-label={label} role="group">
      <Button type="button" size="sm" variant={value === "list" ? "default" : "ghost"} className="gap-2" aria-pressed={value === "list"} onClick={() => onChange("list")}>
        <List className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Liste</span>
      </Button>
      <Button type="button" size="sm" variant={value === "grid" ? "default" : "ghost"} className="gap-2" aria-pressed={value === "grid"} onClick={() => onChange("grid")}>
        <Grid2X2 className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only sm:not-sr-only">Damier</span>
      </Button>
    </div>
  );
}
