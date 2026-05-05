import { useState, useEffect } from "react";
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
import { Plus, Edit2, Trash2, Eye, EyeOff, Copy, Check } from "lucide-react";
import { toast } from "sonner";

interface User {
  id: number;
  email: string;
  fullName?: string;
  role: "admin" | "membre";
  isActive: boolean;
  password?: string;
  createdAt: string;
}

// Données d'exemple
const SAMPLE_USERS: User[] = [
  {
    id: 1,
    email: "admin@batisseurs-engages.fr",
    fullName: "Administrateur",
    role: "admin",
    isActive: true,
    password: "Admin123!",
    createdAt: new Date("2025-01-01").toISOString(),
  },
  {
    id: 2,
    email: "marie.dupont@batisseurs-engages.fr",
    fullName: "Marie Dupont",
    role: "membre",
    isActive: true,
    password: "Marie123!",
    createdAt: new Date("2025-01-15").toISOString(),
  },
  {
    id: 3,
    email: "jean.martin@batisseurs-engages.fr",
    fullName: "Jean Martin",
    role: "membre",
    isActive: true,
    password: "Jean123!",
    createdAt: new Date("2025-01-20").toISOString(),
  },
];

const STORAGE_KEY = "batisseurs_users";

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>(SAMPLE_USERS);
  const [searchTerm, setSearchTerm] = useState("");
  const [showPassword, setShowPassword] = useState<Record<number, boolean>>({});
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [newUser, setNewUser] = useState({
    email: "",
    fullName: "",
    role: "membre" as const,
  });
  const [editingRoleUserId, setEditingRoleUserId] = useState<number | null>(null);
  const [editingRole, setEditingRole] = useState<"admin" | "membre">("membre");

  // Charger les utilisateurs depuis localStorage au montage
  useEffect(() => {
    const savedUsers = localStorage.getItem(STORAGE_KEY);
    if (savedUsers) {
      try {
        setUsers(JSON.parse(savedUsers));
      } catch (error) {
        console.error("Erreur lors du chargement des utilisateurs:", error);
      }
    }
  }, []);

  // Sauvegarder les utilisateurs dans localStorage à chaque changement
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
  }, [users]);

  const filteredUsers = users.filter(
    (user) =>
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.fullName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const generatePassword = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%";
    let password = "";
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
  };

  const handleAddUser = () => {
    if (!newUser.email || !newUser.fullName) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }

    // Valider le format de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newUser.email)) {
      toast.error("Veuillez entrer une adresse email valide");
      return;
    }

    if (users.some((u) => u.email === newUser.email)) {
      toast.error("Cet email existe déjà");
      return;
    }

    const password = generatePassword();
    const user: User = {
      id: Math.max(...users.map((u) => u.id), 0) + 1,
      ...newUser,
      password,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    setUsers([...users, user]);
    setNewUser({ email: "", fullName: "", role: "membre" });
    toast.success(`Utilisateur créé avec succès. Mot de passe: ${password}`);
  };

  const handleDeleteUser = (id: number) => {
    if (id === 1) {
      toast.error("Vous ne pouvez pas supprimer l'administrateur principal");
      return;
    }

    setUsers(users.filter((u) => u.id !== id));
    toast.success("Utilisateur supprimé");
  };

  const handleToggleActive = (id: number) => {
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, isActive: !u.isActive } : u
      )
    );
    toast.success("Statut mis à jour");
  };

  const handleChangeRole = (id: number, newRole: "admin" | "membre") => {
    // Vérifier qu'il y a au moins un administrateur
    const adminCount = users.filter((u) => u.role === "admin").length;
    const userToChange = users.find((u) => u.id === id);

    if (userToChange?.role === "admin" && newRole === "membre" && adminCount === 1) {
      toast.error("Il doit y avoir au moins un administrateur");
      return;
    }

    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, role: newRole } : u
      )
    );
    setEditingRoleUserId(null);
    toast.success(`Rôle changé en ${newRole === "admin" ? "Administrateur" : "Membre"}`);
  };

  const handleResetPassword = (id: number) => {
    const newPassword = generatePassword();
    setUsers(
      users.map((u) =>
        u.id === id ? { ...u, password: newPassword } : u
      )
    );
    toast.success(`Nouveau mot de passe: ${newPassword}`);
  };

  const copyToClipboard = (text: string, id: number) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Copié dans le presse-papiers");
  };

  const getRoleBadgeColor = (role: string) => {
    return role === "admin" ? "destructive" : "secondary";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Gestion des Utilisateurs</h1>
          <p className="text-muted-foreground">
            Gérez les identifiants (emails) et mots de passe des membres du bureau exécutif
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Nouvel utilisateur
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Créer un nouvel utilisateur</DialogTitle>
              <DialogDescription>
                Remplissez les informations pour créer un nouvel utilisateur
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Email (Identifiant) *</label>
                <Input
                  type="email"
                  placeholder="Ex: marie@batisseurs-engages.fr"
                  value={newUser.email}
                  onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nom complet *</label>
                <Input
                  placeholder="Ex: Marie Dupont"
                  value={newUser.fullName}
                  onChange={(e) => setNewUser({ ...newUser, fullName: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium">Rôle</label>
                <Select value={newUser.role} onValueChange={(value: any) => setNewUser({ ...newUser, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrateur</SelectItem>
                    <SelectItem value="membre">Membre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button onClick={handleAddUser} className="w-full">
                Créer l'utilisateur
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Search */}
      <Input
        placeholder="Rechercher par email ou nom..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
      />

      {/* Users Table */}
      {filteredUsers.length === 0 ? (
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
                  <th className="px-4 py-3 text-left text-sm font-medium">Email (Identifiant)</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Nom</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Rôle</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Statut</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-muted/50">
                    <td className="px-4 py-3 text-sm font-medium">{user.email}</td>
                    <td className="px-4 py-3 text-sm">{user.fullName || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={getRoleBadgeColor(user.role)}>
                        {user.role === "admin" ? "Admin" : "Membre"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <Badge variant={user.isActive ? "default" : "outline"}>
                        {user.isActive ? "Actif" : "Inactif"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex gap-2">
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="ghost" size="sm" title="Voir le mot de passe">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Détails de {user.email}</DialogTitle>
                              <DialogDescription>
                                Informations et mot de passe de l'utilisateur
                              </DialogDescription>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <label className="text-sm font-medium">Mot de passe actuel</label>
                                <div className="flex gap-2">
                                  <Input
                                    type={showPassword[user.id] ? "text" : "password"}
                                    value={user.password || ""}
                                    readOnly
                                  />
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setShowPassword({ ...showPassword, [user.id]: !showPassword[user.id] })}
                                  >
                                    {showPassword[user.id] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => copyToClipboard(user.password || "", user.id)}
                                  >
                                    {copiedId === user.id ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                  </Button>
                                </div>
                              </div>
                              <Button onClick={() => handleResetPassword(user.id)} className="w-full">
                                Générer un nouveau mot de passe
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Dialog open={editingRoleUserId === user.id} onOpenChange={(open) => {
                          if (!open) setEditingRoleUserId(null);
                        }}>
                          <DialogTrigger asChild>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                setEditingRoleUserId(user.id);
                                setEditingRole(user.role);
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
                                <label className="text-sm font-medium">Rôle actuel: {user.role === "admin" ? "Administrateur" : "Membre"}</label>
                                <Select value={editingRole} onValueChange={(value: any) => setEditingRole(value)}>
                                  <SelectTrigger>
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="admin">Administrateur</SelectItem>
                                    <SelectItem value="membre">Membre</SelectItem>
                                  </SelectContent>
                                </Select>
                              </div>
                              <Button
                                onClick={() => handleChangeRole(user.id, editingRole)}
                                className="w-full"
                              >
                                Confirmer le changement
                              </Button>
                            </div>
                          </DialogContent>
                        </Dialog>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleToggleActive(user.id)}
                          title={user.isActive ? "Désactiver" : "Activer"}
                        >
                          {user.isActive ? "✓" : "✗"}
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteUser(user.id)}
                          title="Supprimer"
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
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
          <CardTitle className="text-base">💾 Sauvegarde Automatique</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">
          Tous les utilisateurs sont automatiquement sauvegardés dans votre navigateur. 
          Les données persisteront même après fermeture de la page.
        </CardContent>
      </Card>

      {/* Help Card */}
      <Card className="bg-amber-50 dark:bg-amber-950 border-amber-200 dark:border-amber-900">
        <CardHeader>
          <CardTitle className="text-base">📧 Réinitialisation de Mot de Passe</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800 dark:text-amber-200">
          Lorsqu'un utilisateur oublie son mot de passe, il peut cliquer sur "Réinitialiser" 
          sur la page de connexion. Une demande sera envoyée à <strong>contact.lesbatisseursengages@gmail.com</strong> 
          pour générer un nouveau mot de passe.
        </CardContent>
      </Card>
    </div>
  );
}
