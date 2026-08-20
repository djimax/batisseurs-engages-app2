import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, ArrowLeft, Mail, Phone, MapPin, Edit, Trash2, Users } from "lucide-react";

export function AntenneDetail() {
  const [, navigate] = useLocation();
  const { id } = useParams<{ id: string }>();
  const antenneId = parseInt(id || "0");
  const [isCreateGroupOpen, setIsCreateGroupOpen] = useState(false);

  // Récupérer l'antenne
  const { data: antenne, isLoading: isLoadingAntenne, refetch: refetchAntenne } =
    trpc.antennes.getById.useQuery({ id: antenneId }, { enabled: antenneId > 0 });

  // Récupérer les groupes
  const { data: groupes = [], isLoading: isLoadingGroupes, refetch: refetchGroupes } =
    trpc.groupes.listByAntenne.useQuery({ antenneId }, { enabled: antenneId > 0 });

  // Mutations
  const createGroupeMutation = trpc.groupes.create.useMutation({
    onSuccess: () => {
      refetchGroupes();
      setIsCreateGroupOpen(false);
    },
  });

  const deleteGroupeMutation = trpc.groupes.delete.useMutation({
    onSuccess: () => {
      refetchGroupes();
    },
  });

  const deleteAntenneMutation = trpc.antennes.delete.useMutation({
    onSuccess: () => {
      navigate("/antennes");
    },
  });

  const handleCreateGroupSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createGroupeMutation.mutate({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      antenneId,
      description: formData.get("description") as string,
    });
  };

  if (isLoadingAntenne) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Chargement...</p>
      </div>
    );
  }

  if (!antenne) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Antenne non trouvée</p>
        <Button onClick={() => navigate("/antennes")} className="mt-4">
          Retour aux antennes
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/antennes")}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold tracking-tight">{antenne.name}</h1>
          <p className="text-muted-foreground mt-2">{antenne.city}</p>
        </div>
        <Badge variant={antenne.isActive ? "default" : "secondary"}>
          {antenne.isActive ? "Active" : "Inactive"}
        </Badge>
      </div>

      {/* Informations de l'antenne */}
      <Card>
        <CardHeader>
          <CardTitle>Informations de l'Antenne</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {antenne.description && (
            <div>
              <p className="text-sm font-medium">Description</p>
              <p className="text-sm text-muted-foreground">{antenne.description}</p>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {antenne.address && (
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Adresse</p>
                  <p className="text-sm text-muted-foreground">{antenne.address}</p>
                </div>
              </div>
            )}

            {antenne.email && (
              <div className="flex items-start gap-3">
                <Mail className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Email</p>
                  <a href={`mailto:${antenne.email}`} className="text-sm text-blue-600 hover:underline">
                    {antenne.email}
                  </a>
                </div>
              </div>
            )}

            {antenne.phone && (
              <div className="flex items-start gap-3">
                <Phone className="w-4 h-4 text-muted-foreground mt-1" />
                <div>
                  <p className="text-sm font-medium">Téléphone</p>
                  <a href={`tel:${antenne.phone}`} className="text-sm text-blue-600 hover:underline">
                    {antenne.phone}
                  </a>
                </div>
              </div>
            )}
          </div>

          <div className="flex gap-2 pt-4">
            <Button variant="outline" size="sm">
              <Edit className="w-4 h-4 mr-2" />
              Modifier
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => {
                if (confirm("Êtes-vous sûr de vouloir supprimer cette antenne ?")) {
                  deleteAntenneMutation.mutate(antenne.id);
                }
              }}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Supprimer
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Groupes */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Groupes</h2>
            <p className="text-muted-foreground mt-1">
              {groupes.length} groupe{groupes.length !== 1 ? "s" : ""} dans cette antenne
            </p>
          </div>
          <Dialog open={isCreateGroupOpen} onOpenChange={setIsCreateGroupOpen}>
            <DialogTrigger asChild>
              <Button className="gap-2">
                <Plus className="w-4 h-4" />
                Nouveau Groupe
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Créer un Groupe</DialogTitle>
                <DialogDescription>
                  Ajoutez un nouveau groupe à l'antenne {antenne.name}
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreateGroupSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium">Nom *</label>
                  <Input name="name" placeholder="ex: Groupe Développement" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Slug *</label>
                  <Input name="slug" placeholder="ex: groupe-dev" required />
                </div>
                <div>
                  <label className="text-sm font-medium">Description</label>
                  <textarea
                    name="description"
                    placeholder="Description du groupe..."
                    className="w-full px-3 py-2 border border-input rounded-md text-sm"
                    rows={3}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={createGroupeMutation.isPending}>
                  {createGroupeMutation.isPending ? "Création..." : "Créer"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {isLoadingGroupes ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Chargement des groupes...</p>
          </div>
        ) : groupes.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">Aucun groupe dans cette antenne</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {groupes.map((groupe: any) => (
              <Card key={groupe.id}>
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2">
                        <Users className="w-4 h-4" />
                        {groupe.name}
                      </CardTitle>
                      {groupe.description && (
                        <CardDescription>{groupe.description}</CardDescription>
                      )}
                    </div>
                    <Badge variant={groupe.isActive ? "default" : "secondary"}>
                      {groupe.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                      <Edit className="w-4 h-4 mr-2" />
                      Modifier
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (confirm("Êtes-vous sûr ?")) {
                          deleteGroupeMutation.mutate(groupe.id);
                        }
                      }}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
