import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";

interface LoadingStateProps {
  label?: string;
  className?: string;
  variant?: "page" | "inline" | "cards";
  rows?: number;
}

export function LoadingState({
  label = "Chargement en cours…",
  className,
  variant = "page",
  rows = 3,
}: LoadingStateProps) {
  if (variant === "inline") {
    return (
      <span className={cn("inline-flex items-center gap-2 text-sm text-muted-foreground", className)} role="status" aria-live="polite">
        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
        {label}
      </span>
    );
  }

  if (variant === "cards") {
    return (
      <div className={cn("grid gap-4 md:grid-cols-2 lg:grid-cols-3", className)} role="status" aria-label={label}>
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="rounded-xl border bg-card p-5 shadow-sm animate-pulse">
            <div className="flex items-start justify-between gap-3">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="mt-3 h-4 w-1/2" />
            <Skeleton className="mt-6 h-4 w-full" />
            <Skeleton className="mt-2 h-4 w-4/5" />
            <div className="mt-6 flex gap-2">
              <Skeleton className="h-9 flex-1" />
              <Skeleton className="h-9 w-9" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex min-h-[18rem] flex-col items-center justify-center gap-4 rounded-xl border border-dashed bg-muted/20 p-8", className)} role="status" aria-live="polite">
      <div className="rounded-full bg-primary/10 p-3">
        <Loader2 className="h-7 w-7 animate-spin text-primary" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
    </div>
  );
}

export function LoadingButtonContent({ loading, loadingLabel, children }: {
  loading: boolean;
  loadingLabel: string;
  children: React.ReactNode;
}) {
  return loading ? <LoadingState variant="inline" label={loadingLabel} className="text-current" /> : children;
}
