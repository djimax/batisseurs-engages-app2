import { useEffect, useMemo, useState } from "react";
import QRCode from "qrcode";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { LoadingButtonContent, LoadingState } from "@/components/LoadingState";
import { getErrorMessage } from "@/lib/uxFeedback";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { CreditCard, History, QrCode, Save, Settings2, ShieldCheck, UserRound } from "lucide-react";

const STATUS_LABELS: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  pending: "En attente",
  suspended: "Suspendu",
  resigned: "Démissionnaire",
  deceased: "Décédé",
  archived: "Archivé",
};

export default function MemberPortal() {
  const [, setLocation] = useLocation();
  const { data, isLoading, refetch } = trpc.members.portalProfile.useQuery();
  const updateMutation = trpc.members.updateSelf.useMutation({
    onSuccess: () => {
      toast.success("Profil mis à jour");
      refetch();
    },
    onError: (error) => toast.error(getErrorMessage(error, "Impossible de mettre à jour le profil")),
  });
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "" });
  const [qrCode, setQrCode] = useState<string | null>(null);

  useEffect(() => {
    if (!data?.member) return;
    setForm({
      firstName: data.member.firstName,
      lastName: data.member.lastName,
      email: data.member.email ?? "",
      phone: data.member.phone ?? "",
    });
  }, [data?.member]);

  useEffect(() => {
    if (!data?.cardPayload) return;
    QRCode.toDataURL(data.cardPayload, { width: 220, margin: 2, errorCorrectionLevel: "M" })
      .then(setQrCode)
      .catch(() => setQrCode(null));
  }, [data?.cardPayload]);

  const status = data?.member?.status ?? "pending";
  const statusLabel = STATUS_LABELS[status] ?? status;
  const hasChanges = useMemo(() => {
    if (!data?.member) return false;
    return form.firstName !== data.member.firstName
      || form.lastName !== data.member.lastName
      || form.email !== (data.member.email ?? "")
      || form.phone !== (data.member.phone ?? "");
  }, [data?.member, form]);

  if (isLoading) return <LoadingState label="Chargement de votre espace adhérent…" />;
  if (!data?.member) {
    return (
      <Card>
        <CardHeader><CardTitle>Portail adhérent</CardTitle></CardHeader>
        <CardContent className="text-muted-foreground">Aucun profil membre n’est associé à votre compte.</CardContent>
      </Card>
    );
  }

  const handleSave = () => updateMutation.mutate({
    firstName: form.firstName,
    lastName: form.lastName,
    email: form.email || undefined,
    phone: form.phone || undefined,
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border/70 pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-primary"><UserRound className="h-3.5 w-3.5" />Espace personnel</div>
          <h1 className="text-3xl font-bold tracking-tight">Mon profil adhérent</h1>
          <p className="mt-1 text-muted-foreground">Coordonnées, carte adhérent et historique réunis au même endroit.</p>
        </div>
        <Button variant="outline" onClick={() => setLocation("/settings")} className="gap-2 self-start sm:self-auto"><Settings2 className="h-4 w-4" />Préférences</Button>
      </header>

      <div className="grid gap-6 xl:grid-cols-[1.4fr_0.8fr]">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />Coordonnées personnelles</CardTitle>
            <CardDescription>Modifiez uniquement les informations de contact qui vous concernent.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap items-center gap-2 rounded-xl bg-muted/60 px-4 py-3 text-sm"><span className="text-muted-foreground">Identifiant</span><strong className="font-mono">{data.member.memberId ?? "Non attribué"}</strong><Badge className="ml-auto" variant={status === "active" ? "default" : "secondary"}>{statusLabel}</Badge></div>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2 text-sm font-medium">Prénom<Input value={form.firstName} onChange={(event) => setForm((current) => ({ ...current, firstName: event.target.value }))} /></label>
              <label className="space-y-2 text-sm font-medium">Nom<Input value={form.lastName} onChange={(event) => setForm((current) => ({ ...current, lastName: event.target.value }))} /></label>
              <label className="space-y-2 text-sm font-medium">Email<Input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} /></label>
              <label className="space-y-2 text-sm font-medium">Téléphone<Input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} /></label>
            </div>
            <div className="flex flex-wrap items-center justify-end gap-3 border-t pt-4 text-sm text-muted-foreground">
              <Button onClick={handleSave} disabled={!hasChanges || updateMutation.isPending}>
                <LoadingButtonContent loading={updateMutation.isPending} loadingLabel="Enregistrement…"><Save className="mr-2 h-4 w-4" />Enregistrer</LoadingButtonContent>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5" />Carte adhérent</CardTitle>
            <CardDescription>Présentez ce QR code pour vérifier l’identifiant de votre carte.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-3">
            {qrCode ? <img src={qrCode} alt="QR code de la carte adhérent" className="rounded-lg border bg-white p-2" /> : <div className="flex h-[220px] w-[220px] items-center justify-center rounded-lg border bg-muted"><QrCode className="h-10 w-10 text-muted-foreground" /></div>}
            <p className="flex items-center gap-1 text-xs text-muted-foreground"><ShieldCheck className="h-3.5 w-3.5" />Données de vérification signées par la plateforme</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><History className="h-5 w-5" />Historique du profil</CardTitle><CardDescription>Les changements sont conservés pour assurer la traçabilité.</CardDescription></CardHeader>
        <CardContent>
          {data.history.length === 0 ? <p className="text-sm text-muted-foreground">Aucun changement enregistré.</p> : <div className="space-y-3">{data.history.slice(0, 10).map((entry) => <div key={entry.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border p-3 text-sm"><span className="font-medium">{entry.fieldName}</span><span className="text-muted-foreground">{entry.oldValue || "—"} → {entry.newValue || "—"}</span><time className="text-xs text-muted-foreground">{new Date(entry.changedAt).toLocaleString()}</time></div>)}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
