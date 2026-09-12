import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BriefcaseBusiness,
  Check,
  FolderKanban,
  Clock3,
  HandHeart,
  MapPin,
  Search,
  Sparkles,
  Users,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Pagination } from "@/components/Pagination";
import { ViewModeToggle, type ViewMode } from "@/components/ViewModeToggle";

const SKILLS = [
  { value: "communication", label: "Communication" },
  { value: "technique", label: "Technique" },
  { value: "terrain", label: "Terrain" },
  { value: "logistique", label: "Logistique" },
];

const AVAILABILITIES = [
  { value: "weekend", label: "Week-end" },
  { value: "soir", label: "Soirée" },
  { value: "temps_partiel", label: "Temps partiel" },
  { value: "permanent", label: "Permanent" },
];

type Volunteer = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  function?: string | null;
  photo?: string | null;
  memberID?: string | null;
  skills?: string | null;
  availability?: string | null;
  status?: string | null;
  assignments?: {
    projects: Array<{ id: number; projectId: number; projectName?: string | null; role: string; joinedAt?: string | Date | null }>;
    groups: Array<{ id: number; groupeId: number; groupeName?: string | null; antenneId?: number | null; antenneName?: string | null; role: string; joinedAt?: string | Date | null }>;
  };
};

function initials(volunteer: Volunteer) {
  return `${volunteer.firstName.charAt(0)}${volunteer.lastName.charAt(0)}`.toUpperCase();
}

function labelFor(values: Array<{ value: string; label: string }>, value?: string | null) {
  return values.find((item) => item.value === value)?.label ?? value ?? "Non renseignée";
}

function volunteerStatusLabel(status?: string | null) {
  return status === "active" ? "Actif" : status === "pending" ? "En attente" : status === "inactive" ? "Inactif" : status === "archived" ? "Archivé" : "Statut non renseigné";
}

function volunteerStatusClass(status?: string | null) {
  return status === "active" ? "bg-emerald-50 text-emerald-700 hover:bg-emerald-50" : status === "pending" ? "bg-amber-50 text-amber-700 hover:bg-amber-50" : "bg-muted text-muted-foreground hover:bg-muted";
}

