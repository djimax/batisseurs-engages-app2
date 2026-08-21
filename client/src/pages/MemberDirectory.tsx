import { useMemo, useState } from "react";
import {
  ArrowUpDown,
  BadgeCheck,
  BriefcaseBusiness,
  CalendarDays,
  Clock3,
  FileCheck2,
  HandHeart,
  History,
  Mail,
  Phone,
  Search,
  SlidersHorizontal,
  UserRound,
  X,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Pagination } from "@/components/Pagination";

type DirectoryMember = {
  id: number;
  firstName: string;
  lastName: string;
  email?: string | null;
  phone?: string | null;
  role?: string | null;
  function?: string | null;
  status: string;
  memberId?: string | null;
  photo?: string | null;
  joinedAt?: string | Date | null;
  membershipCategory?: string | null;
  skills?: string | null;
  availability?: string | null;
  contributions?: {
    cotisationsCount: number;
    lastContribution?: string | Date | null;
    historyCount: number;
    certificatesCount: number;
    recent: Array<{
      type: "cotisation" | "document";
      label: string;
      date?: string | Date | null;
      status: string;
      amount: string | null;
    }>;
  };
};

const CATEGORY_LABELS: Record<string, string> = {
  standard: "Standard",
  etudiant: "Étudiant",
  bienfaiteur: "Bienfaiteur",
  fondateur: "Fondateur",
  actif: "Actif",
  honoraire: "Honoraire",
};

function formatDate(value?: string | Date | null) {
  if (!value) return "Non renseignée";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Non renseignée" : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatCategory(category?: string | null) {
  return category ? CATEGORY_LABELS[category] ?? category : "Standard";
}

function initials(member: DirectoryMember) {
  return `${member.firstName.charAt(0)}${member.lastName.charAt(0)}`.toUpperCase();
}

type Contribution = NonNullable<DirectoryMember["contributions"]>["recent"][number];

function contributionIcon(type: Contribution["type"]) {
  return type === "cotisation" ? HandHeart : FileCheck2;
}

