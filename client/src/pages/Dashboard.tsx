import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts";
import {
  StatisticWidget,
  ListWidget,
  ProgressWidget,
  SummaryWidget,
  AVAILABLE_WIDGETS,
  Widget,
} from "@/components/DashboardWidgets";
import {
  FileText,
  Users,
  Briefcase,
  DollarSign,
  Settings,
  Plus,
  RotateCcw,
  CheckCircle2,
  CircleDashed,
  Megaphone,
  WalletCards,
  ArrowUpRight,
  Award,
  MailCheck,
  MailWarning,
  MailX,
  Clock3,
} from "lucide-react";
import { MemberGradesChartWidget } from "@/components/MemberGradesChartWidget";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { useLocation } from "wouter";

const DEFAULT_WIDGETS: Widget[] = [
  { id: "documents-stat", title: "Documents", type: "statistic", visible: true, position: 0 },
  { id: "members-stat", title: "Membres", type: "statistic", visible: true, position: 1 },
  { id: "projects-stat", title: "Projets", type: "statistic", visible: true, position: 2 },
  { id: "finance-stat", title: "Finance", type: "statistic", visible: true, position: 3 },
  { id: "member-grades-chart", title: "Répartition des grades", type: "chart", visible: true, position: 4 },
  { id: "recent-documents", title: "Documents Récents", type: "list", visible: true, position: 5 },
  { id: "urgent-tasks", title: "Tâches Urgentes", type: "list", visible: true, position: 6 },
  { id: "active-projects", title: "Projets Actifs", type: "list", visible: true, position: 7 },
];

const STORAGE_KEY = "dashboard-widgets-config";

