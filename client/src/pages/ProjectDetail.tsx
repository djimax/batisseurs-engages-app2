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
import { Plus, CheckCircle2, Clock, AlertCircle, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export function ProjectDetail() {
  const [, params] = useRoute("/projects/:id");
  const projectId = parseInt(params?.id || "0");
  const [, navigate] = useLocation();

  const [isAddTaskOpen, setIsAddTaskOpen] = useState(false);
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
        <TabsList>
          <TabsTrigger value="tasks">Tâches</TabsTrigger>
          <TabsTrigger value="milestones">Jalons</TabsTrigger>
          <TabsTrigger value="budget">Budget</TabsTrigger>
        </TabsList>

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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => deleteTaskMutation.mutate({ id: task.id })}
                        disabled={deleteTaskMutation.isPending}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">Aucune tâche</div>
            )}
          </div>
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
