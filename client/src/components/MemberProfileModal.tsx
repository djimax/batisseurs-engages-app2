import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin, Calendar, User, Edit, Trash2 } from "lucide-react";

interface MemberProfileModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member: {
    id: number;
    firstName: string;
    lastName: string;
    memberID: string;
    photo?: string;
    email?: string;
    phone?: string;
    role?: string;
    function?: string;
    address?: string;
    status?: string;
  };
  adhesion?: {
    id: number;
    annee: number;
    montant: number;
    type?: string;
    status?: string;
    dateExpiration?: Date;
  };
  onEdit?: () => void;
  onDelete?: () => void;
}

export function MemberProfileModal({
  open,
  onOpenChange,
  member,
  adhesion,
  onEdit,
  onDelete,
}: MemberProfileModalProps) {
  const getStatusColor = (status?: string) => {
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

  const getStatusLabel = (status?: string) => {
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

  const expirationDate = adhesion?.dateExpiration
    ? new Date(adhesion.dateExpiration).toLocaleDateString("fr-FR")
    : "Non défini";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Profil de l'adhérent</DialogTitle>
          <DialogDescription>
            Informations complètes et détails d'adhésion
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Photo et Informations Principales */}
          <div className="flex gap-6">
            {/* Photo */}
            <div className="flex-shrink-0">
              {member.photo ? (
                <img
                  src={member.photo}
                  alt={`${member.firstName} ${member.lastName}`}
                  className="w-32 h-40 rounded-lg object-cover border-2 border-border shadow-md"
                />
              ) : (
                <div className="w-32 h-40 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                  <User className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
            </div>

            {/* Informations Principales */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-sm text-muted-foreground font-mono">
                  ID: {member.memberID}
                </p>
              </div>

              {/* Rôle et Fonction */}
              <div className="flex flex-wrap gap-2">
                {member.role && (
                  <Badge variant="default">{member.role}</Badge>
                )}
                {member.function && (
                  <Badge variant="outline">{member.function}</Badge>
                )}
              </div>

              {/* Statut */}
              {member.status && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Statut</p>
                  <Badge className={getStatusColor(member.status)}>
                    {member.status === "active" ? "Actif" : member.status === "inactive" ? "Inactif" : member.status}
                  </Badge>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-2">
                {onEdit && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onEdit}
                    className="gap-2"
                  >
                    <Edit className="h-4 w-4" />
                    Modifier
                  </Button>
                )}
                {onDelete && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={onDelete}
                    className="gap-2 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                    Supprimer
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Informations de Contact */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.email && (
                <div className="flex items-start gap-3">
                  <Mail className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <a
                      href={`mailto:${member.email}`}
                      className="text-sm hover:underline text-blue-600"
                    >
                      {member.email}
                    </a>
                  </div>
                </div>
              )}
              {member.phone && (
                <div className="flex items-start gap-3">
                  <Phone className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Téléphone</p>
                    <a
                      href={`tel:${member.phone}`}
                      className="text-sm hover:underline text-blue-600"
                    >
                      {member.phone}
                    </a>
                  </div>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                  <div>
                    <p className="text-xs text-muted-foreground">Adresse</p>
                    <p className="text-sm">{member.address}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Informations d'Adhésion */}
          {adhesion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Adhésion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Année</p>
                    <p className="text-sm font-semibold">{adhesion.annee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Montant</p>
                    <p className="text-sm font-semibold">{adhesion.montant}€</p>
                  </div>
                  {adhesion.type && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Type</p>
                      <p className="text-sm font-semibold capitalize">{adhesion.type}</p>
                    </div>
                  )}
                  {adhesion.status && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">Statut</p>
                      <Badge className={getStatusColor(adhesion.status)}>
                        {getStatusLabel(adhesion.status)}
                      </Badge>
                    </div>
                  )}
                </div>
                {adhesion.dateExpiration && (
                  <div className="flex items-start gap-3 pt-2 border-t">
                    <Calendar className="h-4 w-4 mt-1 text-muted-foreground flex-shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Valide jusqu'au</p>
                      <p className="text-sm font-semibold">{expirationDate}</p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
