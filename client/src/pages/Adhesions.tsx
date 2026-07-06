import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, User, Calendar, AlertCircle, CheckCircle, Clock, Search, X } from "lucide-react";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { AmountDisplay } from "@/components/AmountDisplay";
import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";

export default function Adhesions() {
  const { formatAmountWithConversion } = useFormatAmount();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [memberSearchQuery, setMemberSearchQuery] = useState("");
  const [formData, setFormData] = useState({
    memberId: "",
    annee: new Date().getFullYear().toString(),
    montant: "50",
    dateAdhesion: new Date().toISOString().split('T')[0],
    dateExpiration: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
  });
  
  // Récupérer la liste des membres
  const { data: members = [] } = trpc.members.list.useQuery();
  const utils = trpc.useUtils();
  
  // Filtrer les membres selon la recherche
  const filteredMembers = useMemo(() => {
    return members.filter(m => 
      `${m.firstName} ${m.lastName}`.toLowerCase().includes(memberSearchQuery.toLowerCase())
    );
  }, [members, memberSearchQuery]);

  // Mutation pour créer une adhésion
  const createAdhesion = trpc.membersAdhesions.createAdhesion.useMutation({
    onSuccess: () => {
      utils.membersAdhesions.listWithMembers.invalidate();
      setFormData({
        memberId: "",
        annee: new Date().getFullYear().toString(),
        montant: "50",
        dateAdhesion: new Date().toISOString().split('T')[0],
        dateExpiration: new Date(new Date().getFullYear() + 1, 11, 31).toISOString().split('T')[0],
      });
      setIsOpen(false);
      toast.success("Adhésion créée avec succès");
    },
    onError: (error) => {
      toast.error("Erreur: " + error.message);
    },
  });

  // Placeholder data
  const adhesions = [
    {
      id: 1,
      memberName: "Jean Dupont",
      annee: 2025,
      montant: "50",
      dateAdhesion: new Date("2025-01-15"),
      dateExpiration: new Date("2025-12-31"),
      status: "active",
      daysLeft: 320,
    },
    {
      id: 2,
      memberName: "Marie Martin",
      annee: 2025,
      montant: "50",
      dateAdhesion: new Date("2025-01-10"),
      dateExpiration: new Date("2025-12-31"),
      status: "active",
      daysLeft: 325,
    },
    {
      id: 3,
      memberName: "Pierre Bernard",
      annee: 2024,
      montant: "50",
      dateAdhesion: new Date("2024-01-15"),
      dateExpiration: new Date("2024-12-31"),
      status: "expired",
      daysLeft: -17,
    },
  ];

  const handleSubmit = () => {
    if (!formData.memberId || !formData.montant) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    
    createAdhesion.mutate({
      memberId: parseInt(formData.memberId),
      annee: parseInt(formData.annee),
      montant: formData.montant,
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "expired":
        return "Expirée";
      case "pending":
        return "En attente";
      default:
        return status;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4" />;
      case "expired":
        return <AlertCircle className="h-4 w-4" />;
      case "pending":
        return <Clock className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const stats = {
    total: adhesions.length,
    active: adhesions.filter(a => a.status === "active").length,
    expired: adhesions.filter(a => a.status === "expired").length,
    totalCollected: adhesions.reduce((sum, a) => sum + parseInt(a.montant), 0),
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Adhésions Annuelles</h1>
          <p className="text-muted-foreground mt-2">
            Gérez les adhésions des membres de l'association
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Adhésion
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Adhésions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground mt-1">Tous les membres</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">En cours</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Expirées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
            <p className="text-xs text-muted-foreground mt-1">À renouveler</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={stats.totalCollected} sourceCurrency="EUR" /></div>
            <p className="text-xs text-muted-foreground mt-1">Adhésions</p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <div className="space-y-4">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher par nom de membre..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-3 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        <div className="flex gap-2 flex-wrap">
          <Select value={selectedYear} onValueChange={setSelectedYear}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2025">2025</SelectItem>
              <SelectItem value="2026">2026</SelectItem>
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="active">Actives</SelectItem>
              <SelectItem value="expired">Expirées</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Adhesions List */}
      <div className="space-y-3">
        {adhesions
          .filter(a => a.annee.toString() === selectedYear)
          .filter(a => statusFilter === "all" || a.status === statusFilter)
          .filter(a => a.memberName.toLowerCase().includes(searchQuery.toLowerCase()))
          .map((adhesion) => (
          <Card key={adhesion.id} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4 flex-1">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold">{adhesion.memberName}</h3>
                    <p className="text-sm text-muted-foreground">
                      Adhésion {adhesion.annee}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="font-semibold text-lg"><AmountDisplay amount={parseFloat(adhesion.montant || "0")} sourceCurrency="EUR" /></p>
                    <p className="text-xs text-muted-foreground">Montant</p>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold">{Math.max(0, adhesion.daysLeft)} jours</p>
                    <p className="text-xs text-muted-foreground">
                      {adhesion.status === "expired" ? "Expirée" : "Avant expiration"}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge className={`${getStatusColor(adhesion.status)} flex items-center gap-1`}>
                      {getStatusIcon(adhesion.status)}
                      {getStatusLabel(adhesion.status)}
                    </Badge>
                  </div>

                  <Button variant="outline" size="sm">
                    Détails
                  </Button>
                </div>
              </div>

              <div className="mt-4 pt-4 border-t flex gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Début: {adhesion.dateAdhesion.toLocaleDateString('fr-FR')}
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  Fin: {adhesion.dateExpiration.toLocaleDateString('fr-FR')}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for Creating Adhesion */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle adhésion</DialogTitle>
            <DialogDescription>
              Créez une nouvelle adhésion pour un membre
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Membre *</label>
              <Select value={formData.memberId} onValueChange={(value) =>
                setFormData({ ...formData, memberId: value })
              }>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un membre" />
                </SelectTrigger>
                <SelectContent className="max-h-96 overflow-y-auto">
                  {members.length === 0 ? (
                    <div className="p-2 text-sm text-muted-foreground">Aucun membre trouvé</div>
                  ) : (
                    members.map((member) => (
                      <SelectItem key={member.id} value={member.id.toString()}>
                        {member.firstName} {member.lastName} ({member.memberId})
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Année *</label>
                <Input
                  type="number"
                  value={formData.annee}
                  onChange={(e) =>
                    setFormData({ ...formData, annee: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Montant (F) *</label>
                <Input
                  type="number"
                  value={formData.montant}
                  onChange={(e) =>
                    setFormData({ ...formData, montant: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date d'adhésion</label>
                <Input
                  type="date"
                  value={formData.dateAdhesion}
                  onChange={(e) =>
                    setFormData({ ...formData, dateAdhesion: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date d'expiration</label>
                <Input
                  type="date"
                  value={formData.dateExpiration}
                  onChange={(e) =>
                    setFormData({ ...formData, dateExpiration: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex gap-3 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setIsOpen(false)}
              >
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleSubmit}>
                Créer
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
