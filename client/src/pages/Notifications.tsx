import { useState } from "react";
import { Bell, CheckCheck, ExternalLink, Mail, Radio, Settings2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { LoadingState } from "@/components/LoadingState";
import { getErrorMessage } from "@/lib/uxFeedback";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useNotificationRealtime } from "@/hooks/useNotificationRealtime";

const TYPE_LABELS: Record<string, string> = { info: "Information", warning: "Alerte", error: "Erreur", success: "Succès" };

export default function Notifications() {
  const [unreadOnly, setUnreadOnly] = useState(false);
  const utils = trpc.useUtils();
  const realtime = useNotificationRealtime();
  const query = trpc.notifications.list.useQuery({ unreadOnly, limit: 50 });
  const preferences = trpc.notifications.preferences.useQuery();
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => utils.notifications.list.invalidate(), onError: (error) => toast.error(getErrorMessage(error, "Impossible de marquer la notification")) });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => { toast.success("Notifications marquées comme lues"); utils.notifications.list.invalidate(); }, onError: (error) => toast.error(getErrorMessage(error, "Impossible de marquer les notifications")) });
  const updatePreferences = trpc.notifications.updatePreferences.useMutation({ onSuccess: () => { toast.success("Préférences enregistrées"); utils.notifications.preferences.invalidate(); }, onError: (error) => toast.error(getErrorMessage(error, "Impossible d’enregistrer les préférences")) });

  if (query.isLoading) return <LoadingState label="Chargement des notifications…" />;

  const items = query.data?.notifications ?? [];
  const unreadCount = query.data?.unreadCount ?? 0;
  const preference = preferences.data;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div><div className="flex flex-wrap items-center gap-3"><h1 className="text-3xl font-bold tracking-tight">Notifications</h1><Badge variant="outline" className="gap-1.5"><Radio className={`h-3.5 w-3.5 ${realtime.isLive ? "text-emerald-600" : "text-amber-600"}`} />{realtime.isLive ? "Temps réel actif" : realtime.status === "polling" ? "Synchronisation de secours" : "Connexion en cours"}</Badge></div><p className="mt-2 text-muted-foreground">Retrouvez vos alertes et gérez vos préférences de communication sans recharger la page.</p><p className="sr-only" aria-live="polite">{realtime.isLive ? "Les notifications sont synchronisées en temps réel." : realtime.status === "polling" ? "Le temps réel est indisponible ; synchronisation de secours active." : "Connexion au service de notifications en cours."}</p></div>
        <div className="flex gap-2"><Button variant={unreadOnly ? "default" : "outline"} onClick={() => setUnreadOnly((value) => !value)}><Bell className="mr-2 h-4 w-4" />Non lues ({unreadCount})</Button><Button variant="outline" aria-label={markAllRead.isPending ? "Marquage de toutes les notifications en cours" : "Marquer toutes les notifications comme lues"} aria-busy={markAllRead.isPending} onClick={() => markAllRead.mutate()} disabled={unreadCount === 0 || markAllRead.isPending}><CheckCheck className="mr-2 h-4 w-4" />{markAllRead.isPending ? "Marquage…" : "Tout marquer lu"}</Button></div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.35fr_0.65fr]">
        <Card><CardHeader><CardTitle>Centre de notifications</CardTitle><CardDescription>{items.length} notification(s) affichée(s)</CardDescription></CardHeader><CardContent className="space-y-3">
          {items.length === 0 ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Aucune notification à afficher.</div> : items.map((item) => <article key={item.id} className={`rounded-lg border p-4 transition-colors ${item.isRead ? "bg-background" : "border-primary/30 bg-primary/5"}`}>
            <div className="flex items-start justify-between gap-3"><div className="flex min-w-0 gap-3"><span className={`mt-1 h-2.5 w-2.5 shrink-0 rounded-full ${item.isRead ? "bg-muted-foreground/30" : "bg-primary"}`} /><div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h2 className="font-semibold">{item.title}</h2><Badge variant="secondary">{TYPE_LABELS[item.type] ?? item.type}</Badge></div><p className="mt-1 text-sm text-muted-foreground">{item.message}</p><time className="mt-2 block text-xs text-muted-foreground">{new Date(item.createdAt).toLocaleString("fr-FR")}</time></div></div><div className="flex shrink-0 gap-1">{item.actionUrl && <Button size="icon" variant="ghost" asChild><a href={item.actionUrl} aria-label="Ouvrir l’action"><ExternalLink className="h-4 w-4" /></a></Button>}{!item.isRead && <Button size="sm" variant="outline" onClick={() => markRead.mutate({ notificationId: item.id })}>Marquer lu</Button>}</div></div>
          </article>)}
        </CardContent></Card>

        <Card><CardHeader><CardTitle className="flex items-center gap-2"><Settings2 className="h-5 w-5" />Préférences</CardTitle><CardDescription>Choisissez les canaux actifs pour votre compte.</CardDescription></CardHeader><CardContent className="space-y-5">
          <label className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><Bell className="h-4 w-4" />Notifications dans l’application</span><Switch checked={preference?.inAppEnabled === 1} onCheckedChange={(checked) => updatePreferences.mutate({ inAppEnabled: checked })} disabled={updatePreferences.isPending} /></label>
          <label className="flex items-center justify-between gap-3 text-sm"><span className="flex items-center gap-2"><Mail className="h-4 w-4" />Notifications par email</span><Switch checked={preference?.emailEnabled === 1} onCheckedChange={(checked) => updatePreferences.mutate({ emailEnabled: checked })} disabled={updatePreferences.isPending} /></label>
          <p className="text-xs text-muted-foreground">Les notifications critiques peuvent rester visibles dans l’application même si les emails sont désactivés.</p>
        </CardContent></Card>
      </div>
    </div>
  );
}
