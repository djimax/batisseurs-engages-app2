import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth as useAuthHook } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ArrowLeft, FileCog, Loader2, Save, ShieldCheck, Upload } from "lucide-react";

export function AdminSettings() {
  const [, setLocation] = useLocation();
  const { user } = useAuthHook();
  const { data: allSettings, isLoading: settingsLoading } = trpc.adminSettings.getAll.useQuery();
  const updateSettingMutation = trpc.adminSettings.update.useMutation();
  const [maxUploadSize, setMaxUploadSize] = useState("50");
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    const setting = allSettings?.find((item) => item.key === "maxUploadSize");
    if (setting?.value) setMaxUploadSize(setting.value);
  }, [allSettings]);

  const handleSave = async () => {
    if (!user || user.role !== "admin") {
      setFeedback({ type: "error", text: "Vous n’avez pas les permissions pour modifier ces réglages." });
      return;
    }

    const value = Number(maxUploadSize);
    if (!Number.isFinite(value) || value < 1 || value > 500) {
      setFeedback({ type: "error", text: "La taille maximale doit être comprise entre 1 et 500 Mo." });
      return;
    }

    setIsSaving(true);
    setFeedback(null);
    try {
      await updateSettingMutation.mutateAsync({
        key: "maxUploadSize",
        value: String(value),
        description: "Taille maximale d’upload en Mo",
      });
      setFeedback({ type: "success", text: "Réglage technique enregistré." });
    } catch (error) {
      setFeedback({ type: "error", text: error instanceof Error ? error.message : "Impossible d’enregistrer le réglage." });
    } finally {
      setIsSaving(false);
    }
  };

  if (settingsLoading) {
    return <div className="flex min-h-[50vh] items-center justify-center"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>;
  }

  if (!user || user.role !== "admin") {
    return <div className="space-y-4"><Button variant="outline" onClick={() => setLocation("/settings")} className="gap-2"><ArrowLeft className="h-4 w-4" />Retour aux paramètres</Button><Alert variant="destructive"><AlertDescription>Seuls les administrateurs peuvent accéder aux réglages techniques.</AlertDescription></Alert></div>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-muted px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground"><FileCog className="h-3.5 w-3.5" />Administration technique</div>
          <h1 className="text-3xl font-bold tracking-tight">Réglages techniques</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">Un espace court pour les paramètres de fonctionnement de l’application.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/settings")} className="gap-2 self-start sm:self-auto"><ArrowLeft className="h-4 w-4" />Retour aux paramètres</Button>
      </header>

      <Card className="border-primary/20 bg-primary/[0.03]">
        <CardContent className="flex gap-3 p-5 text-sm text-muted-foreground"><ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" /><p>Les informations de l’association, son logo et ses coordonnées sont gérés uniquement dans <strong className="text-foreground">Identité de l’association</strong>. Cette séparation évite les doublons et limite les modifications sensibles.</p></CardContent>
      </Card>

      <Card className="max-w-2xl">
        <CardHeader><CardTitle className="flex items-center gap-2"><Upload className="h-5 w-5 text-primary" />Téléversements</CardTitle><CardDescription>Définissez la taille maximale acceptée pour les fichiers importés.</CardDescription></CardHeader>
        <CardContent className="space-y-5">
          {feedback && <Alert variant={feedback.type === "error" ? "destructive" : "default"}><AlertDescription>{feedback.text}</AlertDescription></Alert>}
          <div className="space-y-2"><label htmlFor="max-upload-size" className="text-sm font-medium">Taille maximale d’upload (Mo)</label><Input id="max-upload-size" type="number" min="1" max="500" value={maxUploadSize} onChange={(event) => setMaxUploadSize(event.target.value)} disabled={isSaving} /><p className="text-xs text-muted-foreground">Valeur autorisée : de 1 à 500 Mo.</p></div>
          <div className="flex justify-end"><Button onClick={handleSave} disabled={isSaving || updateSettingMutation.isPending} className="gap-2">{isSaving || updateSettingMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}{isSaving || updateSettingMutation.isPending ? "Enregistrement…" : "Enregistrer"}</Button></div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AdminSettings;
