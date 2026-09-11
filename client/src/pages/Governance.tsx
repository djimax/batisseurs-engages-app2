import { useState } from "react";
import { CheckCircle2, ClipboardList, Gavel, Plus, ShieldCheck, Users } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoadingState } from "@/components/LoadingState";

const statusLabels: Record<string, string> = {
  draft: "Brouillon",
  scheduled: "Planifiée",
  open: "Ouverte",
  closed: "Clôturée",
  archived: "Archivée",
};

export default function Governance() {
  const [selectedId, setSelectedId] = useState<number>();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [quorumPercentage, setQuorumPercentage] = useState("50");
  const [resolutionTitle, setResolutionTitle] = useState("");
  const [participantId, setParticipantId] = useState("");
  const [mandateRole, setMandateRole] = useState("");
  const [mandateMemberId, setMandateMemberId] = useState("");
  const [mandateStartDate, setMandateStartDate] = useState("");
  const [mandateEndDate, setMandateEndDate] = useState("");

  const utils = trpc.useUtils();
  const assembliesQuery = trpc.governance.list.useQuery();
  const mandatesQuery = trpc.governance.listMandates.useQuery();
  const detailQuery = trpc.governance.getById.useQuery(
    { id: selectedId ?? 0 },
    { enabled: Boolean(selectedId) },
  );
  const createAssembly = trpc.governance.create.useMutation({
    onSuccess: (assembly) => {
      setTitle("");
      setDescription("");
      setScheduledAt("");
      setSelectedId(assembly.id);
      void utils.governance.list.invalidate();
    },
  });
  const updateStatus = trpc.governance.updateStatus.useMutation({
    onSuccess: () => {
      void utils.governance.list.invalidate();
      void utils.governance.getById.invalidate();
    },
  });
  const createResolution = trpc.governance.createResolution.useMutation({
    onSuccess: () => {
      setResolutionTitle("");
      void utils.governance.getById.invalidate();
    },
  });
  const addParticipant = trpc.governance.addParticipant.useMutation({
    onSuccess: () => {
      setParticipantId("");
      void utils.governance.getById.invalidate();
    },
  });
  const setAttendance = trpc.governance.setAttendance.useMutation({
    onSuccess: () => void utils.governance.getById.invalidate(),
  });
  const resolutionStatus = trpc.governance.updateResolutionStatus.useMutation({
    onSuccess: () => void utils.governance.getById.invalidate(),
  });
  const castVote = trpc.governance.castVote.useMutation({
    onSuccess: () => void utils.governance.getById.invalidate(),
  });
  const createMandate = trpc.governance.createMandate.useMutation({ onSuccess: () => { setMandateRole(""); setMandateMemberId(""); setMandateStartDate(""); setMandateEndDate(""); void utils.governance.listMandates.invalidate(); } });
  const updateMandateStatus = trpc.governance.updateMandateStatus.useMutation({ onSuccess: () => void utils.governance.listMandates.invalidate() });

  const handleCreate = (event: React.FormEvent) => {
    event.preventDefault();
    createAssembly.mutate({
      title,
      description: description || undefined,
      scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      quorumPercentage: Math.min(100, Math.max(1, Number(quorumPercentage) || 50)),
    });
  };

  const handleAddParticipant = (event: React.FormEvent) => {
    event.preventDefault();
    if (!selectedId || !Number.isInteger(Number(participantId))) return;
    addParticipant.mutate({ assemblyId: selectedId, memberId: Number(participantId) });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <div className="flex items-center gap-3">
            <Gavel className="h-7 w-7 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Gouvernance associative</h1>
          </div>
          <p className="mt-2 text-muted-foreground">Préparez les assemblées, contrôlez le quorum et tracez les décisions.</p>
        </div>
        <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm">
          <div className="flex items-center gap-2 font-medium"><ShieldCheck className="h-4 w-4 text-primary" />Votes uniques et clôture immuable</div>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Créer une assemblée</CardTitle>
          <CardDescription>Configurez la convocation et le seuil de quorum avant d’ajouter les participants.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2 md:col-span-2"><Label htmlFor="assembly-title">Titre</Label><Input id="assembly-title" value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Assemblée générale ordinaire 2026" required /></div>
            <div className="space-y-2 md:col-span-2"><Label htmlFor="assembly-description">Description</Label><Textarea id="assembly-description" value={description} onChange={(event) => setDescription(event.target.value)} placeholder="Objet et contexte de l’assemblée" /></div>
            <div className="space-y-2"><Label htmlFor="assembly-date">Date prévue</Label><Input id="assembly-date" type="datetime-local" value={scheduledAt} onChange={(event) => setScheduledAt(event.target.value)} /></div>
            <div className="space-y-2"><Label htmlFor="assembly-quorum">Quorum requis (%)</Label><Input id="assembly-quorum" type="number" min="1" max="100" value={quorumPercentage} onChange={(event) => setQuorumPercentage(event.target.value)} /></div>
            <div className="md:col-span-2"><Button type="submit" className="gap-2" disabled={createAssembly.isPending}><Plus className="h-4 w-4" />{createAssembly.isPending ? "Création…" : "Créer l’assemblée"}</Button></div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Mandats du bureau</CardTitle><CardDescription>Suivez les titulaires, les périodes et les renouvellements. Un rôle ne peut avoir qu’un seul mandat actif.</CardDescription></CardHeader>
        <CardContent className="space-y-4">
          <form className="grid gap-3 md:grid-cols-5" onSubmit={(event) => { event.preventDefault(); const memberId = Number(mandateMemberId); if (!Number.isInteger(memberId) || memberId <= 0 || !mandateStartDate) return; createMandate.mutate({ role: mandateRole, memberId, startDate: new Date(mandateStartDate).toISOString(), endDate: mandateEndDate ? new Date(mandateEndDate).toISOString() : undefined }); }}>
            <div className="space-y-2"><Label htmlFor="mandate-role">Fonction</Label><Input id="mandate-role" value={mandateRole} onChange={(event) => setMandateRole(event.target.value)} placeholder="Trésorier" required /></div>
            <div className="space-y-2"><Label htmlFor="mandate-member">ID membre</Label><Input id="mandate-member" type="number" min="1" value={mandateMemberId} onChange={(event) => setMandateMemberId(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="mandate-start">Début</Label><Input id="mandate-start" type="date" value={mandateStartDate} onChange={(event) => setMandateStartDate(event.target.value)} required /></div>
            <div className="space-y-2"><Label htmlFor="mandate-end">Fin facultative</Label><Input id="mandate-end" type="date" value={mandateEndDate} onChange={(event) => setMandateEndDate(event.target.value)} /></div>
            <div className="flex items-end"><Button type="submit" disabled={createMandate.isPending}><Plus className="mr-2 h-4 w-4" />Ajouter</Button></div>
          </form>
          {mandatesQuery.isLoading ? <LoadingState variant="inline" label="Chargement des mandats…" /> : mandatesQuery.data?.length ? <div className="grid gap-3 md:grid-cols-2">{mandatesQuery.data.map((mandate) => <div key={mandate.id} className="rounded-lg border p-4"><div className="flex items-start justify-between gap-3"><div><h3 className="font-semibold">{mandate.role}</h3><p className="text-sm text-muted-foreground">Membre #{mandate.memberId}</p></div><span className="rounded-full border px-2 py-1 text-xs">{mandate.status === "renewal_due" ? "À renouveler" : mandate.status === "active" ? "Actif" : mandate.status === "ended" ? "Terminé" : "Planifié"}</span></div><p className="mt-2 text-xs text-muted-foreground">Du {new Date(mandate.startDate).toLocaleDateString("fr-FR")}{mandate.endDate ? ` au ${new Date(mandate.endDate).toLocaleDateString("fr-FR")}` : " · durée ouverte"}</p><div className="mt-3 flex flex-wrap gap-2">{mandate.status === "planned" ? <Button size="sm" variant="outline" onClick={() => updateMandateStatus.mutate({ mandateId: mandate.id, status: "active" })}>Activer</Button> : null}{mandate.status === "active" ? <><Button size="sm" variant="outline" onClick={() => updateMandateStatus.mutate({ mandateId: mandate.id, status: "renewal_due" })}>À renouveler</Button><Button size="sm" variant="destructive" onClick={() => updateMandateStatus.mutate({ mandateId: mandate.id, status: "ended" })}>Terminer</Button></> : null}</div></div>)}</div> : <p className="rounded-lg border border-dashed p-5 text-sm text-muted-foreground">Aucun mandat enregistré.</p>}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <Card>
          <CardHeader><CardTitle>Assemblées</CardTitle><CardDescription>Sélectionnez une assemblée pour piloter sa séance.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            {assembliesQuery.isLoading ? <LoadingState variant="inline" label="Chargement des assemblées…" /> : null}
            {assembliesQuery.data?.map((assembly) => (
              <button key={assembly.id} type="button" onClick={() => setSelectedId(assembly.id)} className={`w-full rounded-lg border p-3 text-left transition-colors ${selectedId === assembly.id ? "border-primary bg-primary/10" : "hover:bg-muted"}`}>
                <div className="font-medium">{assembly.title}</div>
                <div className="mt-1 flex items-center justify-between text-xs text-muted-foreground"><span>{statusLabels[assembly.status]}</span><span>{assembly.quorumPercentage}%</span></div>
              </button>
            ))}
            {!assembliesQuery.isLoading && !assembliesQuery.data?.length ? <p className="text-sm text-muted-foreground">Aucune assemblée créée.</p> : null}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Détail de la séance</CardTitle><CardDescription>Présences, quorum et résolutions soumises au vote.</CardDescription></CardHeader>
          <CardContent>
            {!selectedId ? <div className="rounded-lg border border-dashed p-8 text-center text-sm text-muted-foreground">Sélectionnez une assemblée pour afficher son détail.</div> : null}
            {selectedId && detailQuery.isLoading ? <LoadingState variant="cards" label="Chargement de la séance…" /> : null}
            {detailQuery.data ? (
              <div className="space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-muted/40 p-4">
                  <div><h3 className="font-semibold">{detailQuery.data.assembly.title}</h3><p className="text-sm text-muted-foreground">Statut : {statusLabels[detailQuery.data.assembly.status]}</p></div>
                  <div className="flex flex-wrap gap-2">
                    {detailQuery.data.assembly.status === "draft" ? <Button size="sm" onClick={() => updateStatus.mutate({ assemblyId: selectedId ?? 0, status: "scheduled" })}>Planifier</Button> : null}
                    {detailQuery.data.assembly.status === "scheduled" ? <Button size="sm" onClick={() => updateStatus.mutate({ assemblyId: selectedId ?? 0, status: "open" })}>Ouvrir les votes</Button> : null}
                    {detailQuery.data.assembly.status === "open" ? <Button size="sm" variant="destructive" onClick={() => updateStatus.mutate({ assemblyId: selectedId ?? 0, status: "closed" })}>Clôturer</Button> : null}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-4">
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Éligibles</div><div className="text-2xl font-bold">{detailQuery.data.quorum.eligibleCount}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Présents</div><div className="text-2xl font-bold">{detailQuery.data.quorum.presentCount}</div></div>
                  <div className="rounded-lg border p-3"><div className="text-xs text-muted-foreground">Participation</div><div className="text-2xl font-bold">{detailQuery.data.quorum.attendancePercentage}%</div></div>
                  <div className={`rounded-lg border p-3 ${detailQuery.data.quorum.reached ? "border-emerald-500 bg-emerald-500/10" : "border-amber-500 bg-amber-500/10"}`}><div className="text-xs text-muted-foreground">Quorum</div><div className="text-2xl font-bold">{detailQuery.data.quorum.reached ? "Atteint" : "À atteindre"}</div></div>
                </div>

                <section className="space-y-3">
                  <div className="flex items-center gap-2"><Users className="h-5 w-5 text-primary" /><h3 className="font-semibold">Participants</h3></div>
                  <form onSubmit={handleAddParticipant} className="flex max-w-md gap-2"><Input type="number" min="1" value={participantId} onChange={(event) => setParticipantId(event.target.value)} placeholder="ID du membre" required /><Button type="submit" variant="outline" disabled={addParticipant.isPending}>Inviter</Button></form>
                  <div className="overflow-x-auto rounded-lg border"><table className="w-full text-sm"><thead className="bg-muted/50"><tr><th className="p-2 text-left">Membre</th><th className="p-2 text-left">Présence</th><th className="p-2 text-right">Action</th></tr></thead><tbody>{detailQuery.data.participants.map((participant) => <tr key={participant.id} className="border-t"><td className="p-2">{participant.firstName} {participant.lastName} <span className="text-xs text-muted-foreground">#{participant.memberId}</span></td><td className="p-2 capitalize">{participant.attendance}</td><td className="p-2 text-right"><Button size="sm" variant="outline" onClick={() => setAttendance.mutate({ assemblyId: selectedId ?? 0, memberId: participant.memberId, attendance: "present" })} disabled={participant.attendance === "present" || setAttendance.isPending}>Pointer présent</Button></td></tr>)}</tbody></table>{!detailQuery.data.participants.length ? <p className="p-3 text-sm text-muted-foreground">Ajoutez les membres convoqués par leur identifiant.</p> : null}</div>
                </section>

                <section className="space-y-3">
                  <div className="flex items-center gap-2"><ClipboardList className="h-5 w-5 text-primary" /><h3 className="font-semibold">Résolutions</h3></div>
                  <form onSubmit={(event) => { event.preventDefault(); if (selectedId) createResolution.mutate({ assemblyId: selectedId ?? 0, title: resolutionTitle }); }} className="flex gap-2"><Input value={resolutionTitle} onChange={(event) => setResolutionTitle(event.target.value)} placeholder="Titre de la résolution" required /><Button type="submit" variant="outline" disabled={createResolution.isPending}>Ajouter</Button></form>
                  <div className="space-y-3">{detailQuery.data.resolutions.map((resolution) => <div key={resolution.id} className="rounded-lg border p-4"><div className="flex flex-wrap items-start justify-between gap-3"><div><div className="font-medium">{resolution.title}</div><div className="text-xs text-muted-foreground">{statusLabels[resolution.status] ?? resolution.status} · {resolution.results.total} vote(s)</div></div><div className="flex flex-wrap gap-2">{resolution.status === "draft" && detailQuery.data.assembly.status === "open" ? <Button size="sm" onClick={() => resolutionStatus.mutate({ resolutionId: resolution.id, status: "open" })}>Ouvrir</Button> : null}{resolution.status === "open" ? <><Button size="sm" variant="outline" onClick={() => castVote.mutate({ resolutionId: resolution.id, choice: "for" })}>Pour</Button><Button size="sm" variant="outline" onClick={() => castVote.mutate({ resolutionId: resolution.id, choice: "against" })}>Contre</Button><Button size="sm" variant="outline" onClick={() => castVote.mutate({ resolutionId: resolution.id, choice: "abstain" })}>Abstention</Button><Button size="sm" variant="destructive" onClick={() => resolutionStatus.mutate({ resolutionId: resolution.id, status: "closed" })}>Clôturer</Button></> : null}</div></div><div className="mt-3 text-sm text-muted-foreground">Pour : {resolution.results.for} · Contre : {resolution.results.against} · Abstention : {resolution.results.abstain}</div></div>)}</div>
                  {!detailQuery.data.resolutions.length ? <p className="text-sm text-muted-foreground">Aucune résolution pour le moment.</p> : null}
                </section>

                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CheckCircle2 className="h-4 w-4" />Une résolution clôturée et un vote enregistré ne sont plus modifiables.</div>
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
