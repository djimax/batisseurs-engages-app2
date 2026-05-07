import { useState } from "react";
import { ExportPDF } from "@/components/ExportPDF";
import { HeroSection } from "@/components/HeroSection";
import { Pagination } from "@/components/Pagination";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
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
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { 
  Users, 
  Plus, 
  Search,
  MoreVertical,
  Trash2,
  Edit,
  Mail,
  Phone,
  UserCircle,
  Loader2,
  Shield,
  Lock
} from "lucide-react";

const MEMBER_ROLES = [
  { value: "admin", label: "Admin", description: "Accès complet à tous les documents" },
  { value: "president", label: "Président", description: "Président de l'association" },
  { value: "secretary_general", label: "Secrétaire Général", description: "Secrétaire général" },
  { value: "secretary_general_adjoint", label: "Secrétaire Général Adjoint", description: "Secrétaire général adjoint" },
  { value: "treasurer_general", label: "Trésorier Général", description: "Trésorier général" },
  { value: "treasurer_general_adjoint", label: "Trésorier Général Adjoint", description: "Trésorier général adjoint" },
  { value: "secretary", label: "Secrétaire", description: "Peut créer et modifier les documents" },
  { value: "member", label: "Membre", description: "Accès en lecture seule" },
];

const SORT_OPTIONS = [
  { value: "name-asc", label: "Nom (A-Z)" },
  { value: "name-desc", label: "Nom (Z-A)" },
  { value: "date-newest", label: "Plus recents" },
  { value: "date-oldest", label: "Plus anciens" },
  { value: "status-active", label: "Statut (Actifs d'abord)" },
];

