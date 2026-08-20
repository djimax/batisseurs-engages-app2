import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Search, Trash2, Edit2, Eye } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";
import { LoadingButtonContent, LoadingState } from "@/components/LoadingState";
import { getErrorMessage } from "@/lib/uxFeedback";

export function Projects() {
  const [limit, setLimit] = useState(20);
  const [offset, setOffset] = useState(0);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    status: "planning",
    budget: "",
    leaderId: "",
  });

  // Fetch projects
  const { data: projects, isLoading, refetch } = trpc.projects.list.useQuery({
    limit,
    offset,
    status: statusFilter === "all" ? undefined : statusFilter,
  });

  // Create project mutation
  const createMutation = trpc.projects.create.useMutation({
    onSuccess: () => {
      toast.success("Projet créé avec succès");
      setFormData({ name: "", description: "", status: "planning", budget: "", leaderId: "" });
      setIsCreateOpen(false);
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la création du projet"));
    },
  });

  // Delete project mutation
  const deleteMutation = trpc.projects.delete.useMutation({
    onSuccess: () => {
      toast.success("Projet supprimé");
      refetch();
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Erreur lors de la suppression"));
    },
  });

  const handleCreateProject = () => {
    if (!formData.name || !formData.leaderId) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }

    createMutation.mutate({
      name: formData.name,
      description: formData.description || undefined,
      status: formData.status as any,
      budget: formData.budget || undefined,
      leaderId: parseInt(formData.leaderId),
    });
  };

  const getStatusBadge = (status: string) => {
    const colors: Record<string, string> = {
      planning: "bg-blue-100 text-blue-800",
      "in-progress": "bg-yellow-100 text-yellow-800",
      "on-hold": "bg-orange-100 text-orange-800",
      completed: "bg-green-100 text-green-800",
      archived: "bg-gray-100 text-gray-800",
    };
    return <Badge className={colors[status] || ""}>{status}</Badge>;
  };

  const filteredProjects = projects?.filter((p: any) =>
    p.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Projets</h1>
          <p className="text-muted-foreground">Gérez les projets de l'association</p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouveau Projet
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouveau projet</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom du projet *</Label>
                <Input
                  id="name"
                  placeholder="Nom du projet"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  placeholder="Description du projet"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select value={formData.status} onValueChange={(value) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="planning">Planification</SelectItem>
                    <SelectItem value="in-progress">En cours</SelectItem>
                    <SelectItem value="on-hold">En pause</SelectItem>
                    <SelectItem value="completed">Terminé</SelectItem>
                    <SelectItem value="archived">Archivé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget (F)</Label>
                <Input
                  id="budget"
                  placeholder="Budget du projet"
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="leaderId">Chef de projet *</Label>
                <Input
                  id="leaderId"
                  type="number"
                  placeholder="ID du chef de projet"
                  value={formData.leaderId}
                  onChange={(e) => setFormData({ ...formData, leaderId: e.target.value })}
                />
              </div>
              <Button onClick={handleCreateProject} disabled={createMutation.isPending} className="w-full">
                <LoadingButtonContent loading={createMutation.isPending} loadingLabel="Création…">
                  Créer le projet
                </LoadingButtonContent>
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex gap-4 items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="search">Rechercher</Label>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              id="search"
              placeholder="Rechercher un projet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="status-filter">Statut</Label>
          <Select value={statusFilter} onValueChange={(value) => {
            setStatusFilter(value);
            setOffset(0);
          }}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="planning">Planification</SelectItem>
              <SelectItem value="in-progress">En cours</SelectItem>
              <SelectItem value="on-hold">En pause</SelectItem>
              <SelectItem value="completed">Terminé</SelectItem>
              <SelectItem value="archived">Archivé</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="limit">Éléments par page</Label>
          <Select value={String(limit)} onValueChange={(value) => {
            setLimit(Number(value));
            setOffset(0);
          }}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {isLoading ? (
          <LoadingState variant="cards" label="Chargement des projets…" rows={6} className="col-span-full" />
        ) : filteredProjects && filteredProjects.length > 0 ? (
          filteredProjects.map((project: any) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <CardDescription className="line-clamp-2">{project.description}</CardDescription>
                  </div>
                  {getStatusBadge(project.status)}
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {project.budget && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Budget: </span>
                    <span className="font-semibold">{project.budget} F</span>
                  </div>
                )}
                {project.startDate && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">Début: </span>
                    <span>{new Date(project.startDate).toLocaleDateString("fr-FR")}</span>
                  </div>
                )}
                <div className="flex gap-2 pt-2">
                  <Link href={`/projects/${project.id}`}>
                    <Button size="sm" variant="outline" className="gap-2 flex-1">
                      <Eye className="w-4 h-4" />
                      Voir
                    </Button>
                  </Link>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMutation.mutate({ id: project.id })}
                    disabled={deleteMutation.isPending}
                    aria-label="Supprimer le projet"
                  >
                    {deleteMutation.isPending ? <LoadingState variant="inline" label="" /> : <Trash2 className="w-4 h-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        ) : (
          <div className="col-span-full text-center py-8 text-muted-foreground">
            Aucun projet trouvé
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex gap-2 justify-center items-center">
        <Button
          variant="outline"
          onClick={() => setOffset(Math.max(0, offset - limit))}
          disabled={offset === 0}
        >
          Précédent
        </Button>
        <span className="text-sm text-muted-foreground">
          Page {Math.floor(offset / limit) + 1}
        </span>
        <Button
          variant="outline"
          onClick={() => setOffset(offset + limit)}
          disabled={!projects || projects.length < limit}
        >
          Suivant
        </Button>
      </div>
    </div>
  );
}
