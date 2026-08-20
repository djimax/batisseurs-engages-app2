import { useState } from "react";
import { useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, CheckCircle2, Clock, AlertCircle, Trash2, MessageCircle, BarChart3, Download } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { Textarea } from "@/components/ui/textarea";
import { exportRowsToCSV, exportRowsToPDF, generateListExportFilename } from "@/lib/exportLists";

export function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");
  const [, navigate] = useLocation();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState<number | null>(null);
  const [commentDraft, setCommentDraft] = useState("");
  const [taskForm, setTaskForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    status: "todo",
  });

  // Fetch project
  const { data: project, isLoading } = trpc.projects.get.useQuery({ id: projectId });

  // Fetch tasks
  const { data: tasks, refetch: refetchTasks } = trpc.projects.getTasks.useQuery({ projectId });

  // Fetch milestones
  const { data: milestones } = trpc.projects.getMilestones.useQuery({ projectId });

  // Fetch budget items
  const { data: budgetItems } = trpc.projects.getBudgetItems.useQuery({ projectId });
  const { data: report } = trpc.projects.report.useQuery({ projectId });
  const { data: taskComments, refetch: refetchTaskComments } = trpc.projects.getTaskComments.useQuery(
    { taskId: selectedTaskId ?? 0 },
    { enabled: Boolean(selectedTaskId) },
  );

  // Create task mutation
  const createTaskMutation = trpc.projects.createTask.useMutation({
    onSuccess: () => {
      toast.success("Tâche créée");
      setTaskForm({ title: "", description: "", priority: "medium", status: "todo" });
      setIsAddTaskOpen(false);
      refetchTasks();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur");
    },
  });

  const addTaskCommentMutation = trpc.projects.addTaskComment.useMutation({
    onSuccess: () => {
      toast.success("Commentaire ajouté");
      setCommentDraft("");
      void refetchTaskComments();
    },
    onError: (error) => toast.error(error.message || "Erreur lors de l’ajout du commentaire"),
  });

  const deleteTaskCommentMutation = trpc.projects.deleteTaskComment.useMutation({
    onSuccess: () => {
      toast.success("Commentaire supprimé");
      void refetchTaskComments();
    },
    onError: (error) => toast.error(error.message || "Erreur lors de la suppression du commentaire"),
  });

  // Delete task mutation
  const deleteTaskMutation = trpc.projects.deleteTask.useMutation({
    onSuccess: () => {
      toast.success("Tâche supprimée");
      refetchTasks();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur");
    },
  });

  const handleAddComment = () => {
    if (!selectedTaskId || !commentDraft.trim()) return;
    addTaskCommentMutation.mutate({ projectId, taskId: selectedTaskId, content: commentDraft.trim() });
  };

  const handleExportReport = (format: "csv" | "pdf") => {
    if (!project || !report) return;
    const rows = [{
      project: project.name,
      status: project.status,
      progress: `${report.progressPercentage}%`,
      tasks: report.tasks.total,
      completed: report.tasks.completed,
      overdue: report.tasks.overdue,
      milestones: `${report.milestones.completed}/${report.milestones.total}`,
      plannedBudget: report.budget.planned,
      spentBudget: report.budget.spent,
      remainingBudget: report.budget.remaining,
      comments: report.commentsCount,
    }];
    const columns = [
      { header: "Projet", value: (row: typeof rows[number]) => row.project },
      { header: "Statut", value: (row: typeof rows[number]) => row.status },
      { header: "Progression", value: (row: typeof rows[number]) => row.progress },
      { header: "Tâches", value: (row: typeof rows[number]) => row.tasks },
      { header: "Terminées", value: (row: typeof rows[number]) => row.completed },
      { header: "En retard", value: (row: typeof rows[number]) => row.overdue },
      { header: "Jalons", value: (row: typeof rows[number]) => row.milestones },
      { header: "Budget prévu", value: (row: typeof rows[number]) => row.plannedBudget },
      { header: "Dépensé", value: (row: typeof rows[number]) => row.spentBudget },
      { header: "Solde", value: (row: typeof rows[number]) => row.remainingBudget },
      { header: "Commentaires", value: (row: typeof rows[number]) => row.comments },
    ];
    if (format === "csv") {
      exportRowsToCSV(rows, columns, generateListExportFilename(`rapport_projet_${project.id}`, "csv"));
      toast.success("Rapport CSV téléchargé");
    } else {
      void exportRowsToPDF(`Rapport projet — ${project.name}`, rows, columns, generateListExportFilename(`rapport_projet_${project.id}`, "pdf"));
      toast.success("Génération du rapport PDF lancée");
    }
  };

  const handleCreateTask = () => {
    if (!taskForm.title) {
      toast.error("Veuillez entrer un titre");
      return;
    }

    createTaskMutation.mutate({
      projectId,
      title: taskForm.title,
      description: taskForm.description,
      priority: taskForm.priority as any,
      status: taskForm.status as any,
    });
  };

  if (isLoading) return <div className="p-8 text-center">Chargement...</div>;
  if (!project) return <div className="p-8 text-center">Projet non trouvé</div>;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      "on-hold": "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return colors[status] || "";
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      low: "bg-green-100 text-green-800",
      medium: "bg-blue-100 text-blue-800",
      high: "bg-orange-100 text-orange-800",
      critical: "bg-red-100 text-red-800",
    };
    return colors[priority] || "";
  };

  const taskStats = {
    total: tasks?.length || 0,
    completed: tasks?.filter((t: any) => t.status === "completed").length || 0,
    inProgress: tasks?.filter((t: any) => t.status === "in-progress").length || 0,
  };

  const budgetTotal = budgetItems?.reduce((sum: number, item: any) => sum + parseFloat(item.amount || 0), 0) || 0;
  const budgetSpent = budgetItems?.reduce((sum: number, item: any) => sum + parseFloat(item.spent || 0), 0) || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div>
            <h1 className="text-3xl font-bold">{project.name}</h1>
            <p className="text-muted-foreground mt-1">{project.description}</p>
          </div>
          <Badge className={getStatusColor(project.status)}>{project.status}</Badge>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Tâches Totales</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{taskStats.total}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Complétées</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{taskStats.completed}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">En Cours</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600">{taskStats.inProgress}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{project.budget || "N/A"} F</div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="tasks" className="w-full">
        <TabsList className="flex-wrap">
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="overview">Rapport</TabsTrigger>
          <TabsTrigger value="milestones">Jalons</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

        {/* Report Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
            <div><h2 className="text-xl font-semibold">Rapport d’avancement</h2><p className="text-sm text-muted-foreground">Progression opérationnelle, jalons, activité et consommation budgétaire.</p></div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => handleExportReport("csv")} disabled={!report}><Download className="mr-2 h-4 w-4" />CSV</Button>
              <Button size="sm" variant="outline" onClick={() => handleExportReport("pdf")} disabled={!report}><Download className="mr-2 h-4 w-4" />PDF</Button>
            </div>
          </div>
          {report ? <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Progression</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-primary">{report.progressPercentage}%</div><div className="mt-2 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${report.progressPercentage}%` }} /></div></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Tâches en retard</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold text-destructive">{report.tasks.overdue}</div><p className="text-xs text-muted-foreground">sur {report.tasks.total} tâche(s)</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Jalons réalisés</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{report.milestones.completed}/{report.milestones.total}</div><p className="text-xs text-muted-foreground">jalons suivis</p></CardContent></Card>
              <Card><CardHeader className="pb-2"><CardTitle className="text-sm font-medium">Budget consommé</CardTitle></CardHeader><CardContent><div className="text-3xl font-bold">{report.budget.spent.toLocaleString("fr-FR")} F</div><p className="text-xs text-muted-foreground">sur {report.budget.planned.toLocaleString("fr-FR")} F</p></CardContent></Card>
            </div>
            <Card><CardHeader><CardTitle className="flex items-center gap-2"><BarChart3 className="h-5 w-5 text-primary" />Synthèse d’activité</CardTitle><CardDescription>Dernière génération : {new Date(report.generatedAt).toLocaleString("fr-FR")}</CardDescription></CardHeader><CardContent className="grid gap-3 sm:grid-cols-3"><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Tâches en cours</div><div className="text-xl font-semibold">{report.tasks.inProgress}</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Mises à jour</div><div className="text-xl font-semibold">{report.updatesCount}</div></div><div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Commentaires</div><div className="text-xl font-semibold">{report.commentsCount}</div></div></CardContent></Card>
          </> : <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Génération du rapport…</div>}
        </TabsContent>

        {/* Tasks Tab */}
        <TabsContent value="tasks" className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Tâches du Projet</h2>
            <Dialog open={isAddTaskOpen} onOpenChange={setIsAddTaskOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" />
                  Ajouter une Tâche
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Ajouter une tâche</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="task-title">Titre *</Label>
                    <Input
                      id="task-title"
                      placeholder="Titre de la tâche"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({ ...taskForm, title: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-description">Description</Label>
                    <Input
                      id="task-description"
                      placeholder="Description"
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({ ...taskForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="task-priority">Priorité</Label>
                    <Select value={taskForm.priority} onValueChange={(value) => setTaskForm({ ...taskForm, priority: value })}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Basse</SelectItem>
                        <SelectItem value="medium">Moyenne</SelectItem>
                        <SelectItem value="high">Haute</SelectItem>
                        <SelectItem value="critical">Critique</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Button onClick={handleCreateTask} disabled={createTaskMutation.isPending} className="w-full">
                    {createTaskMutation.isPending ? "Création..." : "Créer la tâche"}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {tasks && tasks.length > 0 ? (
              tasks.map((task: any) => (
                <Card key={task.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex gap-2 items-center mb-2">
                          <h3 className="font-semibold">{task.title}</h3>
                          <Badge className={getPriorityColor(task.priority)}>{task.priority}</Badge>
                          <Badge className={task.status === "completed" ? "bg-green-100 text-green-800" : "bg-blue-100 text-blue-800"}>
                            {task.status}
                          </Badge>
                        </div>
                        {task.description && <p className="text-sm text-muted-foreground">{task.description}</p>}
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant={selectedTaskId === task.id ? "default" : "outline"} onClick={() => setSelectedTaskId(task.id)}><MessageCircle className="mr-2 h-4 w-4" />Discussion</Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                          disabled={deleteTaskMutation.isPending}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucune tâche</div>
            )}
          </div>

          {selectedTaskId ? <Card className="border-primary/30 bg-primary/5">
            <CardHeader><CardTitle className="flex items-center gap-2"><MessageCircle className="h-5 w-5 text-primary" />Discussion de la tâche</CardTitle><CardDescription>{tasks?.find((task: any) => task.id === selectedTaskId)?.title || `Tâche #${selectedTaskId}`}</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">{taskComments?.map((comment: any) => <div key={comment.id} className="rounded-lg border bg-background p-3"><div className="flex justify-between gap-3 text-xs text-muted-foreground"><span>Auteur #{comment.authorId}</span><span>{new Date(comment.createdAt).toLocaleString("fr-FR")}</span></div><p className="mt-2 whitespace-pre-wrap text-sm">{comment.content}</p><div className="mt-2 text-right"><Button variant="ghost" size="sm" onClick={() => { if (window.confirm("Supprimer ce commentaire ?")) deleteTaskCommentMutation.mutate({ id: comment.id }); }}>Supprimer</Button></div></div>)}{!taskComments?.length ? <p className="text-sm text-muted-foreground">Aucun commentaire pour cette tâche.</p> : null}</div>
              <div className="space-y-2"><Label htmlFor="task-comment">Ajouter un commentaire</Label><Textarea id="task-comment" value={commentDraft} onChange={(event) => setCommentDraft(event.target.value)} placeholder="Décrivez l’avancement, un blocage ou une décision…" /><Button onClick={handleAddComment} disabled={addTaskCommentMutation.isPending || !commentDraft.trim()}>{addTaskCommentMutation.isPending ? "Envoi…" : "Publier le commentaire"}</Button></div>
            </CardContent>
          </Card> : null}
        </TabsContent>

        {/* Milestones Tab */}
        <TabsContent value="milestones" className="space-y-4">
          <h2 className="text-xl font-semibold">Jalons</h2>
          <div className="space-y-2">
            {milestones && milestones.length > 0 ? (
              milestones.map((milestone: any) => (
                <Card key={milestone.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{milestone.title}</h3>
                        {milestone.description && <p className="text-sm text-muted-foreground">{milestone.description}</p>}
                        <p className="text-sm mt-2">
                          <span className="text-muted-foreground">Date limite: </span>
                          {new Date(milestone.dueDate).toLocaleDateString("fr-FR")}
                        </p>
                      </div>
                      <Badge>{milestone.status}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun jalon</div>
            )}
          </div>
        </TabsContent>

        {/* Budget Tab */}
        <TabsContent value="budget" className="space-y-4">
          <h2 className="text-xl font-semibold">Budget</h2>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Budget Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{budgetTotal} F</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Dépensé</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600">{budgetSpent} F</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium">Restant</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{budgetTotal - budgetSpent} F</div>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-2">
            {budgetItems && budgetItems.length > 0 ? (
              budgetItems.map((item: any) => (
                <Card key={item.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <h3 className="font-semibold">{item.category}</h3>
                        {item.description && <p className="text-sm text-muted-foreground">{item.description}</p>}
                        <div className="text-sm mt-2">
                          <span className="text-muted-foreground">Budget: </span>
                          <span className="font-semibold">{item.amount} F</span>
                          <span className="text-muted-foreground ml-4">Dépensé: </span>
                          <span className="font-semibold">{item.spent} F</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucun élément budgétaire</div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
