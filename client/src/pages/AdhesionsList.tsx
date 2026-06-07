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
import { Search, Download, Printer, Eye } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AdhesionCard } from "@/components/AdhesionCard";

export default function AdhesionsList() {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState("all");
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [showCardDialog, setShowCardDialog] = useState(false);

  // Récupérer les adhésions avec les détails des membres
  const { data: adhesions = [], isLoading, refetch } = trpc.membersAdhesions.listWithMembers.useQuery();

  // Filtrer les adhésions
  const filteredAdhesions = useMemo(() => {
    return adhesions.filter((adhesion: any) => {
      const memberName = `${adhesion.member.firstName} ${adhesion.member.lastName}`.toLowerCase();
      const matchesSearch = memberName.includes(searchQuery.toLowerCase()) ||
        adhesion.member.memberID?.includes(searchQuery);

      const matchesStatus = statusFilter === "all" || adhesion.status === statusFilter;

      const matchesYear = yearFilter === "all" || adhesion.annee.toString() === yearFilter;

      return matchesSearch && matchesStatus && matchesYear;
    });
  }, [adhesions, searchQuery, statusFilter, yearFilter]);

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

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("fr-FR");
  };

  const handleViewCard = (memberId: number) => {
    setSelectedMemberId(memberId);
    setShowCardDialog(true);
  };

  const selectedAdhesion = selectedMemberId
    ? adhesions.find((a: any) => a.member.id === selectedMemberId)
    : null;

  // Statistiques
  const stats = {
    total: adhesions.length,
    active: adhesions.filter((a: any) => a.status === "active").length,
    expired: adhesions.filter((a: any) => a.status === "expired").length,
    pending: adhesions.filter((a: any) => a.status === "pending").length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Liste des Adhérents</h1>
        <p className="text-muted-foreground mt-2">
          Gérez et consultez les adhésions de vos membres
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Expirées</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.expired}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{stats.pending}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filtres */}
      <Card>
        <CardHeader>
          <CardTitle>Filtres</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Recherche */}
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher par nom ou ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>

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

            {/* Actions */}
            <div className="flex gap-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-2"
                onClick={() => refetch()}
              >
                🔄 Rafraîchir
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Download className="h-4 w-4" />
                Exporter
              </Button>
              <Button variant="outline" size="sm" className="gap-2">
                <Printer className="h-4 w-4" />
                Imprimer
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tableau */}
      <Card>
        <CardHeader>
          <CardTitle>
            Adhésions ({filteredAdhesions.length}/{adhesions.length})
          </CardTitle>
          <CardDescription>
            Liste complète des adhérents et leurs informations d'adhésion
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Chargement...</p>
            </div>
          ) : filteredAdhesions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Aucune adhésion trouvée</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom</TableHead>
                    <TableHead>ID Membre</TableHead>
                    <TableHead>Année</TableHead>
                    <TableHead>Date d'adhésion</TableHead>
                    <TableHead>Date d'expiration</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Montant</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAdhesions.map((adhesion: any) => (
                    <TableRow key={adhesion.id}>
                      <TableCell className="font-medium">
                        {adhesion.member.firstName} {adhesion.member.lastName}
                      </TableCell>
                      <TableCell className="font-mono text-sm">
                        {adhesion.member.memberID}
                      </TableCell>
                      <TableCell>{adhesion.annee}</TableCell>
                      <TableCell>{formatDate(adhesion.dateAdhesion)}</TableCell>
                      <TableCell>{formatDate(adhesion.dateExpiration)}</TableCell>
                      <TableCell>
                        <Badge className={getStatusColor(adhesion.status)}>
                          {getStatusLabel(adhesion.status)}
                        </Badge>
                      </TableCell>
                      <TableCell>{adhesion.montant} F</TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewCard(adhesion.member.id)}
                          className="gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Carte
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog - Carte d'adhésion */}
      <Dialog open={showCardDialog} onOpenChange={setShowCardDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Carte d'Adhésion</DialogTitle>
            <DialogDescription>
              Aperçu et impression de la carte d'adhésion
            </DialogDescription>
          </DialogHeader>
          {selectedAdhesion && (
            <AdhesionCard
              member={{
                id: selectedAdhesion.member.id,
                firstName: selectedAdhesion.member.firstName,
                lastName: selectedAdhesion.member.lastName,
                memberID: selectedAdhesion.member.memberID || "",
                photo: selectedAdhesion.member.photo || undefined,
                email: selectedAdhesion.member.email || undefined,
              }}
              adhesion={{
                dateExpiration: selectedAdhesion.dateExpiration,
                annee: selectedAdhesion.annee || new Date().getFullYear(),
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