import { Loader2 } from "lucide-react";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);
  const [transitioningGrade, setTransitioningGrade] = useState<string | null>(null);

  // Load widgets configuration from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        setWidgets(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to load dashboard config:", e);
      }
    }
  }, []);

  // Save widgets configuration to localStorage
  const saveWidgetsConfig = (newWidgets: Widget[]) => {
    setWidgets(newWidgets);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newWidgets));
  };

  // Fetch dashboard statistics
  const { data: statistics, isLoading: statsLoading } = trpc.dashboard.statistics.useQuery();
  const { data: projectsStats } = trpc.dashboard.projects.useQuery();
  const { data: tasksStats } = trpc.dashboard.tasks.useQuery();
  const { data: financeStats } = trpc.dashboard.finance.useQuery();
  const { data: membersStats } = trpc.dashboard.members.useQuery();
  const { data: globalSummary, isLoading: globalSummaryLoading } = trpc.dashboard.summary.useQuery();
  const { data: signatureDelivery, isLoading: signatureDeliveryLoading } = trpc.dashboard.signatureDelivery.useQuery();
  const globalFinanceChartConfig = {
    collected: { label: "Cotisations", color: "var(--chart-1)" },
    expenses: { label: "Dépenses", color: "var(--chart-2)" },
  };
  const globalFinanceChartData = globalSummary ? [
    { label: "Cotisations", collected: Number(globalSummary.finance.paidCotisations ?? 0), expenses: 0 },
    { label: "Dons", collected: Number(globalSummary.finance.totalDons ?? 0), expenses: 0 },
    { label: "Dépenses", collected: 0, expenses: Number(globalSummary.finance.totalDepenses ?? 0) },
  ] : [];

  const handleGradeSelect = (grade: string) => {
    setTransitioningGrade(grade);
    setTimeout(() => {
      setLocation(`/members?grade=${encodeURIComponent(grade)}`);
    }, 220);
  };

  const handleRemoveWidget = (widgetId: string) => {
    const updated = widgets.map((w) =>
      w.id === widgetId ? { ...w, visible: false } : w
    );
    saveWidgetsConfig(updated);
    toast.success("Widget supprimé");
  };

  const handleAddWidget = (widgetId: string) => {
    const updated = widgets.map((w) =>
      w.id === widgetId ? { ...w, visible: true } : w
    );
    saveWidgetsConfig(updated);
    toast.success("Widget ajouté");
  };

  const handleResetLayout = () => {
    saveWidgetsConfig(DEFAULT_WIDGETS);
    setIsEditMode(false);
    toast.success("Disposition réinitialisée");
  };

  const handleDragStart = (widgetId: string) => {
    setDraggedWidget(widgetId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetId: string) => {
    if (!draggedWidget || draggedWidget === targetId) {
      setDraggedWidget(null);
      return;
    }

    const draggedIndex = widgets.findIndex((w) => w.id === draggedWidget);
    const targetIndex = widgets.findIndex((w) => w.id === targetId);

    if (draggedIndex === -1 || targetIndex === -1) {
      setDraggedWidget(null);
      return;
    }

    const updated = [...widgets];
    const [draggedItem] = updated.splice(draggedIndex, 1);
    updated.splice(targetIndex, 0, draggedItem);

    // Update positions
    updated.forEach((w, i) => {
      w.position = i;
    });

    saveWidgetsConfig(updated);
    setDraggedWidget(null);
  };

  const visibleWidgets = widgets.filter((w) => w.visible).sort((a, b) => a.position - b.position);
  const hiddenWidgets = widgets.filter((w) => !w.visible);

  if (statsLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Tableau de Bord</h1>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="h-24 animate-pulse bg-muted" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {transitioningGrade && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm transition-all duration-200 animate-in fade-in-0">
          <div className="flex flex-col items-center gap-3 rounded-xl border bg-card p-6 shadow-xl">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Chargement de l’annuaire filtré…</p>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Tableau de Bord</h1>
          <p className="text-muted-foreground mt-1">
            Bienvenue sur votre tableau de bord personnalisable
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={isEditMode ? "default" : "outline"}
            onClick={() => setIsEditMode(!isEditMode)}
            size="sm"
          >
            <Settings className="h-4 w-4 mr-2" />
            {isEditMode ? "Terminer" : "Personnaliser"}
          </Button>
          {isEditMode && (
            <Button
              variant="outline"
              onClick={handleResetLayout}
              size="sm"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Réinitialiser
            </Button>
          )}
        </div>
      </div>

      {globalSummaryLoading ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr]">
          <Card className="h-56 animate-pulse bg-muted/50" />
          <Card className="h-56 animate-pulse bg-muted/50" />
        </div>
      ) : globalSummary ? (
        <div className="grid gap-4 xl:grid-cols-[1.1fr_1fr] animate-fade-in-up">
          <Card className="overflow-hidden border-primary/15 bg-gradient-to-br from-card via-card to-primary/5">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-primary" />Mise en route de l’association</CardTitle>
                  <CardDescription>Une progression calculée à partir des données réellement configurées.</CardDescription>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-semibold text-primary">{globalSummary.onboarding.percentage}%</span>
              </div>
              <div className="mt-2 h-2 overflow-hidden rounded-full bg-muted" aria-label={`Onboarding complété à ${globalSummary.onboarding.percentage}%`}>
                <div className="h-full rounded-full bg-primary transition-all duration-500" style={{ width: `${globalSummary.onboarding.percentage}%` }} />
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {globalSummary.onboarding.steps.map((step) => (
                <div key={step.id} className="flex items-start gap-3 rounded-xl border border-border/60 bg-background/60 p-3 transition-colors hover:border-primary/25">
                  {step.complete ? <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" /> : <CircleDashed className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />}
                  <div className="min-w-0">
                    <p className={`text-sm font-medium ${step.complete ? "text-foreground" : "text-muted-foreground"}`}>{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.description}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-card via-card to-accent/5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <CardTitle className="flex items-center gap-2"><WalletCards className="h-5 w-5 text-accent-foreground" />Vue d’ensemble financière</CardTitle>
                  <CardDescription>Flux enregistrés dans la plateforme.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" onClick={() => window.location.assign("/finance")} aria-label="Ouvrir les finances"><ArrowUpRight className="h-4 w-4" /></Button>
              </div>
            </CardHeader>
            <CardContent>
              <ChartContainer config={globalFinanceChartConfig} className="h-52 w-full aspect-auto">
                <BarChart data={globalFinanceChartData} margin={{ left: -14, right: 8, top: 8, bottom: 0 }}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" />
                  <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
                  <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `${Number(value).toLocaleString("fr-FR")} F`} width={68} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar dataKey="collected" fill="var(--color-collected)" radius={[6, 6, 0, 0]} />
                  <Bar dataKey="expenses" fill="var(--color-expenses)" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ChartContainer>
              <div className="mt-2 grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl bg-primary/8 p-3"><p className="text-xs text-muted-foreground">Solde disponible</p><p className="mt-1 font-semibold text-primary">{Number(globalSummary.finance.balance ?? 0).toLocaleString("fr-FR")} F</p></div>
                <div className="rounded-xl bg-accent/10 p-3"><p className="text-xs text-muted-foreground">Campagnes actives</p><p className="mt-1 font-semibold text-accent-foreground">{globalSummary.campaigns.active}</p></div>
              </div>
            </CardContent>
          </Card>
        </div>
      ) : null}

      {signatureDeliveryLoading ? <Card className="animate-pulse border-primary/10"><CardContent className="h-48 p-4" /></Card> : signatureDelivery ? <Card className="border-primary/15 bg-gradient-to-br from-card via-card to-primary/5 animate-fade-in-up" style={{ animationDelay: "110ms" }}><CardHeader className="pb-3"><div className="flex items-start justify-between gap-4"><div><CardTitle className="flex items-center gap-2"><MailCheck className="h-5 w-5 text-primary" />Livraison des PDF signés</CardTitle><CardDescription>Suivi par signataire après finalisation du document.</CardDescription></div><Button variant="ghost" size="icon" onClick={() => window.location.assign("/documents")} aria-label="Ouvrir les documents"><ArrowUpRight className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-2 gap-2 sm:grid-cols-5">{([{ key: "sent", label: "Envoyés", value: signatureDelivery.summary.sent, className: "text-primary" }, { key: "pending", label: "En attente", value: signatureDelivery.summary.pending, className: "text-amber-600" }, { key: "failed", label: "Échecs", value: signatureDelivery.summary.failed, className: "text-destructive" }, { key: "skipped", label: "Refusés", value: signatureDelivery.summary.skipped, className: "text-muted-foreground" }, { key: "notReady", label: "Non finalisés", value: signatureDelivery.summary.notReady, className: "text-muted-foreground" }] as const).map((item) => <div key={item.key} className="rounded-xl border border-border/60 bg-background/60 p-2.5"><p className="text-[11px] text-muted-foreground">{item.label}</p><p className={`mt-1 text-lg font-semibold ${item.className}`}>{item.value}</p></div>)}</div>{signatureDelivery.requests.length === 0 ? <p className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Aucune demande de signature enregistrée.</p> : <div className="space-y-2">{signatureDelivery.requests.slice(0, 5).map((request) => <div key={request.id} className="rounded-xl border border-border/60 bg-background/50 p-3"><div className="mb-2 flex flex-wrap items-center justify-between gap-2"><p className="truncate text-sm font-medium">{request.subject}</p><span className="text-xs text-muted-foreground">{request.status === "completed" ? "Finalisé" : "En cours"}</span></div><div className="grid gap-2 sm:grid-cols-2">{request.signers.map((signer) => { const meta = signer.status === "sent" ? { label: "Envoyé", icon: MailCheck, className: "text-primary" } : signer.status === "failed" ? { label: "Échec", icon: MailX, className: "text-destructive" } : signer.status === "skipped" ? { label: "Refusé", icon: MailWarning, className: "text-muted-foreground" } : signer.status === "pending" ? { label: "En attente", icon: Clock3, className: "text-amber-600" } : { label: "Non finalisé", icon: Clock3, className: "text-muted-foreground" }; const Icon = meta.icon; return <div key={signer.id} className="flex min-w-0 items-center justify-between gap-2 rounded-lg bg-muted/35 px-2.5 py-2 text-xs"><div className="min-w-0"><p className="truncate font-medium">{signer.name}</p><p className="truncate text-muted-foreground">{signer.email}</p></div><span className={`flex shrink-0 items-center gap-1 font-medium ${meta.className}`} title={signer.detail ?? meta.label}><Icon className="h-3.5 w-3.5" />{meta.label}</span></div>; })}</div></div>)}</div>}</CardContent></Card> : null}

      {globalSummary && (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4 animate-fade-in-up" style={{ animationDelay: "70ms" }}>
          <Card className="border-primary/10"><CardContent className="flex items-center gap-3 p-4"><Users className="h-5 w-5 text-primary" /><div><p className="text-xs text-muted-foreground">Adhésions actives</p><p className="text-xl font-semibold">{globalSummary.adhesions.active}</p></div></CardContent></Card>
          <Card className="border-accent/15"><CardContent className="flex items-center gap-3 p-4"><Briefcase className="h-5 w-5 text-accent-foreground" /><div><p className="text-xs text-muted-foreground">Projets en cours</p><p className="text-xl font-semibold">{globalSummary.projects.inProgress}</p></div></CardContent></Card>
          <Card className="border-destructive/10"><CardContent className="flex items-center gap-3 p-4"><Megaphone className="h-5 w-5 text-destructive" /><div><p className="text-xs text-muted-foreground">Tâches en retard</p><p className="text-xl font-semibold">{globalSummary.tasks.overdue}</p></div></CardContent></Card>
          <Card className="border-border/70"><CardContent className="flex items-center gap-3 p-4"><DollarSign className="h-5 w-5 text-muted-foreground" /><div><p className="text-xs text-muted-foreground">Paiements récents</p><p className="text-xl font-semibold">{globalSummary.recentPayments.length}</p></div></CardContent></Card>
        </div>
      )}

      {isEditMode && hiddenWidgets.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm">Widgets disponibles</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {hiddenWidgets.map((widget) => (
              <Button
                key={widget.id}
                variant="outline"
                size="sm"
                onClick={() => handleAddWidget(widget.id)}
                className="gap-2"
              >
                <Plus className="h-3 w-3" />
                {widget.title}
              </Button>
            ))}
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {visibleWidgets.map((widget) => {
          const handleDragStart_ = isEditMode
            ? () => handleDragStart(widget.id)
            : undefined;
          const handleDragOver_ = isEditMode ? handleDragOver : undefined;
          const handleDrop_ = isEditMode ? () => handleDrop(widget.id) : undefined;

          switch (widget.id) {
            case "documents-stat":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <StatisticWidget
                    title="Documents"
                    value={statistics?.documents || 0}
                    icon={<FileText className="h-4 w-4 text-white" />}
                    color="bg-blue-500"
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "members-stat":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <StatisticWidget
                    title="Membres"
                    value={membersStats?.total || 0}
                    icon={<Users className="h-4 w-4 text-white" />}
                    color="bg-green-500"
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "projects-stat":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <StatisticWidget
                    title="Projets"
                    value={projectsStats?.total || 0}
                    icon={<Briefcase className="h-4 w-4 text-white" />}
                    color="bg-purple-500"
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "finance-stat":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing" : ""}
                >
                  <StatisticWidget
                    title="Finance"
                    value={`${(financeStats?.balance || 0).toFixed(2)} F`}
                    icon={<DollarSign className="h-4 w-4 text-white" />}
                    color="bg-orange-500"
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "recent-documents":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing md:col-span-2" : "md:col-span-2"}
                >
                  <ListWidget
                    title="Documents Récents"
                    items={(statistics?.recentDocuments || []).map((doc: any) => ({
                      id: doc.id,
                      label: doc.title,
                      status: "pending",
                    }))}
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "urgent-tasks":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing md:col-span-2" : "md:col-span-2"}
                >
                  <ListWidget
                    title="Tâches Urgentes"
                    items={(statistics?.urgentTasks || []).map((task: any) => ({
                      id: task.id,
                      label: task.title,
                      status: task.priority === "high" || task.priority === "critical" ? "pending" : "pending",
                    }))}
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "active-projects":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing md:col-span-2" : "md:col-span-2"}
                >
                  <ListWidget
                    title="Projets Actifs"
                    items={(statistics?.activeProjects || []).map((project: any) => ({
                      id: project.id,
                      label: project.name,
                      status: "pending",
                    }))}
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            case "member-grades-chart":
              return (
                <div
                  key={widget.id}
                  draggable={isEditMode}
                  onDragStart={handleDragStart_}
                  onDragOver={handleDragOver_}
                  onDrop={handleDrop_}
                  className={isEditMode ? "cursor-grab active:cursor-grabbing md:col-span-2" : "md:col-span-2"}
                >
                  <MemberGradesChartWidget
                    gradesBreakdown={membersStats?.gradesBreakdown || {}}
                    onSelectGrade={handleGradeSelect}
                    onRemove={isEditMode ? () => handleRemoveWidget(widget.id) : undefined}
                    isDragging={draggedWidget === widget.id}
                  />
                </div>
              );

            default:
              return null;
          }
        })}
      </div>

      {visibleWidgets.length === 0 && (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground mb-4">Aucun widget visible</p>
          <Button onClick={() => setIsEditMode(true)}>
            Ajouter des widgets
          </Button>
        </Card>
      )}
    </div>
  );
}
