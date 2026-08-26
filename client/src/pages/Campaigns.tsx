import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Target, TrendingUp, Calendar, Edit2, Trash2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useFormatAmount } from "@/hooks/useFormatAmount";
import { AmountDisplay } from "@/components/AmountDisplay";

type Campaign = {
  id: number;
  title: string;
  description?: string | null;
  objectif: number;
  montantCollecte: number;
  dateDebut: string | Date;
  dateFin: string | Date;
  status: "draft" | "active" | "completed" | "cancelled";
  progress: number;
};

const EMPTY_CAMPAIGNS: Campaign[] = [];

function formatCampaignDate(value: string | Date) {
  return new Date(value).toLocaleDateString("fr-FR");
}

export default function Campaigns() {
  const { formatAmountWithConversion } = useFormatAmount();
  const { data: campaigns = EMPTY_CAMPAIGNS, isLoading } = trpc.campaigns.list.useQuery();
  const campaignStats = useMemo(() => campaigns.reduce((stats, campaign) => ({
    active: stats.active + (campaign.status === "active" ? 1 : 0),
    collected: stats.collected + campaign.montantCollecte,
    objective: stats.objective + campaign.objectif,
  }), { active: 0, collected: 0, objective: 0 }), [campaigns]);
  const totalProgress = campaignStats.objective > 0 ? Math.min(100, Math.round((campaignStats.collected / campaignStats.objective) * 100)) : 0;
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    objectif: "",
    dateDebut: "",
    dateFin: "",
    status: "draft" as const,
  });

  const handleSubmit = () => {
    if (!formData.title || !formData.objectif) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    toast.success(editingId ? "Campagne mise à jour" : "Campagne créée");
    setFormData({
      title: "",
      description: "",
      objectif: "",
      dateDebut: "",
      dateFin: "",
      status: "draft",
    });
    setEditingId(null);
    setIsOpen(false);
  };

  const handleDelete = (id: number) => {
    toast.success("Campagne supprimée");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "draft":
        return "bg-gray-100 text-gray-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Active";
      case "draft":
        return "Brouillon";
      case "completed":
        return "Complétée";
      case "cancelled":
        return "Annulée";
      default:
        return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Campagnes de Collecte</h1>
          <p className="text-muted-foreground mt-2">
            Gérez vos campagnes de financement et collecte de fonds
          </p>
        </div>
        <Button onClick={() => setIsOpen(true)} className="gap-2">
          <Plus className="h-4 w-4" />
          Nouvelle Campagne
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Campagnes Actives</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{campaignStats.active}</div>
            <p className="text-xs text-muted-foreground mt-1">En cours de collecte</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Collecté</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={campaignStats.collected} sourceCurrency="EUR" /></div>
            <p className="text-xs text-muted-foreground mt-1">Toutes campagnes confondues</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Objectif Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold"><AmountDisplay amount={campaignStats.objective} sourceCurrency="EUR" /></div>
            <p className="text-xs text-muted-foreground mt-1">{totalProgress}% atteint</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns List */}
      <div className="space-y-4">
        {isLoading && <Card><CardContent className="py-10 text-center text-muted-foreground">Chargement des campagnes…</CardContent></Card>}
        {!isLoading && campaigns.length === 0 && <Card><CardContent className="py-10 text-center text-muted-foreground">Aucune campagne de collecte n’est encore enregistrée.</CardContent></Card>}
        {campaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-md transition-shadow">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{campaign.title}</h3>
                    <Badge className={getStatusColor(campaign.status)}>
                      {getStatusLabel(campaign.status)}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">{campaign.description || "Aucune description"}</p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingId(campaign.id);
                      setIsOpen(true);
                    }}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(campaign.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Progress Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progression</span>
                  <span className="text-sm font-semibold">{campaign.progress}%</span>
                </div>
                <div
                  className="h-2 w-full overflow-hidden rounded-full bg-muted"
                  role="progressbar"
                  aria-label={`Progression de la campagne ${campaign.title}`}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-valuenow={campaign.progress}
                >
                  <div
                    className={`h-full rounded-full transition-[width,background-color] duration-500 ${campaign.progress >= 100 ? "bg-primary" : "bg-green-500"}`}
                    style={{ width: `${campaign.progress}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {campaign.progress >= 100 ? "Objectif atteint" : campaign.objectif > 0 ? `${campaign.progress}% de l’objectif atteint` : "Objectif non renseigné"}
                </p>
              </div>

              {/* Campaign Details */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Collecté</p>
                  <p className="text-lg font-bold text-green-600"><AmountDisplay amount={campaign.montantCollecte} sourceCurrency="EUR" /></p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Objectif</p>
                  <p className="text-lg font-bold"><AmountDisplay amount={campaign.objectif} sourceCurrency="EUR" /></p>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Début</p>
                    <p className="text-sm font-medium">{formatCampaignDate(campaign.dateDebut)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Fin</p>
                    <p className="text-sm font-medium">{formatCampaignDate(campaign.dateFin)}</p>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Button variant="outline" className="w-full gap-2">
                <TrendingUp className="h-4 w-4" />
                Voir les détails
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Dialog for Creating/Editing Campaign */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Modifier la campagne" : "Nouvelle campagne"}
            </DialogTitle>
            <DialogDescription>
              {editingId
                ? "Mettez à jour les informations de la campagne"
                : "Créez une nouvelle campagne de collecte"}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Titre *</label>
              <Input
                placeholder="Nom de la campagne"
                value={formData.title}
                onChange={(e) =>
                  setFormData({ ...formData, title: e.target.value })
                }
              />
            </div>

            <div>
              <label className="text-sm font-medium">Description</label>
              <Textarea
                placeholder="Description de la campagne"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Objectif (F) *</label>
                <Input
                  type="number"
                  placeholder="5000"
                  value={formData.objectif}
                  onChange={(e) =>
                    setFormData({ ...formData, objectif: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Statut</label>
                <Select value={formData.status} onValueChange={(value: any) =>
                  setFormData({ ...formData, status: value })
                }>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="draft">Brouillon</SelectItem>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="completed">Complétée</SelectItem>
                    <SelectItem value="cancelled">Annulée</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Date de début</label>
                <Input
                  type="date"
                  value={formData.dateDebut}
                  onChange={(e) =>
                    setFormData({ ...formData, dateDebut: e.target.value })
                  }
                />
              </div>

              <div>
                <label className="text-sm font-medium">Date de fin</label>
                <Input
                  type="date"
                  value={formData.dateFin}
                  onChange={(e) =>
                    setFormData({ ...formData, dateFin: e.target.value })
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
                {editingId ? "Mettre à jour" : "Créer"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
