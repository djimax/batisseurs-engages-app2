import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
import { Plus, Search, MapPin, Mail, Phone, Edit, Trash2, ChevronRight } from "lucide-react";
import { useRouter } from "wouter";

export function Antennes() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "city" | "createdAt">("name");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(10);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Récupérer les antennes
  const { data: antennasData, isLoading, refetch } = trpc.antennes.list.useQuery({
    search,
    sortBy,
    sortOrder,
    page,
    limit,
  });

  // Mutations
  const createMutation = trpc.antennes.create.useMutation({
    onSuccess: () => {
      refetch();
      setIsCreateOpen(false);
    },
  });

  const updateMutation = trpc.antennes.update.useMutation({
    onSuccess: () => {
      refetch();
      setEditingId(null);
    },
  });

  const deleteMutation = trpc.antennes.delete.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleCreateSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    createMutation.mutate({
      name: formData.get("name") as string,
      slug: formData.get("slug") as string,
      city: formData.get("city") as string,
      description: formData.get("description") as string,
      address: formData.get("address") as string,
      phone: formData.get("phone") as string,
      email: formData.get("email") as string,
    });
  };

  const antennes = antennasData?.data || [];
  const pagination = antennasData?.pagination;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Antennes</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les antennes et branches de votre association
          </p>
        </div>
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="w-4 h-4" />
              Nouvelle Antenne
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer une Antenne</DialogTitle>
              <DialogDescription>
                Ajoutez une nouvelle antenne pour votre association
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium">Nom *</label>
                <Input name="name" placeholder="ex: Antenne Paris" required />
              </div>
              <div>
                <label className="text-sm font-medium">Slug *</label>
                <Input name="slug" placeholder="ex: antenne-paris" required />
              </div>
              <div>
                <label className="text-sm font-medium">Ville *</label>
                <Input name="city" placeholder="ex: Paris" required />
              </div>
              <div>
                <label className="text-sm font-medium">Adresse</label>
                <Input name="address" placeholder="ex: 123 Rue de la Paix" />
              </div>
              <div>
                <label className="text-sm font-medium">Email</label>
                <Input name="email" type="email" placeholder="ex: contact@antenne.fr" />
              </div>
              <div>
                <label className="text-sm font-medium">Téléphone</label>
                <Input name="phone" placeholder="ex: +33 1 23 45 67 89" />
              </div>
              <div>
                <label className="text-sm font-medium">Description</label>
                <textarea
                  name="description"
                  placeholder="Description de l'antenne..."
                  className="w-full px-3 py-2 border border-input rounded-md text-sm"
                  rows={3}
                />
              </div>
              <Button type="submit" className="w-full" disabled={createMutation.isPending}>
                {createMutation.isPending ? "Création..." : "Créer"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filtres et Recherche */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher une antenne..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={(value) => setSortBy(value as any)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="name">Nom</SelectItem>
              <SelectItem value="city">Ville</SelectItem>
              <SelectItem value="createdAt">Date</SelectItem>
            </SelectContent>
          </Select>

          <Select value={sortOrder} onValueChange={(value) => setSortOrder(value as any)}>
            <SelectTrigger className="w-[120px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="asc">Croissant</SelectItem>
              <SelectItem value="desc">Décroissant</SelectItem>
            </SelectContent>
          </Select>

          <Select value={limit.toString()} onValueChange={(value) => setLimit(parseInt(value))}>
            <SelectTrigger className="w-[100px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Liste des Antennes */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Chargement...</p>
        </div>
      ) : antennes.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MapPin className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">Aucune antenne trouvée</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {antennes.map((antenne: any) => (
            <Card
              key={antenne.id}
              className="cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => router.push(`/antennes/${antenne.id}`)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {antenne.name}
                    </CardTitle>
                    <CardDescription>{antenne.city}</CardDescription>
                  </div>
                  <Badge variant={antenne.isActive ? "default" : "secondary"}>
                    {antenne.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {antenne.description && (
                  <p className="text-sm text-muted-foreground">{antenne.description}</p>
                )}
                <div className="flex flex-wrap gap-4 text-sm">
                  {antenne.address && (
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      {antenne.address}
                    </div>
                  )}
                  {antenne.email && (
                    <a
                      href={`mailto:${antenne.email}`}
                      className="flex items-center gap-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      {antenne.email}
                    </a>
                  )}
                  {antenne.phone && (
                    <a
                      href={`tel:${antenne.phone}`}
                      className="flex items-center gap-2 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      {antenne.phone}
                    </a>
                  )}
                </div>
                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/antennes/${antenne.id}`);
                    }}
                    className="gap-2"
                  >
                    <ChevronRight className="w-4 h-4" />
                    Voir Groupes
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingId(antenne.id);
                    }}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (confirm("Êtes-vous sûr ?")) {
                        deleteMutation.mutate(antenne.id);
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

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Page {pagination.page} sur {pagination.pages} ({pagination.total} total)
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
            >
              Précédent
            </Button>
            <Button
              variant="outline"
              onClick={() => setPage(Math.min(pagination.pages, page + 1))}
              disabled={page === pagination.pages}
            >
              Suivant
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
