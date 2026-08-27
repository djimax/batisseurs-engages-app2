import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { usePreferences, type UserPreferences } from "@/hooks/usePreferences";
import { useAuth as useAuthHook } from "@/_core/hooks/useAuth";
import { useBackup } from "@/hooks/useBackup";
import { useSyncHistory } from "@/hooks/useSyncHistory";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useTheme } from "@/contexts/ThemeContext";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import {
  AlertTriangle,
  ArrowRight,
  Database,
  DollarSign,
  Download,
  FileCog,
  Globe,
  History,
  Laptop,
  Loader2,
  LogOut,
  Moon,
  Monitor,
  Palette,
  RefreshCw,
  RotateCcw,
  Save,
  Settings as SettingsIcon,
  ShieldCheck,
  Sun,
  Upload,
  UserRound,
  Wifi,
} from "lucide-react";

const DATE_FORMATS: Array<{ value: UserPreferences["dateFormat"]; label: string }> = [
  { value: "DD/MM/YYYY", label: "JJ/MM/AAAA" },
  { value: "MM/DD/YYYY", label: "MM/JJ/AAAA" },
  { value: "YYYY-MM-DD", label: "AAAA-MM-JJ" },
];

export default function Settings() {
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuthHook();
  const { preferences, updatePreference, resetPreferences } = usePreferences();
  const { theme, resolvedTheme, setTheme } = useTheme();
  const { exportData, importData, getBackupSize } = useBackup();
  const { getLastSync, getStats: getSyncStats } = useSyncHistory();
  const { currency, setCurrency, exchangeRate, setExchangeRate, resetExchangeRate } = useCurrency();
  const [currentMode, setCurrentMode] = useState<"online" | "offline">("offline");
  const [newExchangeRate, setNewExchangeRate] = useState(exchangeRate.toString());
  const [isResetDialogOpen, setIsResetDialogOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const syncStats = getSyncStats();
  const lastSync = getLastSync();
  const isAdmin = currentUser?.role === "admin";
  const { refetch: refetchPersonalData, isFetching: isExportingPersonalData } = trpc.auth.exportMyData.useQuery(undefined, { enabled: false });
  const { data: myDeletionRequest, refetch: refetchDeletionRequest } = trpc.auth.myDataDeletionRequest.useQuery();
  const requestDataDeletion = trpc.auth.requestDataDeletion.useMutation({ onSuccess: () => { void refetchDeletionRequest(); toast.success("Demande de suppression enregistrée"); } });
  const cancelDataDeletionRequest = trpc.auth.cancelDataDeletionRequest.useMutation({ onSuccess: () => { void refetchDeletionRequest(); toast.success("Demande de suppression annulée"); } });
  const [deletionReason, setDeletionReason] = useState("");

  useEffect(() => {
    const savedMode = localStorage.getItem("appMode") as "online" | "offline" | null;
    if (savedMode) setCurrentMode(savedMode);
  }, []);

  useEffect(() => {
    setNewExchangeRate(exchangeRate.toString());
  }, [exchangeRate]);

  const handleChangeMode = () => {
    const newMode = currentMode === "online" ? "offline" : "online";
    localStorage.setItem("appMode", newMode);
    toast.success(`Mode changé : ${newMode === "online" ? "en ligne" : "hors ligne"}`);
    window.setTimeout(() => window.location.reload(), 500);
  };

  const handleLogout = () => {
    localStorage.removeItem("offlineUser");
    localStorage.removeItem("appMode");
    toast.success("Déconnexion réussie");
    setLocation("/");
  };

  const handleResetPreferences = () => {
    resetPreferences();
    setTheme?.("light");
    setIsResetDialogOpen(false);
    toast.success("Préférences réinitialisées", {
      description: "Vos choix personnels sont revenus aux valeurs par défaut.",
      duration: 2200,
    });
  };

  const handleThemeChange = (nextTheme: UserPreferences["theme"]) => {
    setTheme?.(nextTheme);
    updatePreference("theme", nextTheme);
    const themeLabel = nextTheme === "system" ? "système" : nextTheme === "dark" ? "sombre" : "clair";
    toast.success(`Thème ${themeLabel} activé`, {
      description: "L'interface s'est adaptée à votre choix.",
      duration: 2000,
    });
  };

  const handleExportBackup = () => {
    try {
      exportData();
      toast.success("Sauvegarde exportée");
    } catch (error) {
      console.error("Erreur lors de l'export :", error);
      toast.error("Impossible d’exporter la sauvegarde");
    }
  };

  const handleExportPersonalData = async () => {
    try {
      const result = await refetchPersonalData();
      if (!result.data) throw new Error("Export indisponible");
      const blob = new Blob([JSON.stringify(result.data, null, 2)], { type: "application/json;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `export-rgpd-${new Date().toISOString().slice(0, 10)}.json`;
      link.click();
      URL.revokeObjectURL(url);
      toast.success("Export RGPD téléchargé");
    } catch (error) {
      console.error("Erreur lors de l’export RGPD :", error);
      toast.error("Impossible d’exporter vos données personnelles");
    }
  };

  const handleImportBackup = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const success = await importData(file);
    event.target.value = "";
    if (!success) return;

    toast.success("Sauvegarde importée");
    window.setTimeout(() => window.location.reload(), 1000);
  };

  const handleUpdateExchangeRate = () => {
    const rate = Number.parseFloat(newExchangeRate);
    if (!Number.isFinite(rate) || rate <= 0) {
      toast.error("Saisissez un taux de change positif");
      return;
    }

    setExchangeRate(rate);
    toast.success(`Taux mis à jour : 1 EUR = ${rate.toFixed(3)} XOF`);
  };

  const handleResetExchangeRate = () => {
    resetExchangeRate();
    setNewExchangeRate("655.957");
    toast.success("Taux réinitialisé : 1 EUR = 655.957 XOF");
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary">
            <SettingsIcon className="h-3.5 w-3.5" />
            Espace de configuration
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Paramètres</h1>
          <p className="mt-1 max-w-2xl text-muted-foreground">
            Préférences personnelles, données locales et réglages financiers réunis dans un seul espace.
          </p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/dashboard")} className="gap-2 self-start sm:self-auto">
          Retour au tableau de bord
          <ArrowRight className="h-4 w-4" />
        </Button>
      </header>

      <section aria-label="Accès rapides" className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
        <button
          type="button"
          onClick={() => setLocation("/member-portal")}
          className="group rounded-2xl border bg-card p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><UserRound className="h-5 w-5" /></span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 font-semibold">Mon profil adhérent</p>
          <p className="mt-1 text-sm text-muted-foreground">Coordonnées, carte et historique personnel.</p>
        </button>

        <button
          type="button"
          onClick={() => setLocation("/finance?tab=paiements")}
          className="group rounded-2xl border border-primary/20 bg-primary/[0.04] p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <div className="flex items-start justify-between gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><DollarSign className="h-5 w-5" /></span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </div>
          <p className="mt-4 font-semibold">Paiements Stripe</p>
          <p className="mt-1 text-sm text-muted-foreground">Cotisations, dons et campagnes de collecte en ligne.</p>
        </button>

        {isAdmin && (
          <button
            type="button"
            onClick={() => setLocation("/global-settings")}
            className="group rounded-2xl border bg-card p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/15 text-accent-foreground"><ShieldCheck className="h-5 w-5" /></span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 font-semibold">Identité de l’association</p>
            <p className="mt-1 text-sm text-muted-foreground">Logo, siège, contacts et informations officielles.</p>
          </button>
        )}

        {isAdmin && (
          <button
            type="button"
            onClick={() => setLocation("/admin/settings")}
            className="group rounded-2xl border bg-card p-4 text-left shadow-sm transition-[border-color,box-shadow,transform] duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            <div className="flex items-start justify-between gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-muted text-foreground"><FileCog className="h-5 w-5" /></span>
              <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
            </div>
            <p className="mt-4 font-semibold">Réglages techniques</p>
            <p className="mt-1 text-sm text-muted-foreground">Paramètres d’application réservés aux administrateurs.</p>
          </button>
        )}
      </section>

      <Tabs defaultValue="preferences" className="space-y-5">
        <TabsList className="grid h-auto w-full max-w-3xl grid-cols-2 gap-1 p-1 sm:grid-cols-4">
          <TabsTrigger value="preferences" className="settings-tab-trigger gap-2 py-2.5"><Palette className="h-4 w-4" />Préférences</TabsTrigger>
          <TabsTrigger value="data" className="settings-tab-trigger gap-2 py-2.5"><Database className="h-4 w-4" />Données</TabsTrigger>
          <TabsTrigger value="finance" className="settings-tab-trigger gap-2 py-2.5"><DollarSign className="h-4 w-4" />Finance</TabsTrigger>
          <TabsTrigger value="about" className="settings-tab-trigger gap-2 py-2.5"><SettingsIcon className="h-4 w-4" />À propos</TabsTrigger>
        </TabsList>

        <TabsContent value="preferences" className="settings-tab-content space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Laptop className="h-5 w-5 text-primary" />Mode de travail</CardTitle>
                <CardDescription>Choisissez où les données sont traitées et conservées.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-primary/5 p-4 text-sm">
                  <p className="font-semibold">Mode actuel : {currentMode === "online" ? "En ligne" : "Hors ligne"}</p>
                  <p className="mt-1 text-muted-foreground">
                    {currentMode === "online" ? "Les données sont synchronisées avec le serveur." : "Les données sont conservées localement sur cet appareil."}
                  </p>
                </div>
                <Button onClick={handleChangeMode} variant="outline" className="w-full gap-2">
                  {currentMode === "online" ? <Wifi className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                  Passer en mode {currentMode === "online" ? "hors ligne" : "en ligne"}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Sun className="h-5 w-5 text-primary" />Apparence & Thème</CardTitle>
                <CardDescription>Choisissez un mode fixe ou laissez l’interface suivre votre système.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <button
                    type="button"
                    aria-pressed={theme === "light"}
                    onClick={() => handleThemeChange("light")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                      theme === "light"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Sun className="h-4 w-4 text-amber-500" />
                    Mode clair
                  </button>
                  <button
                    type="button"
                    aria-pressed={theme === "dark"}
                    onClick={() => handleThemeChange("dark")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                      theme === "dark"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Moon className="h-4 w-4 text-primary" />
                    Mode sombre
                  </button>
                  <button
                    type="button"
                    aria-pressed={theme === "system"}
                    onClick={() => handleThemeChange("system")}
                    className={`flex items-center justify-center gap-2 rounded-xl border p-3.5 text-sm font-medium transition-all ${
                      theme === "system"
                        ? "border-primary bg-primary/10 text-primary shadow-sm"
                        : "border-border bg-background text-muted-foreground hover:border-primary/40 hover:text-foreground"
                    }`}
                  >
                    <Monitor className="h-4 w-4" />
                    Système
                  </button>
                </div>
                <div className="flex flex-col gap-3 rounded-xl border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>État actuel :</span>
                    <span className="font-semibold text-foreground">
                      {theme === "system" ? `Système · ${resolvedTheme === "dark" ? "sombre" : "clair"}` : theme === "dark" ? "Mode sombre" : "Mode clair"}
                    </span>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleThemeChange(theme === "dark" ? "light" : "dark")}
                    className="gap-2 self-start sm:self-auto"
                  >
                    {theme === "dark" ? <Sun className="h-3.5 w-3.5" /> : <Moon className="h-3.5 w-3.5" />}
                    Basculer
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5 text-primary" />Préférences d’affichage</CardTitle>
              <CardDescription>Ces choix sont enregistrés pour votre compte sur cet appareil.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-5 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="language">Langue</Label>
                <select id="language" value={preferences.language} onChange={(event) => { updatePreference("language", event.target.value as "fr" | "en"); toast.success("Langue mise à jour"); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  <option value="fr">Français</option>
                  <option value="en">English</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date-format">Format de date</Label>
                <select id="date-format" value={preferences.dateFormat} onChange={(event) => { updatePreference("dateFormat", event.target.value as UserPreferences["dateFormat"]); toast.success("Format de date mis à jour"); }} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground">
                  {DATE_FORMATS.map((format) => <option key={format.value} value={format.value}>{format.label}</option>)}
                </select>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-xl border px-4 py-3">
                <div>
                  <Label htmlFor="email-notifications" className="cursor-pointer">Notifications email</Label>
                  <p className="mt-1 text-xs text-muted-foreground">Recevoir les alertes importantes.</p>
                </div>
                <Switch id="email-notifications" checked={preferences.emailNotifications} onCheckedChange={(value) => { updatePreference("emailNotifications", value); toast.success(`Notifications email ${value ? "activées" : "désactivées"}`); }} />
              </div>
            </CardContent>
          </Card>

          <Card className="border-destructive/25 bg-destructive/[0.02]">
            <CardContent className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Réinitialiser les préférences</p>
                <p className="mt-1 text-sm text-muted-foreground">Langue, format de date, notifications et thème seront remis à leur valeur par défaut. Les données métier, la devise et le taux EUR/XOF ne seront pas modifiés.</p>
              </div>
              <AlertDialog open={isResetDialogOpen} onOpenChange={setIsResetDialogOpen}>
                <AlertDialogTrigger asChild><Button variant="outline" className="shrink-0 gap-2 border-destructive/40 text-destructive hover:bg-destructive/10 hover:text-destructive"><RotateCcw className="h-4 w-4" />Réinitialiser</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Réinitialiser les préférences ?</AlertDialogTitle>
                    <AlertDialogDescription>Cette action remettra la langue, le format de date, les notifications et le thème à leurs valeurs par défaut. Elle ne supprimera ni vos membres, ni vos documents, ni vos données financières.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Annuler</AlertDialogCancel>
                    <AlertDialogAction onClick={handleResetPreferences} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Réinitialiser les préférences</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="data" className="settings-tab-content space-y-5">
          <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Database className="h-5 w-5 text-primary" />Sauvegarde des données</CardTitle>
                <CardDescription>Exportez ou restaurez les données locales de travail.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="rounded-xl bg-muted/60 p-4 text-sm"><span className="text-muted-foreground">Taille estimée : </span><strong>{getBackupSize()} Ko</strong></div>
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={handleExportBackup} variant="outline" className="gap-2"><Download className="h-4 w-4" />Exporter</Button>
                  <Button onClick={() => fileInputRef.current?.click()} variant="outline" className="gap-2"><Upload className="h-4 w-4" />Importer</Button>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleImportBackup} className="hidden" />
                <p className="text-xs text-muted-foreground">La sauvegarde concerne les données locales : documents, membres, catégories et notes.</p>
                <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-4">
                  <p className="font-semibold">Mes données personnelles</p>
                  <p className="mt-1 text-sm text-muted-foreground">Téléchargez une copie JSON de votre profil, de vos contributions documentaires et de votre historique d’audit.</p>
                  <Button onClick={handleExportPersonalData} disabled={isExportingPersonalData} variant="outline" className="mt-3 gap-2"><Download className="h-4 w-4" />{isExportingPersonalData ? "Préparation…" : "Exporter mes données (RGPD)"}</Button>
                  {myDeletionRequest?.status === "pending" ? <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><p className="text-sm text-amber-700">Une demande de suppression est en attente d’examen administratif.</p><Button variant="outline" size="sm" className="text-destructive" disabled={cancelDataDeletionRequest.isPending} onClick={() => { if (window.confirm("Retirer votre demande de suppression RGPD ?")) cancelDataDeletionRequest.mutate(); }}>Retirer la demande</Button></div> : <AlertDialog><AlertDialogTrigger asChild><Button variant="ghost" className="mt-2 w-full justify-start gap-2 text-destructive hover:text-destructive"><AlertTriangle className="h-4 w-4" />Demander la suppression de mes données</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Demander la suppression de vos données ?</AlertDialogTitle><AlertDialogDescription>La demande sera examinée par un administrateur. Aucune donnée ne sera supprimée automatiquement.</AlertDialogDescription></AlertDialogHeader><textarea value={deletionReason} onChange={(event) => setDeletionReason(event.target.value)} maxLength={2000} placeholder="Motif facultatif" className="min-h-24 w-full rounded-md border bg-background p-3 text-sm" /><AlertDialogFooter><AlertDialogCancel>Annuler</AlertDialogCancel><AlertDialogAction onClick={() => requestDataDeletion.mutate({ reason: deletionReason || undefined })} disabled={requestDataDeletion.isPending}>Envoyer la demande</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><History className="h-5 w-5 text-primary" />Synchronisation</CardTitle>
                <CardDescription>Un aperçu rapide des échanges de données.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Événements</p><p className="mt-1 text-2xl font-bold">{syncStats.totalEvents}</p></div>
                  <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Aujourd’hui</p><p className="mt-1 text-2xl font-bold">{syncStats.todayEvents}</p></div>
                  <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Réussis</p><p className="mt-1 text-2xl font-bold text-emerald-700">{syncStats.successCount}</p></div>
                  <div className="rounded-xl border p-3"><p className="text-xs text-muted-foreground">Erreurs</p><p className="mt-1 text-2xl font-bold text-red-600">{syncStats.errorCount}</p></div>
                </div>
                {lastSync && <p className="flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground"><RefreshCw className="h-4 w-4" />Dernière synchronisation : {new Date(lastSync.timestamp).toLocaleString("fr-FR")}</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="finance" className="settings-tab-content space-y-5">
          <div className="grid gap-5 lg:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Devise d’affichage</CardTitle>
                <CardDescription>Choisissez la devise privilégiée pour lire les montants.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Button onClick={() => { setCurrency("EUR"); toast.success("Devise : Euro (€)"); }} variant={currency === "EUR" ? "default" : "outline"} className="gap-2"><span>€</span> Euro</Button>
                  <Button onClick={() => { setCurrency("XOF"); toast.success("Devise : XOF (F CFA)"); }} variant={currency === "XOF" ? "default" : "outline"} className="gap-2"><span>F</span> XOF</Button>
                </div>
                <p className="rounded-xl bg-primary/5 p-3 text-sm text-primary">Devise sélectionnée : <strong>{currency === "EUR" ? "Euro (€)" : "XOF (F CFA)"}</strong></p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-primary" />Taux EUR/XOF</CardTitle>
                <CardDescription>Le taux est utilisé pour les équivalences dans toute l’application.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="rounded-xl bg-primary/5 p-3 text-sm text-primary">Taux actuel : <strong>1 EUR = {exchangeRate.toFixed(3)} XOF</strong></p>
                <div className="space-y-2">
                  <Label htmlFor="exchange-rate">Nouveau taux, en XOF pour 1 EUR</Label>
                  <div className="flex gap-2">
                    <input id="exchange-rate" type="number" min="0.001" step="0.001" value={newExchangeRate} onChange={(event) => setNewExchangeRate(event.target.value)} className="flex-1 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground" />
                    <Button onClick={handleUpdateExchangeRate} className="gap-2"><Save className="h-4 w-4" />Mettre à jour</Button>
                  </div>
                </div>
                <Button onClick={handleResetExchangeRate} variant="outline" className="w-full gap-2"><RotateCcw className="h-4 w-4" />Réinitialiser à 655.957</Button>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="about" className="settings-tab-content space-y-5">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-primary" />À propos de la plateforme</CardTitle>
              <CardDescription>Informations utiles sans répéter la configuration de l’association.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div><p className="text-xs text-muted-foreground">Application</p><p className="mt-1 font-semibold">Les Bâtisseurs Engagés</p></div>
              <div><p className="text-xs text-muted-foreground">Version</p><p className="mt-1 font-semibold">1.0.0</p></div>
              <div><p className="text-xs text-muted-foreground">Mode</p><p className="mt-1 font-semibold">{currentMode === "online" ? "En ligne" : "Hors ligne"}</p></div>
              <div><p className="text-xs text-muted-foreground">Stockage</p><p className="mt-1 font-semibold">{currentMode === "online" ? "Cloud" : "Local"}</p></div>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive"><AlertTriangle className="h-5 w-5" />Déconnexion</CardTitle>
              <CardDescription>Quitter la session et revenir à la sélection du mode.</CardDescription>
            </CardHeader>
            <CardContent>
              <Button onClick={handleLogout} variant="destructive" className="gap-2"><LogOut className="h-4 w-4" />Se déconnecter</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
