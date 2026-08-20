import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { AlertCircle, Bell, Edit, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";

type AnnouncementPriority = "low" | "medium" | "high" | "urgent";
type AnnouncementStatus = "draft" | "published" | "archived";
type FormState = { title: string; content: string; priority: AnnouncementPriority; category: string; status: AnnouncementStatus; expiresAt: string };
const EMPTY_FORM: FormState = { title: "", content: "", priority: "medium", category: "general", status: "published", expiresAt: "" };
const priorityLabels = { low: "Basse", medium: "Normale", high: "Élevée", urgent: "Urgente" } as const;
const priorityVariants = { low: "outline", medium: "secondary", high: "default", urgent: "destructive" } as const;

export default function Announcements() {
  const { data: user } = trpc.auth.me.useQuery();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const utils = trpc.useUtils();
  const { data: announcements = [], isLoading } = trpc.announcements.getAll.useQuery(statusFilter === "all" ? undefined : { status: statusFilter });
  const canManage = user?.role === "admin";

  const createMutation = trpc.announcements.create.useMutation({
    onSuccess: () => { toast.success("Annonce publiée"); setDialogOpen(false); setForm(EMPTY_FORM); void utils.announcements.getAll.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const updateMutation = trpc.announcements.update.useMutation({
    onSuccess: () => { toast.success("Annonce mise à jour"); setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); void utils.announcements.getAll.invalidate(); },
    onError: (error) => toast.error(error.message),
  });
  const deleteMutation = trpc.announcements.delete.useMutation({
    onSuccess: () => { toast.success("Annonce supprimée"); void utils.announcements.getAll.invalidate(); },
    onError: (error) => toast.error(error.message),
  });

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (announcement: (typeof announcements)[number]) => {
    setEditingId(announcement.id);
    setForm({ title: announcement.title, content: announcement.content, priority: announcement.priority, category: announcement.category, status: announcement.status, expiresAt: announcement.expiresAt ? new Date(announcement.expiresAt).toISOString().slice(0, 10) : "" });
    setDialogOpen(true);
  };
  const submit = (event: React.FormEvent) => {
    event.preventDefault();
    const payload = { ...form, expiresAt: form.expiresAt ? new Date(`${form.expiresAt}T23:59:59`).toISOString() : null };
    if (editingId) updateMutation.mutate({ id: editingId, ...payload });
    else createMutation.mutate(payload);
  };
  const remove = (id: number) => { if (window.confirm("Supprimer définitivement cette annonce ?")) deleteMutation.mutate({ id }); };
  const urgentCount = announcements.filter((item) => item.priority === "urgent" && item.status === "published").length;
  const expiredCount = announcements.filter((item) => item.expiresAt && new Date(item.expiresAt) < new Date()).length;

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
        <div><div className="flex items-center gap-3"><Bell className="h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight">Annonces</h1></div><p className="mt-2 text-muted-foreground">Informez les membres avec des messages suivis et historisés.</p></div>
        {canManage && <Button onClick={openCreate} className="button-interactive gap-2"><Plus className="h-4 w-4" />Nouvelle annonce</Button>}
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card><CardHeader className="pb-2"><CardDescription>Annonces visibles</CardDescription><CardTitle className="text-3xl">{announcements.filter((item) => item.status === "published").length}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Données persistées de l’association</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>Priorité urgente</CardDescription><CardTitle className="text-3xl text-destructive">{urgentCount}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">À traiter rapidement</p></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardDescription>À archiver</CardDescription><CardTitle className="text-3xl">{expiredCount}</CardTitle></CardHeader><CardContent><p className="text-xs text-muted-foreground">Annonces arrivées à échéance</p></CardContent></Card>
      </div>

      <Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Fil d’information</CardTitle><CardDescription>Les annonces sont conservées dans l’historique de communication.</CardDescription></div><Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="published">Publiées</SelectItem><SelectItem value="draft">Brouillons</SelectItem><SelectItem value="archived">Archivées</SelectItem></SelectContent></Select></CardHeader><CardContent className="space-y-4">
        {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement des annonces…</p> : announcements.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><AlertCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Aucune annonce enregistrée</p><p className="mt-1 text-sm text-muted-foreground">Créez une annonce lorsque votre association aura une information à partager.</p></div> : announcements.map((announcement) => {
          const expired = announcement.expiresAt ? new Date(announcement.expiresAt) < new Date() : false;
          return <article key={announcement.id} className={`rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm ${expired ? "opacity-65" : ""}`}><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{announcement.title}</h2><Badge variant={priorityVariants[announcement.priority]}>{priorityLabels[announcement.priority]}</Badge><Badge variant="outline">{announcement.category}</Badge><Badge variant="secondary">{announcement.status === "published" ? "Publiée" : announcement.status === "draft" ? "Brouillon" : "Archivée"}</Badge></div><p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{announcement.content}</p></div>{canManage && <div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(announcement)} aria-label="Modifier"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => remove(announcement.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}</div><div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground"><span>Créée le {new Date(announcement.createdAt).toLocaleDateString("fr-FR")}</span>{announcement.publishedAt && <span>Publiée le {new Date(announcement.publishedAt).toLocaleDateString("fr-FR")}</span>}{announcement.expiresAt && <span>{expired ? "Expirée le" : "Expire le"} {new Date(announcement.expiresAt).toLocaleDateString("fr-FR")}</span>}</div></article>;
        })}
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingId ? "Modifier l’annonce" : "Créer une annonce"}</DialogTitle><DialogDescription>Rédigez un message clair, daté et utile aux membres.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="announcement-title">Titre</Label><Input id="announcement-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="announcement-content">Contenu</Label><Textarea id="announcement-content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={5} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label>Priorité</Label><Select value={form.priority} onValueChange={(value) => setForm({ ...form, priority: value as FormState["priority"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="low">Basse</SelectItem><SelectItem value="medium">Normale</SelectItem><SelectItem value="high">Élevée</SelectItem><SelectItem value="urgent">Urgente</SelectItem></SelectContent></Select></div><div className="space-y-2"><Label>Statut</Label><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as FormState["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="published">Publiée</SelectItem><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="archived">Archivée</SelectItem></SelectContent></Select></div></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="announcement-category">Catégorie</Label><Input id="announcement-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} maxLength={100} required /></div><div className="space-y-2"><Label htmlFor="announcement-expires">Date d’expiration</Label><Input id="announcement-expires" type="date" value={form.expiresAt} onChange={(event) => setForm({ ...form, expiresAt: event.target.value })} /></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Enregistrer" : "Publier"}</Button></div></form></DialogContent></Dialog>
    </div>
  );
}
