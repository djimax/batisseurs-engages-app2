import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export default function UserManagement() {
  const { user: currentUser } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<"admin" | "user">("user");

  // Fetch users from database
  const { data: users = [], isLoading, refetch } = trpc.users.list.useQuery();
  
  // Mutations
  const updateRoleMutation = trpc.users.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour avec succès");
      setEditingRoleUserId(null);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message || "Erreur lors de la mise à jour du rôle");
    },
  });

  const filteredUsers = users.filter(
    (user) =>
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleChangeRole = (userId: number, newRole: "admin" | "user") => {
    updateRoleMutation.mutate({ userId, newRole });
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "admin" ? "destructive" : "secondary";
  };

  const formatDate = (dateString: string | Date) => {
    const date = typeof dateString === "string" ? new Date(dateString) : dateString;
    return date.toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!currentUser || currentUser.role !== "admin") {
    return (
      <div className="flex items-center justify-center py-12">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <p className="text-center text-muted-foreground">
              Vous n'avez pas la permission d'accéder à cette page.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les rôles et permissions des utilisateurs du système
          </p>
        </div>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par email ou nom..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Users Table */}
      {isLoading ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            <p className="mt-4 text-muted-foreground">Chargement des utilisateurs...</p>
          </CardContent>
        </Card>
      ) : filteredUsers.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <p className="text-muted-foreground">Aucun utilisateur trouvé</p>
          </CardContent>
        </Card>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-muted">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium">Email</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Créé le</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{user.email || "-"}</td>
                    <td className="px-4 py-3 text-sm">{user.name || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role === "admin" ? "Admin" : "Utilisateur"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-muted-foreground">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Dialog open={editingRoleUserId === user.id} onOpenChange={(open) => {
                          if (!open) setEditingRoleUserId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRoleUserId(user.id);
                                setEditingRole(user.role as "admin" | "user");
                              }}
                              title="Changer le rôle"
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Changer le rôle de {user.email}</DialogTitle>
                              <DialogDescription>
                                Sélectionnez le nouveau rôle pour cet utilisateur
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">
                                  Rôle actuel: {user.role === "admin" ? "Administrateur" : "Utilisateur"}
                                </label>
                                <Select value={editingRole} onValueChange={(value: any) => setEditingRole(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="user">Utilisateur</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={() => handleChangeRole(user.id, editingRole)}
                                disabled={updateRoleMutation.isPending}
                                className="w-full"
                              >
                                {updateRoleMutation.isPending ? (
                                  <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Mise à jour...
                                  </>
                                ) : (
                                  "Confirmer le changement"
                                )}
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Info Card */}
      <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-900">
        <CardHeader>
          <CardTitle className="text-base">💾 Données Persistantes</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tous les changements de rôle sont sauvegardés directement dans la base de données.
          Les modifications sont immédiatement appliquées et visibles pour tous les utilisateurs.
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="text-base">📋 Gestion des Rôles</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200">
          <p className="mb-2">
            <strong>Administrateur :</strong> Accès complet à toutes les fonctionnalités de gestion
          </p>
          <p>
            <strong>Utilisateur :</strong> Accès limité aux fonctionnalités de base
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
