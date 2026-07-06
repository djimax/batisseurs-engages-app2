import { useState, useMemo } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Download, Printer, Eye, Camera, CameraOff } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdhesionCard } from "@/components/AdhesionCard";
import { MemberProfileModal } from "@/components/MemberProfileModal";

export default function AdhesionsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showCardDialog, setShowCardDialog] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);

  // Récupérer les adhésions avec les détails des membres
  const { data: adhesions = [], isLoading, refetch } = trpc.membersAdhesions.listWithMembers.useQuery();

  // Filtrer les adhésions
  const filteredAdhesions = useMemo(() => {
    return adhesions.filter((adhesion: any) => {
      const memberName = `${adhesion.member.firstName} ${adhesion.member.lastName}`.toLowerCase();
      const matchesSearch = memberName.includes(searchQuery.toLowerCase()) ||
        adhesion.member.memberId?.includes(searchQuery);

      const matchesStatus = statusFilter === "all" || adhesion.status === statusFilter;

      const matchesYear = yearFilter === "all" || adhesion.annee.toString() === yearFilter;

      const matchesRole = roleFilter === "all" || adhesion.member.role === roleFilter;

      return matchesSearch && matchesStatus && matchesYear && matchesRole;
    });
  }, [adhesions, searchQuery, statusFilter, yearFilter, roleFilter]);

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

  const handlePrintCard = (memberId: number) => {
    setSelectedMemberId(memberId);
    setShowCardDialog(true);
    setTimeout(() => {
      window.print();
    }, 500);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-muted-foreground">Chargement...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold">Liste des Adhésions</h1>
        <p className="text-muted-foreground mt-2">
          Gérez et consultez les adhésions de votre association
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold">{adhesions.length}</div>
              <p className="text-sm text-muted-foreground mt-1">Total adhésions</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-green-600">
                {adhesions.filter((a: any) => a.status === "active").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Actives</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-yellow-600">
                {adhesions.filter((a: any) => a.status === "pending").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">En attente</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-red-600">
                {adhesions.filter((a: any) => a.status === "expired").length}
              </div>
              <p className="text-sm text-muted-foreground mt-1">Expirées</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Recherche et Filtres</CardTitle>
          <CardDescription>Trouvez rapidement un adhérent par son ID, nom ou rôle</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Barre de recherche principale */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom, prénom ou ID d'adhérent..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10"
              />
            </div>

            {/* Filtres */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Filtre Statut */}
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="expired">Expirée</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Année */}
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2025">2025</SelectItem>
                  <SelectItem value="2026">2026</SelectItem>
                </SelectContent>
              </Select>

              {/* Filtre Rôle */}
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Rôle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous les rôles</SelectItem>
                  <SelectItem value="Membre">Membre</SelectItem>
                  <SelectItem value="Président">Président</SelectItem>
                  <SelectItem value="Vice-Président">Vice-Président</SelectItem>
                  <SelectItem value="Secrétaire Général">Secrétaire Général</SelectItem>
                  <SelectItem value="Trésorier">Trésorier</SelectItem>
                  <SelectItem value="Conseiller">Conseiller</SelectItem>
                  <SelectItem value="Bénévole">Bénévole</SelectItem>
                </SelectContent>
              </Select>

              {/* Actions */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-2 flex-1"
                  onClick={() => refetch()}
                  title="Rafraîchir la liste"
                >
                  🔄
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1" title="Exporter en CSV">
                  <Download className="h-4 w-4" />
                </Button>
                <Button variant="outline" size="sm" className="gap-2 flex-1" title="Imprimer">
                  <Printer className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Résumé des filtres actifs */}
            {(searchQuery || statusFilter !== "all" || yearFilter !== "all" || roleFilter !== "all") && (
              <div className="flex flex-wrap gap-2 items-center text-sm text-muted-foreground pt-2 border-t">
                <span className="font-medium">Filtres actifs:</span>
                {searchQuery && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setSearchQuery("")}>
                    Recherche: {searchQuery} ✕
                  </Badge>
                )}
                {statusFilter !== "all" && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setStatusFilter("all")}>
                    Statut: {statusFilter} ✕
                  </Badge>
                )}
                {yearFilter !== "all" && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setYearFilter("all")}>
                    Année: {yearFilter} ✕
                  </Badge>
                )}
                {roleFilter !== "all" && (
                  <Badge variant="secondary" className="cursor-pointer" onClick={() => setRoleFilter("all")}>
                    Rôle: {roleFilter} ✕
                  </Badge>
                )}
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setYearFilter("all");
                    setRoleFilter("all");
                  }}
                  className="ml-auto text-xs"
                >
                  Réinitialiser tous les filtres
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardContent className="pt-6">
          {filteredAdhesions.length > 0 ? (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID Adhérent</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdhesions.map((adhesion: any) => (
                    <TableRow 
                      key={adhesion.id}
                      className="cursor-pointer hover:bg-muted/50 transition-colors"
                      onClick={() => {
                        setSelectedMemberId(adhesion.member.id);
                        setShowProfileModal(true);
                      }}
                    >
                      <TableCell className="font-mono text-sm">
                        <div className="flex items-center gap-2">
                          {adhesion.member.photo ? (
                            <div className="relative group">
                              <Camera className="h-4 w-4 text-green-600" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Photo présente</span>
                            </div>
                          ) : (
                            <div className="relative group">
                              <CameraOff className="h-4 w-4 text-red-600" />
                              <span className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">Pas de photo</span>
                            </div>
                          )}
                          {adhesion.member.memberId}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{adhesion.member.firstName} {adhesion.member.lastName}</p>
                          <p className="text-sm text-muted-foreground">{adhesion.member.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{adhesion.member.role}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(adhesion.status)}>
                          {getStatusLabel(adhesion.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{adhesion.annee}</TableCell>
                      <TableCell>{adhesion.montant}€</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                              setSelectedMemberId(adhesion.member.id);
                              setShowCardDialog(true);
                            }}
                            title="Voir la carte"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePrintCard(adhesion.member.id)}
                            title="Imprimer la carte"
                          >
                            <Printer className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">
                {searchQuery || statusFilter !== "all" || yearFilter !== "all" || roleFilter !== "all"
                  ? "Aucun adhérent ne correspond à vos critères de recherche"
                  : "Aucune adhésion trouvée"}
              </p>
              {(searchQuery || statusFilter !== "all" || yearFilter !== "all" || roleFilter !== "all") && (
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setYearFilter("all");
                    setRoleFilter("all");
                  }}
                >
                  Réinitialiser les filtres
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog Carte d'adhésion */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Carte d'adhésion</DialogTitle>
            <DialogDescription>
              Aperçu et impression de la carte d'adhésion
            </DialogDescription>
          </DialogHeader>
          {selectedMemberId && adhesions.find((a: any) => a.member.id === selectedMemberId) && (
            <AdhesionCard member={{
              id: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.id,
              firstName: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.firstName,
              lastName: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.lastName,
              memberID: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.memberId,
              photo: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.photo || undefined,
              email: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.email || undefined
            }} />
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Profil Détaillé */}
      {selectedMemberId && adhesions.find((a: any) => a.member.id === selectedMemberId) && (
        <MemberProfileModal
          open={showProfileModal}
          onOpenChange={setShowProfileModal}
          member={{
            id: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.id,
            firstName: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.firstName,
            lastName: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.lastName,
            memberID: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.memberId,
            photo: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.photo || undefined,
            email: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.email || undefined,
            phone: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.phone || undefined,
            role: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.role || undefined,
            function: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.function || undefined,
            status: adhesions.find((a: any) => a.member.id === selectedMemberId)!.member.status || undefined,
          }}
          adhesion={{
            id: adhesions.find((a: any) => a.member.id === selectedMemberId)!.id,
            annee: adhesions.find((a: any) => a.member.id === selectedMemberId)!.annee || new Date().getFullYear(),
            montant: Number(adhesions.find((a: any) => a.member.id === selectedMemberId)!.montant) || 0,
            status: adhesions.find((a: any) => a.member.id === selectedMemberId)!.status || undefined,
            dateExpiration: adhesions.find((a: any) => a.member.id === selectedMemberId)!.dateExpiration || undefined,
          }}
        />
      )}
    </div>
  );
}
