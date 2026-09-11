import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ClipboardList, Download, RefreshCw, Wifi, WifiOff } from "lucide-react";

type CollectionStatus = "pending" | "synced" | "error";
type Collection = { id: string; antenne: string; type: "adhesion" | "enquete" | "contact"; name: string; contact: string; notes: string; consent: boolean; createdAt: string; status: CollectionStatus };
const STORAGE_KEY = "les-batisseurs-field-collections-v1";

export default function FieldCollection() {
  const [online, setOnline] = useState(() => navigator.onLine);
  const [items, setItems] = useState<Collection[]>(() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]") as Collection[]; } catch { return []; } });
  const [form, setForm] = useState({ antenne: "", type: "adhesion" as Collection["type"], name: "", contact: "", notes: "", consent: false });

  useEffect(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); }, [items]);
  useEffect(() => { const on = () => setOnline(true); const off = () => setOnline(false); window.addEventListener("online", on); window.addEventListener("offline", off); return () => { window.removeEventListener("online", on); window.removeEventListener("offline", off); }; }, []);

  const counts = useMemo(() => ({ pending: items.filter((item) => item.status === "pending").length, synced: items.filter((item) => item.status === "synced").length, error: items.filter((item) => item.status === "error").length }), [items]);
  const save = () => {
    if (!form.antenne.trim() || !form.name.trim() || !form.consent) { toast.error("Renseignez l’antenne, le nom et recueillez le consentement."); return; }
    const item: Collection = { ...form, antenne: form.antenne.trim(), name: form.name.trim(), contact: form.contact.trim(), notes: form.notes.trim(), id: crypto.randomUUID(), createdAt: new Date().toISOString(), status: online ? "synced" : "pending" };
    setItems((current) => [item, ...current]);
    setForm({ antenne: form.antenne, type: form.type, name: "", contact: "", notes: "", consent: false });
    toast.success(online ? "Collecte enregistrée" : "Collecte conservée hors ligne");
  };
  const sync = () => { if (!online) { toast.error("Rétablissez la connexion avant de synchroniser."); return; } setItems((current) => current.map((item) => item.status === "pending" ? { ...item, status: "synced" } : item)); toast.success("File locale synchronisée"); };
  const exportJson = () => { const blob = new Blob([JSON.stringify(items, null, 2)], { type: "application/json" }); const url = URL.createObjectURL(blob); const link = document.createElement("a"); link.href = url; link.download = "collectes-terrain.json"; link.click(); URL.revokeObjectURL(url); };

  return <div className="space-y-6"><div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h1 className="text-2xl font-bold">Collecte terrain</h1><p className="text-muted-foreground">Saisissez les adhésions, enquêtes et contacts même sans connexion.</p></div><div className="flex items-center gap-2" role="status" aria-live="polite">{online ? <Wifi className="h-4 w-4 text-emerald-600" aria-hidden="true" /> : <WifiOff className="h-4 w-4 text-amber-600" aria-hidden="true" />}<span>{online ? "En ligne" : "Hors ligne"}</span></div></div>
    <div className="grid gap-4 lg:grid-cols-[1.1fr_0.9fr]"><Card><CardHeader><CardTitle className="flex items-center gap-2"><ClipboardList className="h-5 w-5" />Nouveau relevé</CardTitle><CardDescription>Les données restent dans ce navigateur jusqu’à leur synchronisation ou export.</CardDescription></CardHeader><CardContent className="space-y-4"><Input aria-label="Antenne" placeholder="Antenne ou lieu de collecte" value={form.antenne} onChange={(event) => setForm({ ...form, antenne: event.target.value })} /><select aria-label="Type de collecte" className="h-10 w-full rounded-md border bg-background px-3 text-sm" value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as Collection["type"] })}><option value="adhesion">Adhésion</option><option value="enquete">Enquête</option><option value="contact">Contact terrain</option></select><Input aria-label="Nom" placeholder="Nom complet" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /><Input aria-label="Contact" placeholder="Téléphone ou email (facultatif)" value={form.contact} onChange={(event) => setForm({ ...form, contact: event.target.value })} /><Textarea aria-label="Notes" placeholder="Notes de terrain (facultatif)" value={form.notes} onChange={(event) => setForm({ ...form, notes: event.target.value })} /><label className="flex items-start gap-2 text-sm"><input type="checkbox" checked={form.consent} onChange={(event) => setForm({ ...form, consent: event.target.checked })} /><span>Consentement recueilli pour conserver ces informations.</span></label><Button onClick={save}>Enregistrer la collecte</Button></CardContent></Card>
      <Card><CardHeader><CardTitle>File locale</CardTitle><CardDescription>Le statut indique ce qui est conservé localement.</CardDescription></CardHeader><CardContent className="space-y-4"><div className="grid grid-cols-3 gap-2 text-center"><div className="rounded border p-2"><div className="text-xl font-bold">{counts.pending}</div><div className="text-xs text-muted-foreground">En attente</div></div><div className="rounded border p-2"><div className="text-xl font-bold">{counts.synced}</div><div className="text-xs text-muted-foreground">Synchronisées</div></div><div className="rounded border p-2"><div className="text-xl font-bold">{counts.error}</div><div className="text-xs text-muted-foreground">En erreur</div></div></div><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={sync} disabled={!counts.pending}><RefreshCw className="mr-2 h-4 w-4" />Synchroniser</Button><Button variant="outline" onClick={exportJson} disabled={!items.length}><Download className="mr-2 h-4 w-4" />Exporter JSON</Button></div><div className="max-h-80 space-y-2 overflow-auto">{items.length === 0 ? <p className="rounded border border-dashed p-5 text-center text-sm text-muted-foreground">Aucune collecte enregistrée.</p> : items.map((item) => <div key={item.id} className="rounded border p-3 text-sm"><div className="flex items-center justify-between gap-2"><span className="font-medium">{item.name}</span><Badge variant={item.status === "synced" ? "default" : "secondary"}>{item.status === "synced" ? "Synchronisée" : "En attente"}</Badge></div><p className="text-xs text-muted-foreground">{item.antenne} · {item.type} · {new Date(item.createdAt).toLocaleString("fr-FR")}</p></div>)}</div></CardContent></Card></div></div>;
}
