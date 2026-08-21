import { useState, useRef } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Mail, Phone, MapPin, Calendar, User, Edit, Trash2, Upload, Download, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

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
  onPhotoUpdate?: (photoUrl: string) => void;
  onPhotoDelete?: () => void;
}

export function MemberProfileModal({
  open,
  onOpenChange,
  member,
  adhesion,
  onEdit,
  onDelete,
  onPhotoUpdate,
  onPhotoDelete,
}: MemberProfileModalProps) {
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const utils = trpc.useUtils();
  
  const uploadPhotoMutation = trpc.members.uploadPhoto.useMutation({
    onSuccess: (result) => {
      setPhotoPreview(null);
      onPhotoUpdate?.(result.photoUrl);
      utils.members.list.invalidate();
      utils.membersAdhesions.listWithMembers.invalidate();
    },
    onError: (error) => {
      alert("Erreur lors du téléchargement de la photo: " + error.message);
    },
  });

  const deletePhotoMutation = trpc.members.deletePhoto.useMutation({
    onSuccess: () => {
      setPhotoPreview(null);
      onPhotoDelete?.();
      utils.members.list.invalidate();
      utils.membersAdhesions.listWithMembers.invalidate();
    },
    onError: (error) => {
      alert("Erreur lors de la suppression de la photo: " + error.message);
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation de la taille (max 2MB)
    const MAX_FILE_SIZE = 2 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      const sizeMB = (file.size / 1024 / 1024).toFixed(2);
      alert(`La photo doit faire moins de 2 Mo. Taille actuelle: ${sizeMB} Mo`);
      return;
    }

    // Validation du type (JPG et PNG uniquement)
    const ALLOWED_TYPES = ["image/jpeg", "image/jpg", "image/png"];
    if (!ALLOWED_TYPES.includes(file.type)) {
      alert("Seuls les formats JPG et PNG sont acceptés");
      return;
    }

    // Validation de l'extension du fichier
    const fileName = file.name.toLowerCase();
    const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png"];
    const hasValidExtension = ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext));
    if (!hasValidExtension) {
      alert("Seuls les fichiers JPG et PNG sont acceptés");
      return;
    }

    setIsUploadingPhoto(true);
    try {
      // Lire le fichier en base64
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        
        // Utiliser la mutation tRPC uploadPhoto
        await uploadPhotoMutation.mutateAsync({
          memberId: member.id,
          photoData: base64,
          fileName: file.name,
        });
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error("Error uploading photo:", error);
      alert("Erreur lors du téléchargement de la photo");
    } finally {
      setIsUploadingPhoto(false);
    }
  };

  const handlePhotoDelete = async () => {
    if (!confirm("Êtes-vous sûr de vouloir supprimer cette photo ?")) return;

    try {
      await deletePhotoMutation.mutateAsync({
        memberId: member.id,
      });
    } catch (error) {
      console.error("Error deleting photo:", error);
      alert("Erreur lors de la suppression de la photo");
    }
  };

  const handleDownloadPhoto = () => {
    const photoUrl = member.photo;
    if (!photoUrl) return;

    const link = document.createElement("a");
    link.href = photoUrl;
    link.download = `${member.memberID}-photo.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

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

  const currentPhoto = member.photo;

  const [newStatus, setNewStatus] = useState<string>(member.status ?? "active");
  const [statusReason, setStatusReason] = useState("");
  const updateStatusMutation = trpc.members.changeStatus.useMutation({
    onSuccess: () => {
      alert("Statut mis à jour avec succès");
      setStatusReason("");
      utils.members.list.invalidate();
      utils.members.directory.invalidate();
      utils.members.statusHistory.invalidate({ memberId: member.id });
    },
    onError: (err) => {
      alert("Erreur lors de la mise à jour du statut: " + err.message);
    },
  });

  const { data: statusHistoryData } = trpc.members.statusHistory.useQuery(
    { memberId: member.id },
    { enabled: open && Boolean(member.id) }
  );

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
            {/* Photo avec actions */}
            <div className="flex-shrink-0 relative">
              <div className="relative group">
                {currentPhoto ? (
                  <img
                    src={currentPhoto}
                    alt={`${member.firstName} ${member.lastName}`}
                    className="w-32 h-40 rounded-lg object-cover border-2 border-border shadow-md"
                  />
                ) : (
                  <div className="w-32 h-40 rounded-lg bg-muted flex items-center justify-center border-2 border-border">
                    <User className="h-12 w-12 text-muted-foreground" />
                  </div>
                )}

                {/* Overlay avec boutons */}
                <div className="absolute inset-0 rounded-lg bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-white hover:bg-white/20"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploadingPhoto || uploadPhotoMutation.isPending}
                  >
                    <Upload className="h-4 w-4" />
                  </Button>
                  {currentPhoto && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-white/20"
                        onClick={handleDownloadPhoto}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="text-white hover:bg-red-500/50"
                        onClick={handlePhotoDelete}
                        disabled={deletePhotoMutation.isPending}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </>
                  )}
                </div>
              </div>

              {/* Input file caché */}
              <input
                ref={fileInputRef}
                type="file"
                accept=".jpg,.jpeg,.png,image/jpeg,image/png"
                onChange={handlePhotoUpload}
                className="hidden"
                disabled={isUploadingPhoto || uploadPhotoMutation.isPending}
              />

              {/* État de chargement */}
              {(isUploadingPhoto || uploadPhotoMutation.isPending) && (
                <div className="absolute inset-0 rounded-lg bg-black/30 flex items-center justify-center">
                  <div className="text-white text-xs">Chargement...</div>
                </div>
              )}
            </div>

            {/* Informations Principales */}
            <div className="flex-1 space-y-4">
              <div>
                <h2 className="text-2xl font-bold">
                  {member.firstName} {member.lastName}
                </h2>
                <p className="text-sm text-muted-foreground">{member.memberID}</p>
              </div>

              <div className="space-y-2">
                {member.role && (
                  <div className="flex items-center gap-2">
                    <Badge variant="secondary">{member.role}</Badge>
                  </div>
                )}
                {member.function && (
                  <p className="text-sm"><span className="font-medium">Fonction:</span> {member.function}</p>
                )}
              </div>
            </div>
          </div>

          {/* Coordonnées */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Coordonnées</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {member.email && (
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${member.email}`} className="text-sm hover:underline text-blue-600">
                    {member.email}
                  </a>
                </div>
              )}
              {member.phone && (
                <div className="flex items-center gap-3">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${member.phone}`} className="text-sm hover:underline text-blue-600">
                    {member.phone}
                  </a>
                </div>
              )}
              {member.address && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-1" />
                  <p className="text-sm">{member.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Adhésion */}
          {adhesion && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Adhésion</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Année</p>
                    <p className="font-medium">{adhesion.annee}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Montant</p>
                    <p className="font-medium">{adhesion.montant}€</p>
                  </div>
                  {adhesion.type && (
                    <div>
                      <p className="text-xs text-muted-foreground">Type</p>
                      <p className="font-medium">{adhesion.type}</p>
                    </div>
                  )}
                  {adhesion.status && (
                    <div>
                      <p className="text-xs text-muted-foreground">Statut</p>
                      <Badge className={getStatusColor(adhesion.status)}>
                        {getStatusLabel(adhesion.status)}
                      </Badge>
                    </div>
                  )}
                </div>
                {adhesion.dateExpiration && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm">Expire le: {expirationDate}</span>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Gestion administrative du statut */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Suivi administratif & Statut</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Modifier le statut</label>
                  <Select value={newStatus} onValueChange={setNewStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Actif</SelectItem>
                      <SelectItem value="inactive">Inactif</SelectItem>
                      <SelectItem value="pending">En attente</SelectItem>
                      <SelectItem value="suspended">Suspendu</SelectItem>
                      <SelectItem value="resigned">Démissionnaire</SelectItem>
                      <SelectItem value="deceased">Décédé</SelectItem>
                      <SelectItem value="archived">Archivé</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-xs text-muted-foreground mb-1 block">Motif (suspension / radiation / autre)</label>
                  <Input
                    placeholder="Ex. non-paiement, décision AG..."
                    value={statusReason}
                    onChange={(e) => setStatusReason(e.target.value)}
                  />
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() => {
                  updateStatusMutation.mutate({
                    memberId: member.id,
                    status: newStatus as any,
                    reason: statusReason.trim() || undefined,
                  });
                }}
                disabled={updateStatusMutation.isPending}
              >
                {updateStatusMutation.isPending ? "Mise à jour..." : "Enregistrer le changement de statut"}
              </Button>

              <div className="pt-3 border-t">
                <p className="text-xs font-medium mb-2 text-muted-foreground">Historique des statuts</p>
                {Array.isArray(statusHistoryData) && statusHistoryData.length ? (
                  <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
                    {statusHistoryData.map((item: any) => (
                      <div key={item.id} className="text-xs bg-muted/50 p-2 rounded-lg flex flex-col gap-1">
                        <div className="flex items-center justify-between">
                          <Badge variant="outline" className="text-[10px]">{getStatusLabel(item.status)}</Badge>
                          <span className="text-muted-foreground">{new Date(item.changedAt).toLocaleDateString("fr-FR")}</span>
                        </div>
                        {item.reason && <p className="text-muted-foreground italic">Motif : {item.reason}</p>}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground">Aucun changement de statut enregistré.</p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-4 border-t">
            {onEdit && (
              <Button variant="outline" onClick={onEdit}>
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            )}
            {onDelete && (
              <Button variant="destructive" onClick={onDelete}>
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
