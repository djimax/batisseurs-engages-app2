import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const DEFAULT_WIDGETS: Widget[] = [
  { id: "documents-stat", title: "Documents", type: "statistic", visible: true, position: 0 },
  { id: "members-stat", title: "Membres", type: "statistic", visible: true, position: 1 },
  { id: "projects-stat", title: "Projets", type: "statistic", visible: true, position: 2 },
  { id: "finance-stat", title: "Finance", type: "statistic", visible: true, position: 3 },
  { id: "recent-documents", title: "Documents Récents", type: "list", visible: true, position: 4 },
  { id: "urgent-tasks", title: "Tâches Urgentes", type: "list", visible: true, position: 5 },
  { id: "active-projects", title: "Projets Actifs", type: "list", visible: true, position: 6 },
];

const STORAGE_KEY = "dashboard-widgets-config";

export default function Dashboard() {
  const [widgets, setWidgets] = useState<Widget[]>(DEFAULT_WIDGETS);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draggedWidget, setDraggedWidget] = useState<string | null>(null);

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
