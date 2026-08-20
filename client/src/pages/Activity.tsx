import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Activity as ActivityIcon, 
  FileText,
  Users,
  FolderOpen,
  Upload,
  Trash2,
  Edit,
  Plus,
  MessageSquare,
  Clock
} from "lucide-react";

const actionIcons: Record<string, any> = {
  create: Plus,
  update: Edit,
  delete: Trash2,
  upload: Upload,
  remove_file: Trash2,
};

const entityIcons: Record<string, any> = {
  document: FileText,
  category: FolderOpen,
  member: Users,
  note: MessageSquare,
};

const actionLabels: Record<string, string> = {
  create: "Création",
  update: "Modification",
  delete: "Suppression",
  upload: "Upload",
  remove_file: "Suppression fichier",
};

const entityLabels: Record<string, string> = {
  document: "Document",
  category: "Catégorie",
  member: "Membre",
  note: "Note",
};

export default function Activity() {
  const { data: activities, isLoading } = trpc.activity.recent.useQuery({ limit: 50 });

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getRelativeTime = (date: Date | string) => {
    const now = new Date();
    const diff = now.getTime() - new Date(date).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "À l'instant";
    if (minutes < 60) return `Il y a ${minutes} min`;
    if (hours < 24) return `Il y a ${hours}h`;
    if (days < 7) return `Il y a ${days} jour${days > 1 ? "s" : ""}`;
    return formatDate(date);
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case "create":
        return "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300";
      case "update":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300";
      case "delete":
      case "remove_file":
        return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300";
      case "upload":
        return "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300";
      default:
        return "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  // Group activities by date
  const groupedActivities = activities?.reduce((groups: Record<string, typeof activities>, activity) => {
    const date = new Date(activity.createdAt).toLocaleDateString("fr-FR", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(activity);
    return groups;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Historique d'activité</h1>
        <p className="text-muted-foreground">
          Suivez toutes les actions effectuées dans l'application
        </p>
      </div>

      {/* Activity Timeline */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ActivityIcon className="h-5 w-5" />
            Activités récentes
          </CardTitle>
          <CardDescription>
            Les 50 dernières actions effectuées
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} className="flex items-start gap-4">
                  <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : activities && activities.length > 0 ? (
            <ScrollArea className="h-[600px] pr-4">
              <div className="space-y-8">
                {Object.entries(groupedActivities).map(([date, dayActivities]) => (
                  <div key={date}>
                    <div className="sticky top-0 bg-card z-10 py-2">
                      <h3 className="text-sm font-semibold text-muted-foreground flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {date}
                      </h3>
                    </div>
                    <div className="space-y-4 mt-3">
                      {dayActivities.map((activity) => {
                        const ActionIcon = actionIcons[activity.action] || Edit;
                        const EntityIcon = entityIcons[activity.entityType] || FileText;

                        return (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-4 p-4 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                          >
                            <div className={`p-2 rounded-full ${getActionColor(activity.action)}`}>
                              <ActionIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 flex-wrap">
                                <Badge variant="outline" className="gap-1">
                                  <EntityIcon className="h-3 w-3" />
                                  {entityLabels[activity.entityType] || activity.entityType}
                                </Badge>
                                <Badge className={getActionColor(activity.action)}>
                                  {actionLabels[activity.action] || activity.action}
                                </Badge>
                              </div>
                              <p className="mt-2 text-sm">
                                {activity.details || `${actionLabels[activity.action] || activity.action} d'un ${entityLabels[activity.entityType] || activity.entityType}`}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {getRelativeTime(activity.createdAt)}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </ScrollArea>
          ) : (
            <div className="text-center py-12">
              <ActivityIcon className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Aucune activité</h3>
              <p className="text-muted-foreground">
                Les actions effectuées apparaîtront ici
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Activity Stats */}
      {activities && activities.length > 0 && (
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Créations</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-emerald-600">
                {activities.filter(a => a.action === "create").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Modifications</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {activities.filter(a => a.action === "update").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Uploads</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {activities.filter(a => a.action === "upload").length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Suppressions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                {activities.filter(a => a.action === "delete" || a.action === "remove_file").length}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