export default function VolunteerPortal() {
  const [search, setSearch] = useState("");
  const [skill, setSkill] = useState("all");
  const [availability, setAvailability] = useState("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc">("name_asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedVolunteer, setSelectedVolunteer] = useState<Volunteer | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [skillsDraft, setSkillsDraft] = useState("");
  const [availabilityDraft, setAvailabilityDraft] = useState("");
  const [assignmentType, setAssignmentType] = useState<"project" | "group">("project");
  const [selectedProjectId, setSelectedProjectId] = useState("");
  const [selectedAntennaId, setSelectedAntennaId] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [assignmentError, setAssignmentError] = useState("");

  const input = useMemo(() => ({
    search: search.trim() || undefined,
    skill,
    availability,
  }), [search, skill, availability]);

  const { data, isLoading, isError, refetch } = trpc.volunteers.list.useQuery(input);
  const { data: projects = [] } = trpc.projects.list.useQuery({ limit: 100, offset: 0 });
  const { data: antennasData } = trpc.antennes.list.useQuery({ search: "", sortBy: "name", sortOrder: "asc", page: 1, limit: 100 });
  const { data: groups = [] } = trpc.groupes.listByAntenne.useQuery(
    { antenneId: Number(selectedAntennaId) },
    { enabled: assignmentType === "group" && Number(selectedAntennaId) > 0 },
  );
  const availableProjects = projects as Array<{ id: number; name: string }>;
  const availableAntennas = (antennasData?.data ?? []) as Array<{ id: number; name: string; city?: string }>;
  const availableGroups = groups as Array<{ id: number; name: string }>;
  const volunteers = useMemo(() => [...((data ?? []) as Volunteer[])].sort((a, b) => {
    const left = `${a.lastName} ${a.firstName}`;
    const right = `${b.lastName} ${b.firstName}`;
    return sortBy === "name_desc" ? right.localeCompare(left) : left.localeCompare(right);
  }), [data, sortBy]);
  const totalPages = Math.max(1, Math.ceil(volunteers.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const visibleVolunteers = volunteers.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);
  const updateProfile = trpc.volunteers.updateProfile.useMutation({
    onSuccess: async () => {
      setSelectedVolunteer(null);
      await refetch();
    },
  });
  const assignProject = trpc.volunteers.assignProject.useMutation({
    onSuccess: async () => {
      setAssignmentError("");
      setSelectedProjectId("");
      setSelectedGroupId("");
      await refetch();
    },
    onError: (error) => setAssignmentError(error.message),
  });

  const openVolunteer = (volunteer: Volunteer) => {
    setSelectedVolunteer(volunteer);
    setSkillsDraft(volunteer.skills ?? "");
    setAvailabilityDraft(volunteer.availability ?? "");
    setAssignmentError("");
    setSelectedProjectId("");
    setSelectedGroupId("");
    setSelectedAntennaId("");
  };

  const resetFilters = () => {
    setSearch("");
    setSkill("all");
    setAvailability("all");
    setSortBy("name_asc");
    setPage(1);
  };

  return (
    <div className="min-h-full bg-[linear-gradient(145deg,rgba(246,243,234,0.72),rgba(255,255,255,0.98))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_20px_60px_-35px_rgba(9,78,75,0.45)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary"><Sparkles className="h-3.5 w-3.5" /> Coordination des équipes</div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">Portail des bénévoles</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">Identifiez les forces disponibles, consultez les compétences et maintenez les disponibilités à jour pour mieux organiser les actions de terrain.</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-primary/5 px-4 py-3"><p className="text-2xl font-semibold text-primary">{volunteers.length}</p><p className="text-xs text-muted-foreground">Bénévoles trouvés</p></div>
              <div className="rounded-2xl bg-secondary/60 px-4 py-3"><p className="text-2xl font-semibold">{volunteers.filter((item) => Boolean(item.skills)).length}</p><p className="text-xs text-muted-foreground">Profils qualifiés</p></div>
            </div>
          </div>
        </section>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1); }} placeholder="Rechercher un bénévole ou une compétence…" className="h-11 rounded-xl pl-9" aria-label="Rechercher un bénévole" /></div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={skill} onValueChange={(value) => { setSkill(value); setPage(1); }}><SelectTrigger className="h-11 w-full rounded-xl sm:w-[175px]"><HandHeart className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Compétence" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes compétences</SelectItem>{SKILLS.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
                <Select value={availability} onValueChange={(value) => { setAvailability(value); setPage(1); }}><SelectTrigger className="h-11 w-full rounded-xl sm:w-[175px]"><Clock3 className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Disponibilité" /></SelectTrigger><SelectContent><SelectItem value="all">Toutes disponibilités</SelectItem>{AVAILABILITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select>
                <Select value={sortBy} onValueChange={(value) => { setSortBy(value as typeof sortBy); setPage(1); }}><SelectTrigger className="h-11 w-full rounded-xl sm:w-[175px]"><ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" /><SelectValue placeholder="Trier" /></SelectTrigger><SelectContent><SelectItem value="name_asc">Nom, A → Z</SelectItem><SelectItem value="name_desc">Nom, Z → A</SelectItem></SelectContent></Select>
                {(search || skill !== "all" || availability !== "all" || sortBy !== "name_asc") && <Button variant="outline" className="h-11 rounded-xl" onClick={resetFilters}>Réinitialiser</Button>}
                <ViewModeToggle value={viewMode} onChange={setViewMode} label="Mode d’affichage du portail bénévoles" />
              </div>
            </div>
          </CardContent>
        </Card>

        {isError ? <Card className="border-destructive/30 bg-destructive/5"><CardContent className="flex flex-col items-center gap-3 py-12 text-center"><p className="font-medium">Le portail bénévole n’a pas pu être chargé.</p><p className="text-sm text-muted-foreground">Vérifiez votre permission de consultation puis réessayez.</p><Button variant="outline" onClick={() => refetch()}>Réessayer</Button></CardContent></Card> : isLoading ? <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, index) => <Card key={index}><CardContent className="space-y-4 p-5"><div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div><Skeleton className="h-14 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>)}</div> : visibleVolunteers.length === 0 ? <Card className="border-dashed"><CardContent className="flex flex-col items-center gap-3 py-16 text-center"><Users className="h-8 w-8 text-primary" /><h2 className="text-lg font-semibold">Aucun bénévole ne correspond aux filtres</h2><p className="text-sm text-muted-foreground">Essayez une autre compétence, disponibilité ou recherche.</p><Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button></CardContent></Card> : <>{viewMode === "list" ? <div className="overflow-x-auto rounded-xl border"><table className="w-full text-sm"><caption className="sr-only">Liste numérotée des bénévoles</caption><thead className="bg-muted/50"><tr><th className="w-14 p-3 text-left">N°</th><th className="p-3 text-left">Bénévole</th><th className="p-3 text-left">Compétences</th><th className="p-3 text-left">Disponibilité</th><th className="p-3 text-left">Statut</th><th className="p-3 text-right">Action</th></tr></thead><tbody>{visibleVolunteers.map((volunteer, index) => <tr key={volunteer.id} className="border-t"><td className="p-3 font-mono text-xs text-muted-foreground">{(safePage - 1) * itemsPerPage + index + 1}</td><td className="p-3 font-medium">{volunteer.firstName} {volunteer.lastName}<div className="text-xs text-muted-foreground">{volunteer.memberID ?? "ID non renseigné"}</div></td><td className="p-3">{volunteer.skills || "Non renseignées"}</td><td className="p-3">{labelFor(AVAILABILITIES, volunteer.availability)}</td><td className="p-3"><Badge className={volunteerStatusClass(volunteer.status)}>{volunteerStatusLabel(volunteer.status)}</Badge></td><td className="p-3 text-right"><Button size="sm" variant="outline" onClick={() => openVolunteer(volunteer)}>Gérer</Button></td></tr>)}</tbody></table></div> : <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{visibleVolunteers.map((volunteer, index) => <Card key={volunteer.id} className="group border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_40px_-26px_rgba(9,78,75,0.5)]"><CardContent className="p-5"><div className="flex items-start justify-between gap-3"><div className="flex min-w-0 items-center gap-3">{volunteer.photo ? <img src={volunteer.photo} alt="" loading="lazy" decoding="async" className="h-14 w-14 shrink-0 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">{initials(volunteer)}</div>}<div className="min-w-0"><h2 className="truncate font-semibold">{volunteer.firstName} {volunteer.lastName}</h2><p className="truncate text-xs text-muted-foreground">{volunteer.memberID ?? "ID non renseigné"}</p></div></div><Badge className={volunteerStatusClass(volunteer.status)}>{volunteerStatusLabel(volunteer.status)}</Badge></div><Separator className="my-4" /><div className="space-y-2 text-sm text-muted-foreground">{(volunteer.function || volunteer.role) && <div className="flex items-center gap-2"><BriefcaseBusiness className="h-4 w-4 text-primary" />{volunteer.function || volunteer.role}</div>}<div className="flex items-center gap-2"><Clock3 className="h-4 w-4 text-primary" />{labelFor(AVAILABILITIES, volunteer.availability)}</div>{volunteer.skills ? <p className="line-clamp-2 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-5"><span className="font-medium text-foreground">Compétences :</span> {volunteer.skills}</p> : <p className="rounded-xl bg-muted/60 px-3 py-2 text-xs">Compétences non renseignées</p>}</div>{(volunteer.assignments?.projects.length || volunteer.assignments?.groups.length) ? <div className="mt-3 space-y-1 rounded-xl bg-primary/5 px-3 py-2 text-xs text-muted-foreground"><p className="font-medium text-foreground">Affectations</p>{volunteer.assignments?.projects.slice(0, 2).map((assignment) => <p key={`project-${assignment.id}`} className="flex items-center gap-1.5"><FolderKanban className="h-3.5 w-3.5 text-primary" />{assignment.projectName || "Projet"}</p>)}{volunteer.assignments?.groups.slice(0, 2).map((assignment) => <p key={`group-${assignment.id}`} className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-primary" />{assignment.antenneName ? `${assignment.antenneName} · ` : ""}{assignment.groupeName || "Groupe"}</p>)}</div> : <p className="mt-3 text-xs text-muted-foreground">Aucune affectation active</p>}<Button className="mt-4 w-full rounded-xl" variant="outline" onClick={() => openVolunteer(volunteer)}>Gérer le profil bénévole</Button></CardContent></Card>)}</div>}<Pagination currentPage={safePage} totalPages={totalPages} itemsPerPage={itemsPerPage} totalItems={volunteers.length} onPageChange={setPage} onItemsPerPageChange={setItemsPerPage} /></>}
      </div>

      <Dialog open={Boolean(selectedVolunteer)} onOpenChange={(open) => !open && setSelectedVolunteer(null)}>
        <DialogContent className="rounded-3xl sm:max-w-xl">
          {selectedVolunteer && <><DialogHeader><DialogTitle>Profil bénévole</DialogTitle><DialogDescription>Mettez à jour les informations utiles à la coordination des équipes.</DialogDescription></DialogHeader><div className="space-y-5"><div className="flex items-center gap-3 rounded-2xl bg-muted/50 p-4">{selectedVolunteer.photo ? <img src={selectedVolunteer.photo} alt="" loading="lazy" decoding="async" className="h-14 w-14 rounded-2xl object-cover" /> : <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 font-semibold text-primary">{initials(selectedVolunteer)}</div>}<div><p className="font-semibold">{selectedVolunteer.firstName} {selectedVolunteer.lastName}</p><p className="text-sm text-muted-foreground">{selectedVolunteer.email || "Email non renseigné"}</p></div></div><div className="space-y-2"><Label htmlFor="volunteer-skills">Compétences</Label><Textarea id="volunteer-skills" value={skillsDraft} onChange={(event) => setSkillsDraft(event.target.value)} placeholder="Ex. communication, mobilisation terrain, photographie…" rows={4} /></div><div className="space-y-2"><Label htmlFor="volunteer-availability">Disponibilité</Label><Select value={availabilityDraft || "none"} onValueChange={(value) => setAvailabilityDraft(value === "none" ? "" : value)}><SelectTrigger id="volunteer-availability"><SelectValue placeholder="Sélectionner une disponibilité" /></SelectTrigger><SelectContent><SelectItem value="none">Non renseignée</SelectItem>{AVAILABILITIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div><div className="space-y-3 rounded-2xl border border-primary/15 bg-primary/5 p-4"><div><p className="font-medium">Affecter à une action</p><p className="text-xs text-muted-foreground">Rattachez ce bénévole à un projet ou à un groupe d’antenne.</p></div><Select value={assignmentType} onValueChange={(value) => { setAssignmentType(value as "project" | "group"); setSelectedProjectId(""); setSelectedGroupId(""); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="project">Projet</SelectItem><SelectItem value="group">Groupe d’antenne</SelectItem></SelectContent></Select>{assignmentType === "project" ? <Select value={selectedProjectId || "none"} onValueChange={(value) => setSelectedProjectId(value === "none" ? "" : value)}><SelectTrigger><SelectValue placeholder="Sélectionner un projet" /></SelectTrigger><SelectContent><SelectItem value="none">Sélectionner un projet</SelectItem>{availableProjects.map((project) => <SelectItem key={project.id} value={String(project.id)}>{project.name}</SelectItem>)}</SelectContent></Select> : <div className="space-y-3"><Select value={selectedAntennaId || "none"} onValueChange={(value) => { setSelectedAntennaId(value === "none" ? "" : value); setSelectedGroupId(""); }}><SelectTrigger><SelectValue placeholder="Sélectionner une antenne" /></SelectTrigger><SelectContent><SelectItem value="none">Sélectionner une antenne</SelectItem>{availableAntennas.map((antenna) => <SelectItem key={antenna.id} value={String(antenna.id)}>{antenna.name}{antenna.city ? ` · ${antenna.city}` : ""}</SelectItem>)}</SelectContent></Select><Select value={selectedGroupId || "none"} onValueChange={(value) => setSelectedGroupId(value === "none" ? "" : value)} disabled={!selectedAntennaId}><SelectTrigger><SelectValue placeholder="Sélectionner un groupe" /></SelectTrigger><SelectContent><SelectItem value="none">Sélectionner un groupe</SelectItem>{availableGroups.map((group) => <SelectItem key={group.id} value={String(group.id)}>{group.name}</SelectItem>)}</SelectContent></Select></div>}<Button className="w-full rounded-xl" variant="secondary" onClick={() => { setAssignmentError(""); assignProject.mutate(assignmentType === "project" ? { memberId: selectedVolunteer.id, projectId: Number(selectedProjectId) } : { memberId: selectedVolunteer.id, groupId: Number(selectedGroupId) }); }} disabled={assignProject.isPending || (assignmentType === "project" ? !selectedProjectId : !selectedGroupId)}>{assignProject.isPending ? "Affectation…" : <><MapPin className="mr-2 h-4 w-4" /> Affecter</>}</Button>{assignmentError && <p className="text-sm text-destructive">{assignmentError}</p>}</div><Button className="w-full rounded-xl" onClick={() => updateProfile.mutate({ memberId: selectedVolunteer.id, skills: skillsDraft.trim() || undefined, availability: availabilityDraft || undefined })} disabled={updateProfile.isPending}>{updateProfile.isPending ? "Enregistrement…" : <><Check className="mr-2 h-4 w-4" /> Enregistrer le profil</>}</Button>{updateProfile.isError && <p className="text-sm text-destructive">{updateProfile.error.message}</p>}</div></>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