export default function MemberDirectory() {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"name_asc" | "name_desc" | "recent">("name_asc");
  const [page, setPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [selectedMember, setSelectedMember] = useState<DirectoryMember | null>(null);

  const queryInput = useMemo(() => ({
    search: search.trim() || undefined,
    category,
    status: "active",
    sortBy,
  }), [search, category, sortBy]);

  const { data, isLoading, isError, refetch } = trpc.members.directory.useQuery(queryInput);
  const members = (data ?? []) as DirectoryMember[];
  const totalPages = Math.max(1, Math.ceil(members.length / itemsPerPage));
  const safePage = Math.min(page, totalPages);
  const visibleMembers = members.slice((safePage - 1) * itemsPerPage, safePage * itemsPerPage);

  const resetFilters = () => {
    setSearch("");
    setCategory("all");
    setSortBy("name_asc");
    setPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleCategoryChange = (value: string) => {
    setCategory(value);
    setPage(1);
  };

  const handleSortChange = (value: "name_asc" | "name_desc" | "recent") => {
    setSortBy(value);
    setPage(1);
  };

  return (
    <div className="min-h-full bg-[linear-gradient(145deg,rgba(246,243,234,0.7),rgba(255,255,255,0.98))] px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden rounded-[2rem] border border-border/60 bg-card/90 p-6 shadow-[0_20px_60px_-35px_rgba(9,78,75,0.45)] sm:p-8">
          <div className="pointer-events-none absolute -right-16 -top-20 h-48 w-48 rounded-full bg-primary/10 blur-3xl" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/15 bg-primary/5 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
                <BadgeCheck className="h-3.5 w-3.5" /> Réseau interne
              </div>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">Annuaire des membres actifs</h1>
                <p className="mt-2 max-w-xl text-sm leading-6 text-muted-foreground sm:text-base">
                  Retrouvez rapidement les personnes engagées, leurs expertises et leurs dernières contributions à la vie de l’association.
                </p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-primary/5 px-4 py-3">
                <p className="text-2xl font-semibold text-primary">{members.length}</p>
                <p className="text-xs text-muted-foreground">Membres affichés</p>
              </div>
              <div className="rounded-2xl bg-secondary/60 px-4 py-3">
                <p className="text-2xl font-semibold text-foreground">{members.filter((m) => (m.contributions?.cotisationsCount ?? 0) > 0).length}</p>
                <p className="text-xs text-muted-foreground">Avec cotisation</p>
              </div>
              <div className="col-span-2 rounded-2xl bg-accent/60 px-4 py-3 sm:col-span-1">
                <p className="text-2xl font-semibold text-foreground">{members.filter((m) => Boolean(m.skills)).length}</p>
                <p className="text-xs text-muted-foreground">Avec compétences</p>
              </div>
            </div>
          </div>
        </section>

        <Card className="border-border/60 shadow-sm">
          <CardContent className="p-4 sm:p-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center">
              <div className="relative min-w-0 flex-1">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => handleSearchChange(event.target.value)}
                  placeholder="Rechercher un nom, un email, un ID ou une compétence…"
                  className="h-11 rounded-xl pl-9"
                  aria-label="Rechercher dans l’annuaire"
                />
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <Select value={category} onValueChange={handleCategoryChange}>
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[190px]">
                    <SlidersHorizontal className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Catégorie" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Toutes les catégories</SelectItem>
                    {Object.entries(CATEGORY_LABELS).map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}
                  </SelectContent>
                </Select>
                <Select value={sortBy} onValueChange={(value) => handleSortChange(value as typeof sortBy)}>
                  <SelectTrigger className="h-11 w-full rounded-xl sm:w-[190px]">
                    <ArrowUpDown className="mr-2 h-4 w-4 text-muted-foreground" />
                    <SelectValue placeholder="Trier" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name_asc">Nom, A → Z</SelectItem>
                    <SelectItem value="name_desc">Nom, Z → A</SelectItem>
                    <SelectItem value="recent">Inscription récente</SelectItem>
                  </SelectContent>
                </Select>
                {(search || category !== "all" || sortBy !== "name_asc") && (
                  <Button variant="outline" className="h-11 rounded-xl" onClick={resetFilters}>
                    <X className="mr-2 h-4 w-4" /> Réinitialiser
                  </Button>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {isError ? (
          <Card className="border-destructive/30 bg-destructive/5">
            <CardContent className="flex flex-col items-center gap-3 py-12 text-center">
              <p className="font-medium">L’annuaire n’a pas pu être chargé.</p>
              <p className="text-sm text-muted-foreground">Vérifiez vos droits d’accès puis réessayez.</p>
              <Button variant="outline" onClick={() => refetch()}>Réessayer</Button>
            </CardContent>
          </Card>
        ) : isLoading ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => <Card key={index}><CardContent className="space-y-4 p-5"><div className="flex items-center gap-3"><Skeleton className="h-14 w-14 rounded-2xl" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-2/3" /><Skeleton className="h-3 w-1/2" /></div></div><Skeleton className="h-16 w-full" /><Skeleton className="h-9 w-full" /></CardContent></Card>)}
          </div>
        ) : visibleMembers.length === 0 ? (
          <Card className="border-dashed border-border/80">
            <CardContent className="flex flex-col items-center gap-3 py-16 text-center">
              <div className="rounded-2xl bg-primary/8 p-4 text-primary"><UserRound className="h-7 w-7" /></div>
              <h2 className="text-lg font-semibold">Aucun membre trouvé</h2>
              <p className="max-w-md text-sm text-muted-foreground">Modifiez votre recherche ou réinitialisez les filtres pour retrouver les membres actifs.</p>
              <Button variant="outline" onClick={resetFilters}>Réinitialiser les filtres</Button>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {visibleMembers.map((member, index) => (
                <Card key={member.id} className="group overflow-hidden border-border/60 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/25 hover:shadow-[0_18px_40px_-26px_rgba(9,78,75,0.5)]" style={{ animationDelay: `${index * 35}ms` }}>
                  <CardContent className="p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        {member.photo ? <img src={member.photo} alt="" className="h-14 w-14 shrink-0 rounded-2xl object-cover ring-2 ring-primary/10" /> : <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-lg font-semibold text-primary">{initials(member)}</div>}
                        <div className="min-w-0">
                          <h2 className="truncate font-semibold text-foreground">{member.firstName} {member.lastName}</h2>
                          <p className="truncate text-xs text-muted-foreground">{member.memberId || "ID non renseigné"}</p>
                          <Badge variant="secondary" className="mt-1 text-[10px]">{formatCategory(member.membershipCategory)}</Badge>
                        </div>
                      </div>
                      <span className="mt-1 inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700"><span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> Actif</span>
                    </div>

                    <div className="mt-5 space-y-2 text-sm">
                      {(member.role || member.function) && <div className="flex items-center gap-2 text-muted-foreground"><BriefcaseBusiness className="h-4 w-4 shrink-0 text-primary/70" /><span className="truncate">{member.function || member.role}</span></div>}
                      {member.availability && <div className="flex items-center gap-2 text-muted-foreground"><Clock3 className="h-4 w-4 shrink-0 text-primary/70" /><span className="truncate">Disponible : {member.availability}</span></div>}
                      {member.skills && <p className="line-clamp-2 rounded-xl bg-muted/60 px-3 py-2 text-xs leading-5 text-muted-foreground"><span className="font-medium text-foreground">Compétences :</span> {member.skills}</p>}
                    </div>

                    <Separator className="my-4" />
                    <div className="flex items-center justify-between gap-3 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1.5"><HandHeart className="h-3.5 w-3.5 text-primary" /> {member.contributions?.cotisationsCount ?? 0} cotisation(s)</span>
                      <span className="inline-flex items-center gap-1.5"><History className="h-3.5 w-3.5 text-primary" /> {member.contributions?.historyCount ?? 0} activité(s)</span>
                    </div>
                    <Button className="mt-4 w-full rounded-xl" variant="outline" onClick={() => setSelectedMember(member)}>Voir le profil et les contributions</Button>
                  </CardContent>
                </Card>
              ))}
            </div>
            <Pagination
              currentPage={safePage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={members.length}
              onPageChange={setPage}
              onItemsPerPageChange={setItemsPerPage}
            />
          </>
        )}
      </div>

      <Dialog open={Boolean(selectedMember)} onOpenChange={(open) => !open && setSelectedMember(null)}>
        <DialogContent className="max-h-[90vh] overflow-y-auto rounded-3xl sm:max-w-2xl">
          {selectedMember && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3 text-2xl">
                  {selectedMember.photo ? <img src={selectedMember.photo} alt="" className="h-12 w-12 rounded-2xl object-cover" /> : <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-sm font-semibold text-primary">{initials(selectedMember)}</div>}
                  <span>{selectedMember.firstName} {selectedMember.lastName}</span>
                </DialogTitle>
                <DialogDescription>Profil interne du membre actif et dernières contributions connues.</DialogDescription>
              </DialogHeader>
              <div className="space-y-5">
                <div className="grid gap-3 rounded-2xl bg-muted/50 p-4 sm:grid-cols-2">
                  <div><p className="text-xs text-muted-foreground">Identifiant membre</p><p className="font-medium">{selectedMember.memberId || "Non renseigné"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Catégorie</p><p className="font-medium">{formatCategory(selectedMember.membershipCategory)}</p></div>
                  <div><p className="text-xs text-muted-foreground">Rôle / fonction</p><p className="font-medium">{selectedMember.function || selectedMember.role || "Non renseigné"}</p></div>
                  <div><p className="text-xs text-muted-foreground">Membre depuis</p><p className="font-medium">{formatDate(selectedMember.joinedAt)}</p></div>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  {selectedMember.email && <a href={`mailto:${selectedMember.email}`} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 text-sm transition-colors hover:bg-muted"><Mail className="h-4 w-4 text-primary" /><span className="truncate">{selectedMember.email}</span></a>}
                  {selectedMember.phone && <a href={`tel:${selectedMember.phone}`} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3 text-sm transition-colors hover:bg-muted"><Phone className="h-4 w-4 text-primary" /><span>{selectedMember.phone}</span></a>}
                </div>

                {(selectedMember.skills || selectedMember.availability) && <div className="grid gap-3 sm:grid-cols-2"><div className="rounded-2xl border border-border/60 p-4"><p className="text-xs text-muted-foreground">Compétences</p><p className="mt-1 text-sm leading-6">{selectedMember.skills || "Non renseignées"}</p></div><div className="rounded-2xl border border-border/60 p-4"><p className="text-xs text-muted-foreground">Disponibilités</p><p className="mt-1 text-sm leading-6">{selectedMember.availability || "Non renseignées"}</p></div></div>}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3"><div><h3 className="font-semibold">Contributions récentes</h3><p className="text-xs text-muted-foreground">Les dernières cotisations et attestations enregistrées.</p></div><Badge variant="secondary">{selectedMember.contributions?.recent.length ?? 0} élément(s)</Badge></div>
                  {selectedMember.contributions?.recent.length ? <div className="space-y-2">{selectedMember.contributions.recent.map((contribution, index) => { const Icon = contributionIcon(contribution.type); return <div key={`${contribution.type}-${contribution.date}-${index}`} className="flex items-center gap-3 rounded-2xl border border-border/60 p-3"><div className="rounded-xl bg-primary/8 p-2 text-primary"><Icon className="h-4 w-4" /></div><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{contribution.label}</p><p className="text-xs text-muted-foreground">{formatDate(contribution.date)} · {contribution.status}</p></div>{contribution.amount && <span className="text-sm font-semibold text-foreground">{contribution.amount}</span>}</div>; })}</div> : <div className="rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">Aucune contribution récente enregistrée.</div>}
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" /> Dernière contribution : {formatDate(selectedMember.contributions?.lastContribution)}</div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
