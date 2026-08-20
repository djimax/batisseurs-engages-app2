import { useMemo, useState } from "react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { BookOpen, Edit, MessageCircle, Plus, Send, Trash2 } from "lucide-react";
import { toast } from "sonner";

type NewsStatus = "draft" | "published" | "archived";
type FormState = { title: string; excerpt: string; content: string; category: string; status: NewsStatus };
const EMPTY_FORM: FormState = { title: "", excerpt: "", content: "", category: "general", status: "draft" };

export default function News() {
  const { data: user } = trpc.auth.me.useQuery();
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published" | "archived">("all");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const utils = trpc.useUtils();
  const { data: articles = [], isLoading } = trpc.news.getAll.useQuery(statusFilter === "all" ? undefined : { status: statusFilter });
  const commentsInput = useMemo(() => ({ newsId: selectedNewsId ?? 0 }), [selectedNewsId]);
  const { data: comments = [], isLoading: commentsLoading } = trpc.news.getComments.useQuery(commentsInput, { enabled: Boolean(selectedNewsId) });
  const canManage = user?.role === "admin";

  const createMutation = trpc.news.create.useMutation({ onSuccess: () => { toast.success("Actualité enregistrée"); setDialogOpen(false); setForm(EMPTY_FORM); void utils.news.getAll.invalidate(); }, onError: (error) => toast.error(error.message) });
  const updateMutation = trpc.news.update.useMutation({ onSuccess: () => { toast.success("Actualité mise à jour"); setDialogOpen(false); setEditingId(null); setForm(EMPTY_FORM); void utils.news.getAll.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteMutation = trpc.news.delete.useMutation({ onSuccess: () => { toast.success("Actualité supprimée"); void utils.news.getAll.invalidate(); }, onError: (error) => toast.error(error.message) });
  const addCommentMutation = trpc.news.addComment.useMutation({ onSuccess: () => { setComment(""); toast.success("Commentaire ajouté"); void utils.news.getComments.invalidate(); }, onError: (error) => toast.error(error.message) });
  const deleteCommentMutation = trpc.news.deleteComment.useMutation({ onSuccess: () => { toast.success("Commentaire supprimé"); void utils.news.getComments.invalidate(); }, onError: (error) => toast.error(error.message) });

  const openCreate = () => { setEditingId(null); setForm(EMPTY_FORM); setDialogOpen(true); };
  const openEdit = (article: (typeof articles)[number]) => { setEditingId(article.id); setForm({ title: article.title, excerpt: article.excerpt ?? "", content: article.content, category: article.category ?? "general", status: article.status }); setDialogOpen(true); };
  const openComments = (newsId: number) => { setSelectedNewsId(newsId); setCommentDialogOpen(true); };
  const submit = (event: React.FormEvent) => { event.preventDefault(); if (editingId) updateMutation.mutate({ id: editingId, ...form, excerpt: form.excerpt || null }); else createMutation.mutate({ ...form, excerpt: form.excerpt || undefined }); };
  const submitComment = (event: React.FormEvent) => { event.preventDefault(); if (selectedNewsId && comment.trim()) addCommentMutation.mutate({ newsId: selectedNewsId, content: comment.trim() }); };
  const remove = (id: number) => { if (window.confirm("Supprimer cette actualité et ses commentaires ?")) deleteMutation.mutate({ id }); };

  return (
    <div className="space-y-6 animate-fade-in-up">
      <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center"><div><div className="flex items-center gap-3"><BookOpen className="h-7 w-7 text-primary" /><h1 className="text-3xl font-bold tracking-tight">Actualités</h1></div><p className="mt-2 text-muted-foreground">Partagez les évolutions, décisions et temps forts de l’association.</p></div>{canManage && <Button onClick={openCreate} className="button-interactive gap-2"><Plus className="h-4 w-4" />Nouvelle actualité</Button>}</div>
      <Card><CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><CardTitle>Publications</CardTitle><CardDescription>Les articles et commentaires sont conservés dans l’espace de communication.</CardDescription></div><Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}><SelectTrigger className="w-full sm:w-44"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Tous les statuts</SelectItem><SelectItem value="published">Publiées</SelectItem><SelectItem value="draft">Brouillons</SelectItem><SelectItem value="archived">Archivées</SelectItem></SelectContent></Select></CardHeader><CardContent className="space-y-4">
        {isLoading ? <p className="py-8 text-center text-sm text-muted-foreground">Chargement des actualités…</p> : articles.length === 0 ? <div className="rounded-xl border border-dashed p-10 text-center"><BookOpen className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="font-medium">Aucune actualité enregistrée</p><p className="mt-1 text-sm text-muted-foreground">Publiez un article lorsque vous aurez une information à transmettre.</p></div> : articles.map((article) => <article key={article.id} className="rounded-xl border bg-card p-5 transition-all hover:-translate-y-0.5 hover:shadow-sm"><div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between"><div className="space-y-2"><div className="flex flex-wrap items-center gap-2"><h2 className="text-lg font-semibold">{article.title}</h2><Badge variant="outline">{article.category}</Badge><Badge variant="secondary">{article.status === "published" ? "Publiée" : article.status === "draft" ? "Brouillon" : "Archivée"}</Badge></div>{article.excerpt && <p className="text-sm font-medium text-foreground/80">{article.excerpt}</p>}<p className="whitespace-pre-wrap text-sm leading-6 text-muted-foreground">{article.content}</p></div>{canManage && <div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" onClick={() => openEdit(article)} aria-label="Modifier"><Edit className="h-4 w-4" /></Button><Button variant="ghost" size="sm" onClick={() => remove(article.id)} aria-label="Supprimer"><Trash2 className="h-4 w-4 text-destructive" /></Button></div>}</div><div className="mt-4 flex flex-wrap items-center gap-3 text-xs text-muted-foreground"><span>Créée le {new Date(article.createdAt).toLocaleDateString("fr-FR")}</span><span>{article.viewCount ?? 0} vue{article.viewCount === 1 ? "" : "s"}</span><Button variant="outline" size="sm" className="ml-auto gap-2" onClick={() => openComments(article.id)}><MessageCircle className="h-4 w-4" />Commentaires</Button></div></article>)}
      </CardContent></Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}><DialogContent><DialogHeader><DialogTitle>{editingId ? "Modifier l’actualité" : "Créer une actualité"}</DialogTitle><DialogDescription>Rédigez une publication claire et durable.</DialogDescription></DialogHeader><form onSubmit={submit} className="space-y-4"><div className="space-y-2"><Label htmlFor="news-title">Titre</Label><Input id="news-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} maxLength={255} required /></div><div className="space-y-2"><Label htmlFor="news-excerpt">Résumé</Label><Input id="news-excerpt" value={form.excerpt} onChange={(event) => setForm({ ...form, excerpt: event.target.value })} maxLength={500} /></div><div className="space-y-2"><Label htmlFor="news-content">Contenu</Label><Textarea id="news-content" value={form.content} onChange={(event) => setForm({ ...form, content: event.target.value })} rows={7} required /></div><div className="grid gap-4 sm:grid-cols-2"><div className="space-y-2"><Label htmlFor="news-category">Catégorie</Label><Input id="news-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} maxLength={100} required /></div><div className="space-y-2"><Label>Statut</Label><Select value={form.status} onValueChange={(value) => setForm({ ...form, status: value as FormState["status"] })}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="draft">Brouillon</SelectItem><SelectItem value="published">Publier</SelectItem><SelectItem value="archived">Archiver</SelectItem></SelectContent></Select></div></div><div className="flex justify-end gap-2"><Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Annuler</Button><Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>{editingId ? "Enregistrer" : "Enregistrer"}</Button></div></form></DialogContent></Dialog>

      <Dialog open={commentDialogOpen} onOpenChange={setCommentDialogOpen}><DialogContent><DialogHeader><DialogTitle>Commentaires</DialogTitle><DialogDescription>Échangez avec les membres autour de cette actualité.</DialogDescription></DialogHeader><div className="max-h-72 space-y-3 overflow-y-auto">{commentsLoading ? <p className="text-sm text-muted-foreground">Chargement…</p> : comments.length === 0 ? <p className="text-sm text-muted-foreground">Aucun commentaire pour le moment.</p> : comments.map((item) => <div key={item.id} className="rounded-lg bg-muted/45 p-3"><div className="flex items-start justify-between gap-3"><p className="whitespace-pre-wrap text-sm">{item.content}</p>{(canManage || item.authorId === user?.id) && <Button variant="ghost" size="sm" onClick={() => deleteCommentMutation.mutate({ id: item.id })} aria-label="Supprimer le commentaire"><Trash2 className="h-4 w-4 text-destructive" /></Button>}</div><p className="mt-2 text-xs text-muted-foreground">Utilisateur #{item.authorId} · {new Date(item.createdAt).toLocaleString("fr-FR")}</p></div>)}</div><form onSubmit={submitComment} className="flex gap-2"><Input value={comment} onChange={(event) => setComment(event.target.value)} placeholder="Écrire un commentaire…" maxLength={5000} /><Button type="submit" disabled={!comment.trim() || addCommentMutation.isPending} aria-label="Envoyer"><Send className="h-4 w-4" /></Button></form></DialogContent></Dialog>
    </div>
  );
}