export default function Members() {
  const utils = trpc.useUtils();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<string>("name-asc");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<any>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    role: "Membre",
    function: "",
    status: "active" as "active" | "inactive" | "pending",
    memberRole: "member" as "admin" | "secretary" | "member",
  });

  const { data: members, isLoading } = trpc.members.list.useQuery();
  const { data: exportData } = trpc.members.exportList.useQuery();

  const createMember = trpc.members.create.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      setIsCreateDialogOpen(false);
      resetForm();
      toast.success("Membre ajouté avec succès");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const updateMember = trpc.members.update.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      setIsEditDialogOpen(false);
      setSelectedMember(null);
      resetForm();
      toast.success("Membre mis à jour");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const deleteMember = trpc.members.delete.useMutation({
    onSuccess: () => {
      utils.members.list.invalidate();
      toast.success("Membre supprimé");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  const resetForm = () => {
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      role: "Membre",
      function: "",
      status: "active",
      memberRole: "member",
    });
  };

  const handleCreate = () => {
    if (!formData.firstName || !formData.lastName) {
      toast.error("Le prénom et le nom sont obligatoires");
      return;
    }
    createMember.mutate(formData);
  };

  const handleEdit = () => {
    if (!selectedMember) return;
    updateMember.mutate({
      id: selectedMember.id,
      ...formData,
    });
  };

  const openEditDialog = (member: any) => {
    setSelectedMember(member);
    setFormData({
      firstName: member.firstName,
      lastName: member.lastName,
      email: member.email || "",
      phone: member.phone || "",
      role: member.role || "Membre",
      function: member.function || "",
      status: member.status,
      memberRole: member.memberRole || "member",
    });
    setIsEditDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300">Actif</Badge>;
      case "inactive":
        return <Badge className="bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300">Inactif</Badge>;
      case "pending":
        return <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-300">En attente</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const filteredMembers = (members?.filter(member => {
    const searchLower = searchTerm.toLowerCase();
    return (
      member.firstName.toLowerCase().includes(searchLower) ||
      member.lastName.toLowerCase().includes(searchLower) ||
      (member.email && member.email.toLowerCase().includes(searchLower)) ||
      (member.role && member.role.toLowerCase().includes(searchLower))
    );
  }) || []).sort((a, b) => {
    switch (sortBy) {
      case "name-asc":
        return `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`);
      case "name-desc":
        return `${b.firstName} ${b.lastName}`.localeCompare(`${a.firstName} ${a.lastName}`);
      case "date-newest":
        return new Date(b.joinedAt).getTime() - new Date(a.joinedAt).getTime();
      case "date-oldest":
        return new Date(a.joinedAt).getTime() - new Date(b.joinedAt).getTime();
      case "status-active":
        return (a.status === "active" ? -1 : 1) - (b.status === "active" ? -1 : 1);
      default:
        return 0;
    }
  });

  const stats = {
    total: members?.length || 0,
    active: members?.filter(m => m.status === "active").length || 0,
    inactive: members?.filter(m => m.status === "inactive").length || 0,
    pending: members?.filter(m => m.status === "pending").length || 0,
  };

    return (
    <div className="space-y-6">
      {/* Hero Section */}
      <HeroSection
        title="Gestion des Membres"
        subtitle="Organisez et gérez tous les membres de votre association"
        icon="👥"
        variant="accent"
        action={{
          label: "Ajouter un nouveau membre",
          onClick: () => setIsCreateDialogOpen(true),
        }}
      />

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Liste des Membres</h1>
          <p className="text-muted-foreground">
            {stats.total} membre(s) au total
          </p>
        </div>
        <div className="flex gap-2">
          {exportData && (
            <ExportPDF 
              title="Liste des Membres" 
              data={exportData} 
              type="members" 
            />
          )}
          <Button onClick={() => setIsCreateDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Ajouter un membre
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Inactifs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-slate-500">{stats.inactive}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Sort */}
      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher un membre..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Trier par</label>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger>
                  <SelectValue placeholder="Trier par..." />
                </SelectTrigger>
                <SelectContent>
                  {SORT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Members Table */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des membres</CardTitle>
          <CardDescription>{filteredMembers.length} membre(s) trouvé(s)</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-3 w-1/4" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredMembers.length > 0 ? (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Membre</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMembers.map((member) => (
                    <TableRow key={member.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <Avatar className="h-9 w-9">
                            <AvatarFallback className="bg-primary/10 text-primary text-sm">
                              {member.firstName.charAt(0)}{member.lastName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{member.firstName} {member.lastName}</p>
                            {member.function && (
                              <p className="text-sm text-muted-foreground">{member.function}</p>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{member.role || "Membre"}</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          {member.email && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Mail className="h-3 w-3" />
                              {member.email}
                            </div>
                          )}
                          {member.phone && (
                            <div className="flex items-center gap-1 text-sm text-muted-foreground">
                              <Phone className="h-3 w-3" />
                              {member.phone}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getStatusBadge(member.status)}</TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openEditDialog(member)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-destructive"
                              onClick={() => {
                                if (confirm("Êtes-vous sûr de vouloir supprimer ce membre ?")) {
                                  deleteMember.mutate({ id: member.id });
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredMembers.length / itemsPerPage)}
                itemsPerPage={itemsPerPage}
                totalItems={filteredMembers.length}
                onPageChange={setCurrentPage}
                onItemsPerPageChange={setItemsPerPage}
              />
            </div>
          ) : (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
              <h3 className="text-lg font-medium mb-2">Aucun membre</h3>
              <p className="text-muted-foreground mb-4">
                {searchTerm ? "Aucun membre ne correspond à votre recherche" : "Commencez par ajouter des membres"}
              </p>
              <Button onClick={() => setIsCreateDialogOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Ajouter un membre
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Member Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Ajouter un membre</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau membre à votre association
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                  placeholder="Prénom"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                  placeholder="Nom"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="email@exemple.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 00 00 00 00"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="role">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Membre">Membre</SelectItem>
                    <SelectItem value="Président">Président</SelectItem>
                    <SelectItem value="Vice-Président">Vice-Président</SelectItem>
                    <SelectItem value="Secrétaire Général">Secrétaire Général</SelectItem>
                    <SelectItem value="Trésorier">Trésorier</SelectItem>
                    <SelectItem value="Conseiller">Conseiller</SelectItem>
                    <SelectItem value="Bénévole">Bénévole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="function">Fonction</Label>
              <Input
                id="function"
                value={formData.function}
                onChange={(e) => setFormData({ ...formData, function: e.target.value })}
                placeholder="Ex: Responsable communication"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreate} disabled={createMember.isPending}>
              {createMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Plus className="mr-2 h-4 w-4" />
              )}
              Ajouter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Member Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier le membre</DialogTitle>
            <DialogDescription>
              Modifiez les informations du membre
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">Prénom *</Label>
                <Input
                  id="editFirstName"
                  value={formData.firstName}
                  onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Nom *</Label>
                <Input
                  id="editLastName"
                  value={formData.lastName}
                  onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editEmail">Email</Label>
              <Input
                id="editEmail"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="editPhone">Téléphone</Label>
              <Input
                id="editPhone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="editRole">Rôle</Label>
                <Select 
                  value={formData.role} 
                  onValueChange={(v) => setFormData({ ...formData, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Membre">Membre</SelectItem>
                    <SelectItem value="Président">Président</SelectItem>
                    <SelectItem value="Vice-Président">Vice-Président</SelectItem>
                    <SelectItem value="Secrétaire Général">Secrétaire Général</SelectItem>
                    <SelectItem value="Trésorier">Trésorier</SelectItem>
                    <SelectItem value="Conseiller">Conseiller</SelectItem>
                    <SelectItem value="Bénévole">Bénévole</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Statut</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v: any) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Actif</SelectItem>
                    <SelectItem value="inactive">Inactif</SelectItem>
                    <SelectItem value="pending">En attente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="editFunction">Fonction</Label>
              <Input
                id="editFunction"
                value={formData.function}
                onChange={(e) => setFormData({ ...formData, function: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={handleEdit} disabled={updateMember.isPending}>
              {updateMember.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Edit className="mr-2 h-4 w-4" />
              )}
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
