import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ArrowLeft, FileCog, Globe, ImagePlus, Loader2, Mail, MapPin, RotateCcw, Save, Settings, Upload } from "lucide-react";

const DEFAULT_FORM = {
  associationName: "Les Bâtisseurs Engagés",
  seatCity: "N'djaména-tchad",
  folio: "10512",
  email: "contact.lesbatisseursengages@gmail.com",
  website: "www.lesbatisseursengage.com",
  euroToXofRate: "655.957",
  phone: "",
  description: "",
};

type GlobalSettingsForm = typeof DEFAULT_FORM;

export default function GlobalSettings() {
  const [, setLocation] = useLocation();
  const [formData, setFormData] = useState<GlobalSettingsForm>(DEFAULT_FORM);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const { data: settings, isLoading, refetch } = trpc.globalSettings.get.useQuery();
  const updateMutation = trpc.globalSettings.update.useMutation();

  useEffect(() => {
    if (!settings) return;
    setFormData({
      associationName: settings.associationName || "",
      seatCity: settings.seatCity || "",
      folio: settings.folio || "",
      email: settings.email || "",
      website: settings.website || "",
      euroToXofRate: settings.euroToXofRate || "655.957",
      phone: settings.phone || "",
      description: settings.description || "",
    });
    setLogoPreview(settings.logo || null);
  }, [settings]);

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    setFormData((current) => ({ ...current, [name]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      toast.error("Le logo ne doit pas dépasser 2 Mo");
      return;
    }
    if (!file.type.startsWith("image/")) {
      toast.error("Sélectionnez un fichier image");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
      toast.success("Logo prêt à être enregistré");
    };
    reader.readAsDataURL(file);
    event.target.value = "";
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateMutation.mutateAsync({ ...formData, logo: logoPreview });
      toast.success("Identité de l’association enregistrée");
      await refetch();
    } catch (error) {
      console.error("Erreur lors de la sauvegarde :", error);
      toast.error("Impossible d’enregistrer les informations");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!window.confirm("Réinitialiser le formulaire avec les informations par défaut ?")) return;
    setFormData(DEFAULT_FORM);
    setLogoPreview(null);
    toast.success("Formulaire réinitialisé");
  };

  if (isLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <Settings className="h-3.5 w-3.5" /> Administration
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Identité de l’association</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">Une seule fiche pour le nom, le logo, le siège et les coordonnées officielles.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/settings")} className="gap-2 self-start sm:self-auto"><ArrowLeft className="h-4 w-4" />Retour aux paramètres</Button>
      </header>

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><ImagePlus className="h-5 w-5 text-primary" />Logo</CardTitle>
            <CardDescription>Image utilisée dans les espaces de l’association. Taille maximale : 2 Mo.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex min-h-36 items-center justify-center overflow-hidden rounded-xl border border-dashed bg-muted/40 p-4">
              {logoPreview ? <img src={logoPreview} alt="Aperçu du logo de l’association" className="max-h-32 max-w-full object-contain" /> : <div className="text-center text-muted-foreground"><Upload className="mx-auto mb-2 h-8 w-8" /><p className="text-sm">Aucun logo configuré</p></div>}
            </div>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
              <label className="inline-flex h-10 cursor-pointer items-center justify-center gap-2 rounded-md border border-input bg-background px-4 text-sm font-medium transition-colors hover:bg-accent hover:text-accent-foreground focus-within:ring-2 focus-within:ring-ring"><Upload className="h-4 w-4" />Choisir une image<input type="file" accept="image/*" onChange={handleLogoUpload} className="sr-only" /></label>
              {logoPreview && <Button type="button" variant="outline" onClick={() => { setLogoPreview(null); toast.success("Logo retiré du formulaire"); }} className="gap-2"><RotateCcw className="h-4 w-4" />Retirer</Button>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Settings className="h-5 w-5 text-primary" />Informations officielles</CardTitle>
            <CardDescription>Ces informations sont réutilisées dans l’accueil, le tableau de bord et les documents.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid gap-5 md:grid-cols-2">
              <div className="space-y-2 md:col-span-2"><Label htmlFor="associationName">Nom de l’association</Label><Input id="associationName" name="associationName" value={formData.associationName} onChange={handleInputChange} /></div>
              <div className="space-y-2"><Label htmlFor="seatCity" className="flex items-center gap-2"><MapPin className="h-4 w-4" />Siège social</Label><Input id="seatCity" name="seatCity" value={formData.seatCity} onChange={handleInputChange} /></div>
              <div className="space-y-2"><Label htmlFor="folio">Folio / numéro d’enregistrement</Label><Input id="folio" name="folio" value={formData.folio} onChange={handleInputChange} /></div>
              <div className="space-y-2"><Label htmlFor="email" className="flex items-center gap-2"><Mail className="h-4 w-4" />Email officiel</Label><Input id="email" name="email" type="email" value={formData.email} onChange={handleInputChange} /></div>
              <div className="space-y-2"><Label htmlFor="phone">Téléphone</Label><Input id="phone" name="phone" value={formData.phone} onChange={handleInputChange} /></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="website" className="flex items-center gap-2"><Globe className="h-4 w-4" />Site web</Label><Input id="website" name="website" value={formData.website} onChange={handleInputChange} placeholder="https://…" /></div>
              <div className="space-y-2"><Label htmlFor="euroToXofRate">Taux EUR → F CFA</Label><Input id="euroToXofRate" name="euroToXofRate" type="number" min="0.000001" step="0.000001" value={formData.euroToXofRate} onChange={handleInputChange} /><p className="text-xs text-muted-foreground">1 € = ce montant en F CFA. La valeur est utilisée dans les rapports et conversions.</p></div>
              <div className="space-y-2 md:col-span-2"><Label htmlFor="description">Présentation courte</Label><Textarea id="description" name="description" value={formData.description} onChange={handleInputChange} rows={4} placeholder="Quelques mots sur la mission de l’association…" /></div>
            </div>
            <div className="flex flex-col gap-2 border-t pt-5 sm:flex-row sm:justify-end"><Button variant="outline" onClick={handleReset} className="gap-2"><RotateCcw className="h-4 w-4" />Réinitialiser</Button><Button onClick={handleSave} disabled={isSaving || updateMutation.isPending} className="gap-2">{isSaving || updateMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving || updateMutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button></div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div><p className="font-semibold">Réglages techniques séparés</p><p className="mt-1 text-sm text-muted-foreground">La configuration d’upload reste isolée pour éviter de mélanger identité associative et maintenance de l’application.</p></div>
          <Button variant="outline" onClick={() => setLocation("/admin/settings")} className="shrink-0 gap-2"><FileCog className="h-4 w-4" />Ouvrir les réglages techniques</Button>
        </CardContent>
      </Card>
    </div>
  );
}
