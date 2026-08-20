import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Edit2, Plus, ShieldCheck, Trash2, UserPlus, X } from "lucide-react";
import { toast } from "sonner";

const EMPTY_FORM = { name: "", description: "" };

export default function AdminRoles() {
  const { data: user } = trpc.auth.me.useQuery();
  const [isOpen, setIsOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<{ id: number; name: string; description: string | null; isSystem: number | null } | null>(null);
  const [formData, setFormData] = useState(EMPTY_FORM);

  const { data: roles = [], isLoading, refetch } = trpc.admin.getRoles.useQuery();
  const { data: users = [] } = trpc.users.list.useQuery(undefined, { enabled: user?.role === "admin" });
  const { data: userRoles = [], refetch: refetchUserRoles } = trpc.admin.listUserRoles.useQuery({}, { enabled: user?.role === "admin" });

  const createRoleMutation = trpc.admin.createRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle créé");
      setFormData(EMPTY_FORM);
      setIsOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const updateRoleMutation = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle mis à jour");
      setEditingRole(null);
      setFormData(EMPTY_FORM);
      setIsOpen(false);
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const deleteRoleMutation = trpc.admin.deleteRole.useMutation({
    onSuccess: () => {
      toast.success("Rôle supprimé");
      refetch();
    },
    onError: (error) => toast.error(error.message),
  });
  const assignRoleMutation = trpc.admin.assignRoleToUser.useMutation({
    onSuccess: () => {
      toast.success("Rôle attribué");
      refetchUserRoles();
    },
    onError: (error) => toast.error(error.message),
  });
  const removeRoleMutation = trpc.admin.removeRoleFromUser.useMutation({
    onSuccess: () => {
      toast.success("Rôle retiré");
      refetchUserRoles();
    },
    onError: (error) => toast.error(error.message),
  });

  const openCreate = () => {
    setEditingRole(null);
    setFormData(EMPTY_FORM);
    setIsOpen(true);
  };
  const openEdit = (role: (typeof roles)[number]) => {
    setEditingRole(role);
    setFormData({ name: role.name, description: role.description ?? "" });
    setIsOpen(true);
  };
  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const name = formData.name.trim();
    if (!name) {
      toast.error("Le nom du rôle est requis");
      return;
    }
    if (editingRole) {
      updateRoleMutation.mutate({ roleId: editingRole.id, name, description: formData.description.trim() || undefined });
    } else {
      createRoleMutation.mutate({ name, description: formData.description.trim() || undefined });
    }
  };
  const handleDelete = (roleId: number, roleName: string) => {
    if (window.confirm(`Supprimer le rôle « ${roleName} » ?`)) deleteRoleMutation.mutate({ roleId });
  };
  const assigning = assignRoleMutation.isPending || removeRoleMutation.isPending;

  const assignmentsByUser = useMemo(() => {
    return userRoles.reduce<Record<number, typeof userRoles>>((groups, assignment) => {
      (groups[assignment.userId] ??= []).push(assignment);
      return groups;
    }, {});
  }, [userRoles]);

  if (!user || user.role !== "admin") {
    return <Card className="mx-auto mt-8 max-w-md"><CardHeader><CardTitle>Accès refusé</CardTitle></CardHeader><CardContent>Cette page est réservée aux administrateurs.</CardContent></Card>;
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3"><ShieldCheck className="h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight">Gestion des rôles</h1></div>
          <p className="mt-2 text-muted-foreground">Configurez les rôles et attribuez-les aux membres de l’équipe.</p>
        </div>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild><Button onClick={openCreate} className="button-interactive gap-2"><Plus className="h-4 w-4" />Nouveau rôle</Button></DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>{editingRole ? "Modifier le rôle" : "Créer un nouveau rôle"}</DialogTitle><DialogDescription>{editingRole ? "Mettez à jour ce rôle personnalisé." : "Ajoutez un rôle métier à votre association."}</DialogDescription></DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2"><Label htmlFor="role-name">Nom du rôle</Label><Input id="role-name" value={formData.name} onChange={(event) => setFormData({ ...formData, name: event.target.value })} maxLength={100} required /></div>
              <div className="space-y-2"><Label htmlFor="role-description">Description</Label><Textarea id="role-description" value={formData.description} onChange={(event) => setFormData({ ...formData, description: event.target.value })} maxLength={500} rows={4} /></div>
              <div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setIsOpen(false)}>Annuler</Button><Button type="submit" disabled={createRoleMutation.isPending || updateRoleMutation.isPending}>{editingRole ? "Enregistrer" : "Créer"}</Button></div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader><CardTitle>Rôles configurés</CardTitle><CardDescription>{roles.length} rôle{roles.length !== 1 ? "s" : ""} disponible{roles.length !== 1 ? "s" : ""}. Les rôles système restent protégés.</CardDescription></CardHeader>
        <CardContent>
          {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement des rôles…</p> : roles.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun rôle créé pour le moment.</p> : (
            <div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Nom</TableHead><TableHead>Description</TableHead><TableHead>Type</TableHead><TableHead>Créé le</TableHead><TableHead className="text-right">Actions</TableHead></TableRow></TableHeader><TableBody>
              {roles.map((role) => <TableRow key={role.id} className="transition-colors hover:bg-muted/35"><TableCell className="font-medium">{role.name}</TableCell><TableCell className="max-w-sm text-sm text-muted-foreground">{role.description || "—"}</TableCell><TableCell><Badge variant={role.isSystem ? "secondary" : "outline"}>{role.isSystem ? "Système" : "Personnalisé"}</Badge></TableCell><TableCell className="text-sm">{new Date(role.createdAt).toLocaleDateString("fr-FR")}</TableCell><TableCell className="text-right"><div className="flex justify-end gap-1">{!role.isSystem && <><Button variant="ghost" size="sm" onClick={() => openEdit(role)} className="gap-2"><Edit2 className="h-4 w-4" />Modifier</Button><Button variant="ghost" size="sm" onClick={() => handleDelete(role.id, role.name)} disabled={deleteRoleMutation.isPending} className="gap-2 text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" />Supprimer</Button></>}</div></TableCell></TableRow>)}
            </TableBody></Table></div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><UserPlus className="h-5 w-5 text-primary" />Attribution aux utilisateurs</CardTitle><CardDescription>Attribuez un ou plusieurs rôles et retirez-les avec traçabilité.</CardDescription></CardHeader>
        <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Utilisateur</TableHead><TableHead>Rôles attribués</TableHead><TableHead>Ajouter un rôle</TableHead></TableRow></TableHeader><TableBody>
          {users.map((member) => {
            const assignments = assignmentsByUser[member.id] ?? [];
            return <TableRow key={member.id}><TableCell><p className="font-medium">{member.name || "Utilisateur sans nom"}</p><p className="text-xs text-muted-foreground">{member.email || `#${member.id}`}</p></TableCell><TableCell><div className="flex flex-wrap gap-2">{assignments.length === 0 ? <span className="text-sm text-muted-foreground">Aucun rôle spécifique</span> : assignments.map((assignment) => <Badge key={assignment.id} variant="outline" className="gap-1">{assignment.roleName}<button type="button" aria-label={`Retirer ${assignment.roleName}`} onClick={() => removeRoleMutation.mutate({ userId: assignment.userId, roleId: assignment.roleId })} disabled={assigning}><X className="h-3 w-3" /></button></Badge>)}</div></TableCell><TableCell><select className="h-9 min-w-40 rounded-md border border-input bg-background px-3 text-sm" defaultValue="" onChange={(event) => { const roleId = Number(event.target.value); if (roleId > 0) { assignRoleMutation.mutate({ userId: member.id, roleId }); event.target.value = ""; } }} disabled={assigning}><option value="">Choisir…</option>{roles.map((role) => <option key={role.id} value={role.id}>{role.name}</option>)}</select></TableCell></TableRow>;
          })}
        </TableBody></Table></div>{users.length === 0 ? <p className="py-8 text-center text-sm text-muted-foreground">Aucun utilisateur disponible.</p> : null}</CardContent>
      </Card>
    </div>
  );
}
